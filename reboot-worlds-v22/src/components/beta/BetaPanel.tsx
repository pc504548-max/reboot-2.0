import { useEffect, useState } from 'react'
import { useAuth } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { betaCall, type BetaStatus } from '@/lib/beta'
interface Overview {config:{member_limit:number;project_limit:number;member_project_limit:number;owner_project_limit:number};approved:number;pending:number;projects:number;requests:{uid:string;email:string;note:string;created_at:string}[];feedback:{id:string;uid:string;message:string;created_at:string}[]}
export function BetaPanel(){
 const user=useAuth(s=>s.user)
 // Remount all private state on identity changes.
 return <BetaAccount key={user?.uid??'guest'} />
}
function BetaAccount(){
 const user=useAuth(s=>s.user),[status,setStatus]=useState<BetaStatus|null>(null),[overview,setOverview]=useState<Overview|null>(null)
 const [note,setNote]=useState(''),[feedback,setFeedback]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [limits,setLimits]=useState<Overview['config']|null>(null)
 useEffect(()=>{let live=true;if(user)betaCall<BetaStatus>('beta_status').then(s=>{if(live)setStatus(s)}).catch(e=>{if(live)setMessage(e.message)});return()=>{live=false}},[user?.uid])
 async function refresh(){const s=await betaCall<BetaStatus>('beta_status');setStatus(s);if(s.admin){const o=await betaCall<Overview>('admin_beta_overview');setOverview(o);setLimits(o.config)}}
 async function run(action:()=>Promise<unknown>,success:string){setBusy(true);setMessage('');try{await action();await refresh();setMessage(success)}catch(e){setMessage(e instanceof Error?e.message:'Please retry.')}finally{setBusy(false)}}
 return <main className="beta-page"><header><p className="eyebrow">REBOOT / EARLY ACCESS</p><h1>Your place in the beta.</h1><p>Explore freely. Request a place to publish permanent ideas and help shape Reboot.</p><button onClick={()=>useUI.getState().setMode('city')}>← Back to Reboot</button></header>
 <section className="beta-card"><h2>{status?.admin?'Owner access':status?.status==='approved'?'You’re in.':status?.status==='pending'?'Your request is waiting.':'Pre-register for beta'}</h2>
 {!user?<><p>Sign in or create an identity first. Only the owner can approve beta requests; your request is private.</p><button className="btn-primary" onClick={()=>useUI.getState().setMode('auth')}>Sign in to pre-register</button></>:<>
 {status&&<p>{status.status==='rejected'?'Your request wasn’t accepted this time. You can still explore anonymously.':status.status==='pending'?'You can keep exploring while the owner reviews your request.':status.admin||status.status==='approved'?`${status.myProjects} / ${status.myProjectLimit} permanent buildings used.`:'Start with a short introduction. No long application.'}</p>}
 {status?.status==='none'&&<form onSubmit={e=>{e.preventDefault();void run(()=>betaCall('request_beta',{contact_email:user.email??'no-email@identity.invalid',introduction:note}),'Request sent. The owner will review it.')}}><label>What would you like to try? <small>Optional</small><textarea maxLength={600} value={note} onChange={e=>setNote(e.target.value)} /></label><button disabled={busy} className="btn-primary">Request beta access</button></form>}
 {status&&<p className="muted">Beta target: {status.memberLimit.toLocaleString()} approved members. Guest mode: 20 temporary buildings per tab, up to 24 hours.</p>}
 <button disabled={busy} onClick={()=>run(refresh,'Access refreshed.')}>Refresh access</button>
 </>}
 </section>
 {status&&(status.admin||status.status==='approved')&&<section className="beta-card"><h2>Send feedback</h2><p>What worked? What felt confusing? Only the owner can read this.</p><form onSubmit={e=>{e.preventDefault();void run(async()=>{await betaCall('submit_feedback',{message_text:feedback});setFeedback('')},'Thanks — your feedback reached the owner.')}}><label>Your feedback<textarea required minLength={5} maxLength={2000} value={feedback} onChange={e=>setFeedback(e.target.value)}/></label><button disabled={busy}>Send feedback</button></form><small>Up to five messages per day.</small></section>}
 {status?.admin&&<section className="beta-card owner-panel"><h2>Owner control room</h2><button disabled={busy} onClick={()=>run(refresh,'Control room updated.')}>Load approvals & capacity</button>{overview&&limits&&<>
 <p>{overview.approved} approved · {overview.pending} waiting · {overview.projects} permanent projects</p>
 <form onSubmit={e=>{e.preventDefault();void run(()=>betaCall('admin_set_limits',{members:limits.member_limit,projects_total:limits.project_limit,per_member:limits.member_project_limit,per_owner:limits.owner_project_limit}),'Limits saved.')}}>
 {([['member_limit','Approved beta members',100000],['project_limit','Total permanent projects',1000000],['member_project_limit','Buildings per member',10000],['owner_project_limit','Your buildings',100000]] as const).map(([key,label,max])=><label key={key}>{label}<input type="number" min={1} max={max} required value={limits[key]} onChange={e=>setLimits({...limits,[key]:Number(e.target.value)})}/></label>)}<button disabled={busy}>Save limits</button></form>
 <p className="muted">These are enforced quotas, not a performance guarantee. City scenes show up to 120 project buildings; records load in pages of 500. Hardware and hosting capacity need load testing before increasing the beta.</p>
 <h3>Private requests</h3><p>Oldest 200 pending requests. Review these to reveal the next batch.</p>{overview.requests.map(r=><article key={r.uid}><strong>{r.email}</strong><small style={{display:'block'}}>Firebase UID: {r.uid}</small><p>{r.note||'No introduction provided.'}</p><button disabled={busy} onClick={()=>run(()=>betaCall('admin_review_beta',{request_uid:r.uid,approve:true}),'Member approved.')}>Accept</button><button disabled={busy} onClick={()=>run(()=>betaCall('admin_review_beta',{request_uid:r.uid,approve:false}),'Request declined.')}>Decline</button></article>)}{!overview.requests.length&&<p>No pending requests.</p>}
 <h3>Latest feedback</h3>{overview.feedback.map(f=><article key={f.id}><small>{new Date(f.created_at).toLocaleString()}</small><p>{f.message}</p></article>)}{!overview.feedback.length&&<p>No feedback yet.</p>}
 </>}</section>}
 {message&&<p className="beta-message" role="status">{message}</p>}
 </main>
}
