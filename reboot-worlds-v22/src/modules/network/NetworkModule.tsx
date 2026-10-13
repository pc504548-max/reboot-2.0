import { useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { CATEGORY_THEME,DISTRICTS,type Project } from '@/types/project'
import { ProjectDetail } from '@/modules/city/CityVisualization'
import { useMotionSettings } from '@/modules/cityworld/hooks/useCityNavigation'
import { EnvironmentSettings,Motion } from '@/modules/cityworld/environment/ScenePrimitives'
import { OrbitalRings } from '@/modules/cityworld/environment/Landmarks'
import { RecordCamera } from '@/modules/shared/RecordCamera'
import { layoutNetwork,relatedProjects } from '@/modules/shared/projectGraph'
type Node=ReturnType<typeof layoutNetwork>['nodes'][number]

function Nodes({nodes,selected,onSelect}:{nodes:Node[];selected:string|null;onSelect:(id:string)=>void}) {
  const ref=useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(()=>{
    if(!ref.current)return
    const d=new THREE.Object3D(),color=new THREE.Color()
    nodes.forEach((n,i)=>{d.position.set(...n.position);d.scale.setScalar((.65+n.project.stage*.16)*(selected===n.project.id?1.4:1));d.rotation.set(0,i*.5,0);d.updateMatrix();ref.current!.setMatrixAt(i,d.matrix);ref.current!.setColorAt(i,color.set(CATEGORY_THEME[n.project.category].emissive))})
    ref.current.instanceMatrix.needsUpdate=true
    if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true
    ref.current.computeBoundingSphere()
  },[nodes,selected])
  return <instancedMesh ref={ref} args={[undefined,undefined,nodes.length]} onClick={e=>{e.stopPropagation();if(e.instanceId!==undefined)onSelect(nodes[e.instanceId].project.id)}}>
    <octahedronGeometry args={[1,0]}/><meshStandardMaterial metalness={.45} roughness={.25}/>
  </instancedMesh>
}
function Connections({nodes,edges}:{nodes:Node[];edges:[number,number][]}) {
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry(),points:number[]=[]
    edges.forEach(([a,b])=>points.push(...nodes[a].position,...nodes[b].position))
    g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return g
  },[nodes,edges])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#a396db" transparent opacity={.5}/></lineSegments>
}
export function NetworkModule() {
  const all=useProjects(s=>s.projects),error=useProjects(s=>s.error),loading=useProjects(s=>s.loading)
  const selectedId=useUI(s=>s.selectedProjectId),select=useUI(s=>s.selectProject)
  const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[detail,setDetail]=useState(false)
  const {reduced,lowEffects,setLowEffects}=useMotionSettings()
  const visible=useMemo(()=>all.filter(p=>(!category||p.category===category)&&[p.name,p.tagline,...p.tags].join(' ').toLowerCase().includes(query.toLowerCase())),[all,query,category])
  const {nodes,edges}=useMemo(()=>layoutNetwork(visible),[visible])
  const selected=all.find(p=>p.id===selectedId),node=nodes.find(n=>n.project.id===selectedId)
  const related=selected?relatedProjects(selected,all):[]
  const choose=(id:string)=>{select(id);setDetail(false)}
  return <div className="record-experience" data-experience="network">
    <Canvas dpr={[1,lowEffects?1:1.5]} camera={{position:[0,22,60],fov:52}} frameloop={reduced?'demand':'always'}>
      <color attach="background" args={['#050914']}/><ambientLight intensity={1.3}/><directionalLight position={[20,30,20]} intensity={2}/>
      <EnvironmentSettings.Provider value={{reduced,lowEffects}}>
        <Motion speed={.025}><OrbitalRings color="#517f97" radius={5}/><mesh><icosahedronGeometry args={[2,0]}/><meshStandardMaterial color="#375a70" wireframe/></mesh></Motion>
        <Connections nodes={nodes} edges={edges}/><Nodes nodes={nodes} selected={selectedId} onSelect={choose}/>
        {/* Attribution is per record: equal display names are never merged into inferred identities. */}
        {nodes.filter(n=>n.project.founder&&n.project.founder!=='Unknown').map(n=><mesh key={n.project.id} position={[n.position[0],n.position[1]+2,n.position[2]]} onClick={e=>{e.stopPropagation();choose(n.project.id)}}><sphereGeometry args={[.22,8,6]}/><meshBasicMaterial color="#e0c6a4"/></mesh>)}
        {nodes.filter(n=>n.project.category==='Community').map(n=><group key={n.project.id} position={n.position}>{[-1,1].map(side=><mesh key={side} position={[side*1.1,-.3,0]}><boxGeometry args={[.6,1,.6]}/><meshStandardMaterial color="#76b7a8"/></mesh>)}</group>)}
        {!all.length&&Array.from({length:9},(_,i)=><Motion key={i} position={[Math.cos(i*2.4)*19,Math.sin(i)*5,Math.sin(i*2.4)*19]} speed={.04}><mesh><octahedronGeometry args={[.8]}/><meshStandardMaterial color="#456580" wireframe/></mesh></Motion>)}
      </EnvironmentSettings.Provider>
      <OrbitControls makeDefault enablePan minDistance={7} maxDistance={110} enableDamping={!reduced}/>
      <RecordCamera position={node?.position??null} reduced={reduced}/>
    </Canvas>
    <header className="record-heading"><p className="label-mono">NETWORK / PROJECT CONSTELLATIONS</p><h1>The Nexus</h1><p>{visible.length} projects · {edges.length} documented connections</p><button onClick={()=>useUI.getState().setMode('city')}>← Return to World Hub</button></header>
    <label className="record-quality"><input type="checkbox" checked={lowEffects} onChange={e=>setLowEffects(e.target.checked)}/> Reduced effects</label>
    <aside className="record-browser">
      <label>Search projects<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, idea, or tag…"/></label>
      <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.shortName}</option>)}</select></label>
      {loading&&<p>Loading projects…</p>}{error&&<p role="status">Project records unavailable: {error}</p>}
      {!all.length?<p>An introductory constellation of placeholder nodes. Add real project records to begin exploring connections.</p>:!visible.length&&<p>No projects match these filters.</p>}
      <div>{visible.map(p=><button key={p.id} aria-pressed={selectedId===p.id} onClick={()=>choose(p.id)}>{p.name}</button>)}</div>
    </aside>
    {selected&&!detail&&<section className="record-detail">
      <button className="record-close" aria-label="Close node" onClick={()=>select(null)}>✕</button>
      <p className="label-mono">{selected.category} / {selected.status}</p><h2>{selected.name}</h2><p>{selected.tagline}</p>
      <p>Recorded founder: {selected.founder||'Not recorded'}</p><p>Stage {selected.stage} / 5</p>
      <h3>Documented connections</h3>{related.length?related.map(p=><button key={p.id} className="record-link" onClick={()=>{setCategory('');setQuery('');choose(p.id)}}>{p.name} ↗</button>):<p>No documented connections with available projects.</p>}
      <button className="record-link" onClick={()=>setDetail(true)}>Open project details →</button>
    </section>}
    {selected&&detail&&<ProjectDetail project={selected} canCustomize={false} onClose={()=>setDetail(false)}/>}
    <footer className="record-legend">Geometry · project　 Small warm node · recorded founder　 Cluster · community project<br/>Position groups categories. Lines show documented connections. Isolated records sit farther from the Nexus.</footer>
  </div>
}
