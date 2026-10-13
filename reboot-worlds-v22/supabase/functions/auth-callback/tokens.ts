const encoder = new TextEncoder()
function decode(part: string) {
  return Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0))
}
function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
export async function verifyFirebaseToken(token: string, projectId: string, keys: (JsonWebKey & {kid?: string})[], now = Math.floor(Date.now()/1000)) {
  const parts = token.split('.')
  if (parts.length !== 3 || !projectId) throw new Error('Invalid identity token')
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])))
  const payload = JSON.parse(new TextDecoder().decode(decode(parts[1])))
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Invalid signing algorithm')
  if (payload.iss !== `https://securetoken.google.com/${projectId}` || payload.aud !== projectId || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128 || !Number.isFinite(payload.exp) || payload.exp <= now || !Number.isFinite(payload.iat) || payload.iat > now + 30 || !Number.isFinite(payload.auth_time) || payload.auth_time > now + 30) throw new Error('Invalid identity claims')
  const jwk = keys.find(key=>key.kid === header.kid)
  if (!jwk) throw new Error('Unknown signing key')
  const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify'])
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(`${parts[0]}.${parts[1]}`))) throw new Error('Invalid signature')
  return {uid: payload.sub as string, verifiedEmail: payload.email_verified === true && typeof payload.email === 'string' && payload.email.length >= 3 && payload.email.length <= 254 ? payload.email as string : null}
}
export async function signDatabaseToken(uid: string, secret: string, now = Math.floor(Date.now()/1000), verifiedEmail: string | null = null) {
  if (secret.length < 32) throw new Error('Database JWT signing secret is not configured')
  const expires_at = now + 900
  const header = encode(encoder.encode(JSON.stringify({alg:'HS256',typ:'JWT'})))
  const body = encode(encoder.encode(JSON.stringify({...(verifiedEmail?{email:verifiedEmail}:{}),sub:uid,firebase_uid:uid,role:'authenticated',aud:'authenticated',iat:now,exp:expires_at})))
  const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(`${header}.${body}`)))
  return {access_token:`${header}.${body}.${encode(signature)}`,expires_at}
}
