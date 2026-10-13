import { useAuth,useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { WorldDialog } from '../WorldDialog'
export function GuestProjects({onClose}:{onClose:()=>void}) {
  const projects=useProjects(s=>s.projects),saving=useProjects(s=>s.savingDrafts),error=useProjects(s=>s.error),user=useAuth(s=>s.user)
  const drafts=projects.filter(p=>p.temporary)
  return <WorldDialog title="Your temporary ideas" onClose={onClose} busy={saving.length>0}>
    <p className="dialog-intro">These buildings belong to this tab. They expire after 24 hours or when it closes. Saving to your account makes a project public on Reboot.</p>
    {!user&&<button className="btn-primary" onClick={()=>{onClose();useUI.getState().setMode('auth')}}>Sign in to keep your ideas</button>}
    {!drafts.length&&<p>No temporary ideas remain. Saved buildings now belong to your account.</p>}
    <div className="guest-project-list">{drafts.map(p=><article key={p.id}><div><strong>{p.name}</strong><small>{p.category} · Expires {new Date(p.expiresAt!).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></div><div>
      <button disabled={saving.includes(p.id)} onClick={()=>{useUI.getState().setMode('zero');useUI.getState().selectProject(p.id);onClose()}}>Visit</button>
      {user&&<button disabled={saving.includes(p.id)} onClick={()=>useProjects.getState().saveGuestProject(p.id)}>{saving.includes(p.id)?'Saving…':'Save to account'}</button>}
      <button disabled={saving.includes(p.id)} onClick={()=>{useProjects.getState().discardGuestProject(p.id);if(useUI.getState().selectedProjectId===p.id)useUI.getState().selectProject(null)}}>Discard</button>
    </div></article>)}</div>{error&&<p role="alert" className="creation-error">{error}</p>}
  </WorldDialog>
}
