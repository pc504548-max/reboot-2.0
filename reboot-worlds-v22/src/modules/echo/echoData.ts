import type { Project } from '@/types/project'
export const MEMORY_SECTIONS = [
  {id:'overview',label:'Archived knowledge',color:'#76c7ff'},
  {id:'failure',label:'Documented abandonment',color:'#e57887'},
  {id:'lessons',label:'Lessons learned',color:'#9abfff'},
  {id:'revival',label:'Revival requirements',color:'#72e6b3'},
  {id:'related',label:'Recorded relationships',color:'#bd93f1'},
] as const
export type MemorySection = typeof MEMORY_SECTIONS[number]['id']
/** No generated diagnoses, financial estimates, inferred history, or AI scores. */
export function memoryText(project: Project,section:MemorySection) {
  switch(section) {
    case 'overview': return project.description || 'No description recorded.'
    case 'failure': return project.failureReason || 'No reason for abandonment recorded.'
    case 'lessons': return project.lessonsLearned || 'No lessons recorded.'
    case 'revival': return project.revivalRequirements || 'No revival requirements recorded.'
    case 'related': return 'Only connections documented in project records are shown.'
  }
}
