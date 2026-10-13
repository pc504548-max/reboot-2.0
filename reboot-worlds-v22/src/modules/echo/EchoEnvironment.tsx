import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from '@/types/project'
import { useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { useMotionSettings } from '@/modules/cityworld/hooks/useCityNavigation'
import { Architecture, EnvironmentSettings, Motion, Parts } from '@/modules/cityworld/environment/ScenePrimitives'
import { BrainCore, OrbitalRings } from '@/modules/cityworld/environment/Landmarks'
import { RecordCamera } from '@/modules/shared/RecordCamera'
import { relatedProjects } from '@/modules/shared/projectGraph'
import { MEMORY_SECTIONS, memoryText, type MemorySection } from './echoData'

function MemoryBrain() {
  const neural=useMemo(()=>{
    const a=new Architecture()
    for(const side of [-1,1])for(let i=0;i<24;i++){
      const angle=i*2.4,x=side*(2+Math.cos(angle)*1.4),y=Math.sin(i*.74)*3,z=Math.sin(angle)*2.5
      a.beam([side*1.5,y*.4,0],[x,y,z],.025,i%4===0?'#c2829b':i%4===1?'#77c4cf':'#998bce',true)
      a.add('orb',[x,y,z],[.09,.09,.09],i%4===0?'#e28393':i%4===1?'#71dbb7':'#83baff',undefined,true)
    }
    return a
  },[])
  return <group name="Memory-Core" scale={1.5}>
    {[-1,1].map(side=><mesh key={side} position={[side*1.8,0,0]} scale={[1,1.25,1.5]}><sphereGeometry args={[2.7,28,20]}/><meshStandardMaterial color="#80a6cf" transparent opacity={.085} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
    <Parts data={neural}/>
    <group scale={.72}><BrainCore color="#537a9e"/></group>
    <Motion speed={.02}><OrbitalRings color="#514d7b" radius={6}/></Motion>
  </group>
}
export function EchoEnvironment({project,onExit}:{project:Project|null;onExit:()=>void}) {
  const all=useProjects(s=>s.projects),error=useProjects(s=>s.error),loading=useProjects(s=>s.loading)
  const {reduced,lowEffects,setLowEffects}=useMotionSettings()
  const [section,setSection]=useState<MemorySection>('overview'),[search,setSearch]=useState('')
  const records=useMemo(()=>all.map((p,i)=>({project:p,position:[Math.cos(i/Math.max(all.length,1)*Math.PI*2)*13,Math.sin(i*2.4)*3,Math.sin(i/Math.max(all.length,1)*Math.PI*2)*13] as [number,number,number]})),[all])
  const selected=records.find(n=>n.project.id===project?.id)
  const related=project?relatedProjects(project,all):[]
  return <div className="record-experience" data-experience="echo">
    <Canvas dpr={[1,lowEffects?1:1.5]} camera={{position:[0,12,40],fov:48}} frameloop={reduced?'demand':'always'}>
      <color attach="background" args={['#040710']}/><fog attach="fog" args={['#040710',50,120]}/>
      <ambientLight intensity={.8}/><directionalLight position={[12,20,10]} intensity={1.5} color="#b5cce8"/>
      <EnvironmentSettings.Provider value={{reduced,lowEffects}}>
        <MemoryBrain/>
        <mesh position={[0,-10,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[44,64]}/><meshStandardMaterial color="#0c1524" metalness={.5} roughness={.6}/></mesh>
        {records.map(n=><group key={n.project.id} position={n.position}>
          <mesh onClick={e=>{e.stopPropagation();useUI.getState().selectProject(n.project.id)}} scale={n.project.id===project?.id?1.25:1}>
            <boxGeometry args={[1.1,1.6,.35]}/><meshStandardMaterial color="#36536c" emissive={n.project.failureReason?'#d8788b':n.project.status==='reviving'?'#6ed8b1':'#76c7ff'} emissiveIntensity={.5}/>
          </mesh>
        </group>)}
        {!all.length&&Array.from({length:8},(_,i)=><Motion key={i} position={[Math.cos(i*Math.PI/4)*13,Math.sin(i)*2,Math.sin(i*Math.PI/4)*13]} speed={.05} bob={lowEffects?0:.25}><mesh><boxGeometry args={[1,1.4,.15]}/><meshStandardMaterial color="#36455d" wireframe/></mesh></Motion>)}
      </EnvironmentSettings.Provider>
      <OrbitControls makeDefault enablePan minDistance={7} maxDistance={70} enableDamping={!reduced}/>
      <RecordCamera position={selected?.position??null} reduced={reduced}/>
    </Canvas>
    <header className="record-heading"><p className="label-mono">ECHO / MEMORY CHAMBER</p><h1>The Memory Core</h1><p>What happened. What remains. What could come next.</p><button onClick={onExit}>← Return to World Hub</button></header>
    <label className="record-quality"><input type="checkbox" checked={lowEffects} onChange={e=>setLowEffects(e.target.checked)}/> Reduced effects</label>
    <aside className="record-browser"><label>Find a project<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search memories…"/></label>
      {loading&&<p>Loading records…</p>}{error&&<p role="status">Project records unavailable: {error}</p>}
      {!all.length&&<p>Empty memory fragments surround the Core. These are decorative placeholders, not project records.</p>}
      <div>{records.filter(n=>n.project.name.toLowerCase().includes(search.toLowerCase())).map(n=><button key={n.project.id} aria-pressed={n.project.id===project?.id} onClick={()=>useUI.getState().selectProject(n.project.id)}>{n.project.name}</button>)}</div>
    </aside>
    {project&&<section className="record-detail" aria-label="Project memory">
      <button className="record-close" aria-label="Close memory" onClick={()=>useUI.getState().selectProject(null)}>✕</button>
      <p className="label-mono">{project.category} / {project.status}</p><h2>{project.name}</h2><p>{project.tagline}</p>
      <nav aria-label="Memory sections">{MEMORY_SECTIONS.map(n=><button key={n.id} aria-pressed={section===n.id} style={{color:n.color}} onClick={()=>setSection(n.id)}>{n.label}</button>)}</nav>
      <div className={reduced?'':'record-reveal'} key={project.id+section}><p>{memoryText(project,section)}</p>
      {section==='overview'&&<dl><dt>Last known status</dt><dd>{project.status}</dd><dt>Recorded founder</dt><dd>{project.founder||'Not recorded'}</dd><dt>Last updated</dt><dd>{project.updatedAt?new Date(project.updatedAt).toLocaleDateString():'Not recorded'}</dd></dl>}
      {section==='related'&&(related.length?related.map(p=><button className="record-link" key={p.id} onClick={()=>useUI.getState().selectProject(p.id)}>{p.name} ↗</button>):<p>No documented relationships with available records.</p>)}</div>
    </section>}
    <footer className="record-legend">Blue · archived knowledge　 Red · documented failure　 Green · revival　 Violet · relationships<br/>The brain pathways are symbolic architecture. Project relationships appear only in recorded connections.</footer>
  </div>
}
