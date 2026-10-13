import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
test('public catalog uses the actual SDK without a private token; protected calls still fail closed',async()=>{
 const original=globalThis.fetch;let requests=0,exchanges=0
 globalThis.identityOutageFixture={currentUser:null}
 globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify([{id:'public-record'}]),{status:200,headers:{'Content-Type':'application/json'}})}
 const server=await createServer({cacheDir:'node_modules/.vite-public-tests',server:{middlewareMode:true},appType:'custom',plugins:[{name:'identity-outage-fixture',enforce:'pre',resolveId(id,importer){if(id==='./firebase'&&importer?.endsWith('/src/lib/supabase.ts'))return '\0identity-outage'},load(id){if(id==='\0identity-outage')return "export const firebaseAuth=globalThis.identityOutageFixture;"}}]})
 try{const {publicSupabase,supabase}=await server.ssrLoadModule('/src/lib/supabase.ts');globalThis.identityOutageFixture.currentUser={uid:'signed-in-fixture',getIdToken:async()=>{exchanges++;throw new Error('Identity exchange unavailable')}};const result=await publicSupabase.from('projects').select('*');assert.equal(result.error,null);assert.equal(result.data[0].id,'public-record');assert.equal(requests,1);assert.equal(exchanges,0);const denied=await supabase.from('projects').insert({name:'private'});assert.match(denied.error.message,/Identity exchange unavailable/);assert.equal(exchanges,1);assert.equal(requests,1)}
 finally{globalThis.fetch=original;delete globalThis.identityOutageFixture;await server.close()}
})
