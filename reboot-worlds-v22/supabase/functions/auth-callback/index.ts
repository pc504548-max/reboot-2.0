import { verifyFirebaseToken, signDatabaseToken } from './tokens.ts'
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Client-Info, Apikey','Content-Type':'application/json','Cache-Control':'no-store'}
let cache: {keys:(JsonWebKey & {kid?:string})[]; expires:number} | null = null
async function keys() {
  if (cache && cache.expires > Date.now()) return cache.keys
  const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com', {signal:AbortSignal.timeout(10000)})
  if (!res.ok) throw new Error('Identity verification unavailable')
  const jwks = await res.json()
  if (!Array.isArray(jwks.keys)) throw new Error('Invalid verification keys')
  cache = {keys:jwks.keys, expires:Date.now()+300000}
  return cache.keys
}
Deno.serve(async req => {
  if(req.method === 'OPTIONS') return new Response(null,{status:204,headers})
  if(req.method !== 'POST') return new Response(JSON.stringify({error:'POST required'}),{status:405,headers})
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')
  // This is the project's legacy JWT signing secret, NEVER its service-role API key.
  const secret = Deno.env.get('REBOOT_SUPABASE_JWT_SECRET')
  if (!projectId || !secret || secret.length < 32) return new Response(JSON.stringify({error:'Account bridge is not configured'}),{status:503,headers})
  try {
    const {idToken} = await req.json()
    if (typeof idToken !== 'string' || idToken.length > 16000) throw new Error('Invalid token')
    const identity = await verifyFirebaseToken(idToken,projectId,await keys())
    return new Response(JSON.stringify(await signDatabaseToken(identity.uid,secret,undefined,identity.verifiedEmail)),{status:200,headers})
  } catch {
    return new Response(JSON.stringify({error:'Identity verification failed. Please sign in again.'}),{status:401,headers})
  }
})
