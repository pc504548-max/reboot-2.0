import { useState } from 'react'
import { useAuth,useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { computeAwards } from '@/types/project'
import { CITIES } from '../cityRegistry'
import { CITY_STORIES } from './cityDesign'
import { useDistrictSignals } from './districtSignals'
export function LandmarkConsole() {
  const {landmark,resident,close,preview,repairPreview}=useDistrictSignals()
  const all=useProjects(s=>s.projects),user=useAuth(s=>s.user),id=useUI(s=>s.selectedProjectId)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  if(resident) return <aside className="landmark-console"><button className="record-close" aria-label="Close resident" onClick={close}>✕</button><p className="eyebrow">DISTRICT INHABITANT</p><h2>{CITY_STORIES[resident.city].roles[Math.floor(resident.index/4)%3]}</h2><p>{CITY_STORIES[resident.city].sites[resident.index%4]}</p><p>A fictional inhabitant tending this district. Select a project or activate the landmark to send a signal through the work sites.</p></aside>
  if(!landmark)return null
  const records=all.filter(p=>landmark==='IdeaHub'?['abandoned','reviving','decaying'].includes(p.status):landmark==='Legend'?computeAwards(p).some(a=>a.type!=='founder'&&a.type!=='innovator'):landmark==='AI'||landmark==='Graveyard'?!!p.failureReason:p.category===landmark)
  const project=records.find(p=>p.id===id)
  const canEdit=project&&(project.temporary||project.ownerId===user?.uid)
  async function revive(){if(!project||busy)return;setBusy(true);setError('');try{const saved=await useProjects.getState().updateProject(project.id,{status:'reviving'});if(saved)useDistrictSignals.getState().signal();else setError(useProjects.getState().error||'Could not save.')}finally{setBusy(false)}}
  return <aside className="landmark-console"><button className="record-close" aria-label="Close landmark" onClick={close}>✕</button><p className="eyebrow">LANDMARK / INTERACTIVE ARCHIVE</p><h2>{CITIES[landmark].landmark}</h2>
    <p>{landmark==='IdeaHub'?'Bring an abandoned idea into the restoration chamber.':landmark==='Legend'?'Achievements derived from recorded project milestones.':landmark==='AI'?'Inspect documented failure reasons. Echo preserves the context and lessons.':'Explore the projects that give this place meaning.'}</p>
    <label>Project<select value={project?.id??''} onChange={e=>{useUI.getState().selectProject(e.target.value||null);useDistrictSignals.getState().signal()}}><option value="">Choose a record</option>{records.map(p=><option key={p.id} value={p.id}>{p.temporary?'Temporary · ':''}{p.name}</option>)}</select></label>
    {!records.length&&<p className="guest-notice">No matching records yet. Build an idea or explore another district.</p>}
    {project&&<><h3>{project.name}</h3><p>{project.failureReason||project.tagline}</p>
      {landmark==='Legend'&&<ul>{computeAwards(project).filter(a=>a.type!=='founder'&&a.type!=='innovator').map(a=><li key={a.type}><strong>{a.label}</strong> — {a.description}</li>)}</ul>}
      {landmark==='IdeaHub'&&<><button className="btn-primary" onClick={preview}>Preview reconstruction</button>{repairPreview&&<p role="status">Restoration simulation · The record changes only when you save a new status.</p>}{canEdit&&project.status!=='reviving'&&<button disabled={busy} onClick={revive}>{busy?'Saving…':'Mark my project as reviving'}</button>}</>}
      <button onClick={()=>{close();useUI.getState().setMode('echo')}}>Open documented history →</button>
    </>}{error&&<p role="alert">{error}</p>}
  </aside>
}
