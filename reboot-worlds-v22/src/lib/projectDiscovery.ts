import type { Project } from '@/types/project'
export const ZERO_THRESHOLD=100
export const SCENE_BUILDING_LIMIT=120
export function recordedViews(project:Project){
 const value=project.viewCount
 return !project.temporary&&typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0
}
export function isZeroProject(project:Project){return recordedViews(project)<ZERO_THRESHOLD}
/** Keep selection visible even when the current page has more records than a scene can draw. */
export function sceneBuildings(projects:Project[],selectedId:string|null){
 const result=projects.slice(0,SCENE_BUILDING_LIMIT),selected=projects.find(p=>p.id===selectedId)
 if(selected&&!result.some(p=>p.id===selectedId))result[result.length-1]=selected
 return result
}
