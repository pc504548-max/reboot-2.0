import { useState, type FormEvent } from 'react'
import { useAuth, type AuthProvider } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { firebaseConfigured } from '@/lib/firebase'
export function AuthPage() {
  const {signIn,signUp,resetPassword,error,clearError}=useAuth()
  const [signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[notice,setNotice]=useState('')
  async function run(provider:AuthProvider) {
    if(busy)return
    setBusy(true);setNotice('')
    try {if(provider==='email'&&signup)await signUp(email,password);else await signIn(provider,email,password);useUI.getState().setMode('beta')}
    catch{/* The account store supplies the actionable message. */}finally{setBusy(false)}
  }
  async function reset(){setBusy(true);setNotice('');try{await resetPassword(email);setNotice('If an account uses this email, a password-reset link is on its way.')}catch{}finally{setBusy(false)}}
  return <main className="identity-page"><div className="identity-orbit" aria-hidden="true"/><section className="identity-card">
    <button className="text-link" onClick={()=>useUI.getState().setMode('city')}>← Back to planet Reboot</button>
    <p className="eyebrow">YOUR PLACE IN THE UNIVERSE</p><h1>{signup?'Give your ideas a future.':'Welcome back, explorer.'}</h1>
    <p>Create an identity, then request beta access. The owner approves permanent publishing; you can explore and build temporary ideas now.</p>
    {!firebaseConfigured&&<p className="guest-notice">Account sign-in is not configured on this preview. Anonymous building mode is available.</p>}
    <div className="identity-providers"><button disabled={busy||!firebaseConfigured} onClick={()=>run('google')}>Google</button><button disabled={busy||!firebaseConfigured} onClick={()=>run('github')}>GitHub</button></div>
    <form onSubmit={(e:FormEvent)=>{e.preventDefault();run('email')}}>
      <label>Email<input type="email" autoComplete="email" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input type="password" autoComplete={signup?'new-password':'current-password'} minLength={signup?6:undefined} required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p className="creation-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
      <button className="btn-primary" disabled={busy||!firebaseConfigured}>{busy?'Connecting…':signup?'Create beta identity':'Sign in'}</button>
    </form>
    <div className="identity-links"><button disabled={busy} onClick={()=>{setSignup(!signup);clearError();setNotice('')}}>{signup?'Already registered? Sign in':'New here? Create an account'}</button><button disabled={busy||!firebaseConfigured} onClick={reset}>Reset password</button></div>
    <button className="guest-entry" disabled={busy} onClick={()=>useUI.getState().setMode('city')}>Explore anonymously →</button>
    <small>Temporary ideas stay in this tab for up to 24 hours. After signing in, choose “Save to account” to keep them.</small>
  </section></main>
}
