import { useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { EchoEnvironment } from './EchoEnvironment'

/** City deep links and in-scene selections share the existing project selection store. */
export function EchoModule() {
  const projects=useProjects(s=>s.projects)
  const selected=useUI(s=>s.selectedProjectId)
  return <EchoEnvironment project={projects.find(p=>p.id===selected)??null} onExit={()=>useUI.getState().setMode('city')} />
}
