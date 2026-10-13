import { createClient } from '@supabase/supabase-js'
import { firebaseAuth } from './firebase'
import { createTokenBridge } from './authBridge'
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const dataConfigured = Boolean(url && anonKey) && import.meta.env.VITE_LOCAL_PREVIEW !== 'true'
export const databaseSession = createTokenBridge(async idToken => {
  if (!dataConfigured) throw new Error('Project saving is not configured yet. Your temporary ideas are still available in this tab.')
  const res = await fetch(`${url}/functions/v1/auth-callback`, {
    method: 'POST', headers: {'Content-Type':'application/json', apikey:anonKey},
    body: JSON.stringify({idToken}), signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error('Signed in, but project saving is unavailable. Retry saving shortly; your draft is still here.')
  return res.json()
})
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'unconfigured-public-client', {
  accessToken: () => databaseSession.token(firebaseAuth?.currentUser ?? null),
  auth: {persistSession:false, autoRefreshToken:false, detectSessionInUrl:false},
})

// Public browsing must not depend on the private token exchange succeeding.
export const publicSupabase = createClient(url || 'http://localhost:54321', anonKey || 'unconfigured-public-client', {
  accessToken: async () => null,
  auth: {persistSession:false, autoRefreshToken:false, detectSessionInUrl:false},
})
