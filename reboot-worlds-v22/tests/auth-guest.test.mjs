import {test,before,after} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
let server,bridge,guest,tokens,appearance
before(async()=>{
 server=await createServer({cacheDir:'node_modules/.vite-auth-tests',server:{middlewareMode:true},appType:'custom'})
 appearance=await server.ssrLoadModule('/src/lib/buildingAppearance.ts')
 bridge=await server.ssrLoadModule('/src/lib/authBridge.ts')
 guest=await server.ssrLoadModule('/src/lib/guestProjects.ts')
 tokens=await server.ssrLoadModule('/supabase/functions/auth-callback/tokens.ts')
})
after(async()=>server?.close())
test('database token exchange is deduplicated, identity scoped and invalidated on signout',async()=>{
 let calls=0,release
 const exchange=()=>{calls++;return new Promise(resolve=>release=resolve)}
 const b=bridge.createTokenBridge(exchange),u={uid:'a',getIdToken:async()=> 'firebase-a'}
 const first=b.token(u),second=b.token(u);await new Promise(r=>setImmediate(r))
 assert.equal(calls,1);release({access_token:'db-a',expires_at:Date.now()/1000+900})
 assert.equal(await first,'db-a');assert.equal(await second,'db-a');assert.equal(await b.token(u),'db-a')
 b.clear();const stale=b.token(u);await new Promise(r=>setImmediate(r));b.clear();release({access_token:'stale',expires_at:Date.now()/1000+900})
 await assert.rejects(stale,/Account changed/);assert.equal(await b.token(null),null)
})
test('expired token response is rejected and failed exchanges can be retried',async()=>{
 let calls=0;const b=bridge.createTokenBridge(async()=>({access_token:'token',expires_at:++calls===1?1:Date.now()/1000+900})),u={uid:'a',getIdToken:async()=>''}
 await assert.rejects(b.token(u),/invalid session/);assert.equal(await b.token(u),'token')
})
test('guest storage rejects corrupt, malformed and expired records',()=>{
 assert.deepEqual(guest.readGuestProjects('{'),[])
 assert.deepEqual(guest.readGuestProjects('[{"temporary":true}]'),[])
 const input={name:'Test',tagline:'Test',description:'',category:'AI',status:'alive',stage:1,momentum:0,founder:'Guest',followers:0,tags:[],connections:[],foundedYear:2026,failureYear:null,failureReason:null}
 const draft=guest.makeGuestProject(input,1000000000000)
 assert.equal(guest.readGuestProjects(JSON.stringify([draft]),1000000000001).length,1)
 assert.deepEqual(guest.readGuestProjects(JSON.stringify([draft]),1000000000000+guest.GUEST_LIFETIME),[])
})
const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url')
test('Firebase verification requires the correct signature, project and valid claims',async()=>{
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify'])
 const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-key'}
 const now=2000000000,claims={iss:'https://securetoken.google.com/reboot-test',aud:'reboot-test',sub:'synthetic-owner',iat:now-60,auth_time:now-60,exp:now+300}
 async function token(p=claims,alg='RS256'){const data=encode({alg,kid:'test-key'})+'.'+encode(p);return data+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,Buffer.from(data))).toString('base64url')}
 assert.deepEqual(await tokens.verifyFirebaseToken(await token(),'reboot-test',[jwk],now),{uid:'synthetic-owner',verifiedEmail:null})
 for(const patch of [{aud:'another-project'},{sub:''},{exp:now},{iat:now+100},{auth_time:now+100}])await assert.rejects(tokens.verifyFirebaseToken(await token({...claims,...patch}),'reboot-test',[jwk],now))
 await assert.rejects(tokens.verifyFirebaseToken(await token(claims,'HS256'),'reboot-test',[jwk],now))
 assert.equal((await tokens.verifyFirebaseToken(await token({...claims,email:'trusted@example.invalid',email_verified:true}),'reboot-test',[jwk],now)).verifiedEmail,'trusted@example.invalid')
 assert.equal((await tokens.verifyFirebaseToken(await token({...claims,email:'forged@example.invalid',email_verified:false}),'reboot-test',[jwk],now)).verifiedEmail,null)
 const valid=await token(),parts=valid.split('.');parts[1]=encode({...claims,sub:'attacker'})
 await assert.rejects(tokens.verifyFirebaseToken(parts.join('.'),'reboot-test',[jwk],now),/signature/)
})
test('database JWT uses configured signing secret, correct owner and short expiry; no refresh token',async()=>{
 const secret='synthetic-test-secret-with-32-plus-characters',now=2000000000
 const result=await tokens.signDatabaseToken('owner',secret,now),[head,body,sig]=result.access_token.split('.')
 const key=await crypto.subtle.importKey('raw',Buffer.from(secret),{name:'HMAC',hash:'SHA-256'},false,['verify'])
 assert.equal(await crypto.subtle.verify('HMAC',key,Buffer.from(sig,'base64url'),Buffer.from(head+'.'+body)),true)
 const payload=JSON.parse(Buffer.from(body,'base64url'));assert.equal(payload.firebase_uid,'owner');assert.equal(payload.role,'authenticated');assert.equal(payload.exp,now+900);assert.equal(result.refresh_token,undefined);assert.equal(payload.email,undefined)
 const withEmail=await tokens.signDatabaseToken('owner',secret,now,'trusted@example.invalid');assert.equal(JSON.parse(Buffer.from(withEmail.access_token.split('.')[1],'base64url')).email,'trusted@example.invalid')
 await assert.rejects(tokens.signDatabaseToken('owner',''),/not configured/)
})

test('untrusted appearance values cannot produce oversized or NaN geometry',()=>{
 assert.deepEqual(appearance.normalizeAppearance(null),{})
 assert.deepEqual(appearance.normalizeAppearance({height:'99999',glowIntensity:NaN,color:'javascript:bad',style:'anything'}),{})
 assert.deepEqual(appearance.normalizeAppearance({height:100000,glowIntensity:-10,color:'#aaccee',style:'crystal'}),{height:2,glowIntensity:.5,color:'#aaccee',style:'crystal'})
 assert.deepEqual(appearance.normalizeAppearance({height:Infinity}),{})
})

test('HTTP LAN drafts use secure UUIDs when randomUUID is unavailable', () => {
 // Replace the method with an absent value to reproduce an insecure context.
 const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID')
 Object.defineProperty(crypto, 'randomUUID', {value:undefined, configurable:true})
 try {
  const input={name:'LAN draft',tagline:'Preview',description:'',category:'AI',status:'alive',stage:1,momentum:0,founder:'Guest',followers:0,tags:[],connections:[],foundedYear:2026,failureYear:null,failureReason:null}
  const draft=guest.makeGuestProject(input)
  assert.match(draft.id,/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i)
  assert.notEqual(guest.makeGuestProject(input).id,draft.id)
  assert.equal(guest.readGuestProjects(JSON.stringify([draft]))[0].id,draft.id)
 } finally {
  if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor)
  else delete crypto.randomUUID
 }
})
