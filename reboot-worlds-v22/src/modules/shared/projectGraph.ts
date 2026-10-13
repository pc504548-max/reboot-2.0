import type { Project } from '@/types/project'

/** Either endpoint can document a connection; ignore self, missing and duplicate IDs. */
export function documentedEdges(projects: Project[]): [number,number][] {
  const indices=new Map(projects.map((p,i)=>[p.id,i])),seen=new Set<string>(),edges:[number,number][]=[]
  projects.forEach((p,i)=>p.connections.forEach(id=>{
    const j=indices.get(id)
    if(j===undefined||j===i)return
    const a=Math.min(i,j),b=Math.max(i,j),key=a+':'+b
    if(!seen.has(key)){seen.add(key);edges.push([a,b])}
  }))
  return edges
}
export function relatedProjects(project:Project,all:Project[]) {
  return all.filter(p=>p.id!==project.id&&(project.connections.includes(p.id)||p.connections.includes(project.id)))
}
export function layoutNetwork(projects:Project[]) {
  const edges=documentedEdges(projects),connected=new Set(edges.flat())
  const categories=[...new Set(projects.map(p=>p.category))].sort()
  const counters=new Map<string,number>(),counts=new Map<string,number>()
  projects.forEach(p=>counts.set(p.category,(counts.get(p.category)??0)+1))
  const nodes=projects.map((project,i)=>{
    const ci=categories.indexOf(project.category),local=counters.get(project.category)??0
    counters.set(project.category,local+1)
    const angle=ci/categories.length*Math.PI*2+(local/(counts.get(project.category)??1)-.5)*Math.PI*1.4/categories.length
    const radius=connected.has(i)?16+local%4*2.2:30+local%3*2
    return {project,position:[Math.cos(angle)*radius,(local%5-2)*2.6,Math.sin(angle)*radius] as [number,number,number]}
  })
  return {nodes,edges}
}
