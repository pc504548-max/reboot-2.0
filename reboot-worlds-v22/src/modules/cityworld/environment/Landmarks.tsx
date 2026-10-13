import { useDistrictSignals } from './districtSignals'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITIES, type CityId } from '../cityRegistry'
import { Architecture, Motion, Parts, useEnvironment } from './ScenePrimitives'
import { BlackHole } from './BlackHole'

export function landmarkArchitecture(city: CityId) {
  const a=new Architecture(),p=CITIES[city].palette
  a.add('pillar',[0,.35,0],[7,.7,7],p.body)
  switch(city) {
    case 'Graveyard':
      // A torn vault, exposed ribs, sealed door and fallen wing.
      for(let i=0;i<5;i++) {
        a.box([-6+i*3,3+i*.3,-4],[2.5,6+i*.6,7],'#35404e',[0,0,(i-2)*.07])
        a.beam([-9+i*1.6,0,-5],[-9+i*2,20+i,-5],.5,'#626273')
        a.beam([-9+i*2,20+i,-5],[5-i*.4,25-i,-5],.45,'#626273')
      }
      a.box([0,7,1],[7,14,1.2],'#141c28')
      a.box([0,7,1.65],[6.3,12.7,.1],'#6b526b')
      a.box([0,7,1.74],[.14,12,.12],'#ca6b74',undefined,true)
      a.box([8,7,-1],[3,16,3],'#414253',[0,0,-.36])
      a.box([-5,1,8],[7,1,3],'#424559',[0,.3,.1])
      for(let i=0;i<6;i++)a.box([-4+i*1.5,.9,4+i%2],[.7,.8,.7],'#6d536c',[.3,i,.5])
      break
    case 'IdeaHub':
      for(const side of [-1,1]) {
        a.box([side*7,8,-2],[2.5,16,4],side<0?'#51404a':'#437779')
        a.beam([side*7,14,-2],[side*4,24,-2],.7,'#d2a879')
        a.beam([side*7,2,-2],[side*4,18,-2],.14,side<0?'#b6696c':p.accent,true)
      }
      a.box([0,24,-2],[9,1,3],'#829491')
      a.ring([0,14,0],5.7,p.secondary,[0,0,0])
      a.box([-5,2,3],[5,4,4],'#54414c',[0,0,.14])
      for(let i=0;i<5;i++) a.box([5,1.4+i*2.3,3],[4-i*.3,1.5,4-i*.3],i<2?'#445a60':'#66b2a3')
      break
    case 'Legend':
      for(let i=0;i<3;i++) a.add('pillar',[0,.8+i*.9,0],[8-i*1.2,.8,8-i*1.2],'#7d807c')
      for(const side of [-1,1]) {
        a.beam([side*4,2,0],[side*.65,34,0],1.5,'#9d9b86')
        a.beam([side*4,2,.8],[side*.65,34,.8],.1,p.accent,true)
      }
      a.add('rock',[0,35,0],[1.3,2,1.3],p.secondary,undefined,true)
      for(let i=0;i<4;i++) {const angle=i*Math.PI/2;a.add('pillar',[Math.cos(angle)*11,12+i*2,Math.sin(angle)*11],[3,.6,3],'#87978d');a.beam([0,10,0],[Math.cos(angle)*11,12+i*2,Math.sin(angle)*11],.4,'#c5b99a')}
      break
    case 'AI':
      for(let i=0;i<6;i++) {const t=i*Math.PI/3;a.beam([Math.cos(t)*7,0,Math.sin(t)*7],[Math.cos(t)*8,17,Math.sin(t)*8],.45,'#467184');a.beam([Math.cos(t)*8,17,Math.sin(t)*8],[Math.cos(t)*3,25,Math.sin(t)*3],.25,p.accent,true)}
      a.ring([0,8,0],8,p.accent); a.ring([0,25,0],3,p.secondary)
      break
    case 'Gaming':
      for(let i=0;i<3;i++) {a.add('pillar',[0,2+i*7,0],[8-i,1,8-i],'#4b4169');a.ring([0,2.6+i*7,0],8-i,i%2?p.secondary:p.accent)}
      for(const x of [-5,5])a.box([x,10,-3],[1,20,1],'#8c668d')
      for(let i=0;i<9;i++)a.box([(i%3-1)*2,3,Math.floor(i/3)*2-2],[1.8,.25,1.8],i%2?'#cab399':'#3b3257')
      for(const x of [-3,3])a.add('cone',[x,11,0],[1.7,3,1.7],'#92739f')
      a.ring([0,18,0],3,'#84dfed',[0,0,0])
      break
    case 'Education':
      a.beam([0,0,0],[0,16,0],1.4,'#83a9b9')
      for(let i=0;i<9;i++) {
        const angle=i*2.4,y=9+i*1.4,x=Math.cos(angle)*(5+i*.35),z=Math.sin(angle)*(5+i*.35)
        a.beam([0,y-4,0],[x,y,z],.4,p.accent,true)
        a.beam([x,y,z],[x*1.35,y+3,z*1.35],.2,'#c2dfdd',true)
        a.add('rock',[x*1.35,y+3,z*1.35],[1.2,.8,1.2],'#8de0df')
        a.box([x,y-1,z],[3,.2,2],'#b4a68b')
      }
      break
    case 'Health':
      for(let i=0;i<7;i++){const angle=i*2.4,x=Math.cos(angle)*5,z=Math.sin(angle)*5;a.beam([x,0,z],[x,9+i%3,z],.35,'#709f8d');a.add('rock',[x,10+i%3,z],[2.2,3,2.2],i%2?'#59ac8a':'#71ccb5')}
      a.add('pillar',[0,2,0],[7,.4,7],'#337f83');a.ring([0,2.3,0],6.6,p.accent)
      for(const x of [-3,3])a.beam([x,2,0],[x,12,0],.1,'#a1f3df',true)
      break
    case 'Creator':
      a.box([-5,5,0],[3,10,3],'#986e96',[0,.5,-.22])
      a.add('cone',[4,6,-2],[4,12,4],'#556c9a',[0,0,.25])
      a.ring([0,8,0],7,'#a296bd',[Math.PI/2,.3,0],false)
      break
    case 'Space':
      a.add('pillar',[0,8,0],[2,16,2],'#627189')
      a.add('orb',[0,18,0],[4,4,4],'#9ca4bd')
      a.beam([0,18,0],[0,21,-9],1.5,'#b2bdd0')
      a.ring([0,21,-9],3,'#81d2ee',[.3,0,0])
      for(const side of [-1,1])a.box([side*9,15,0],[9,.3,5],'#2e4483',[0,0,side*.25])
      break
    case 'Robotics':
      for(let i=0;i<4;i++)a.add('pillar',[0,3+i*4,0],[5-i*.6,2,5-i*.6],i%2?'#8d8170':'#4c646b')
      for(const side of [-1,1]) {
        a.beam([side*8,0,0],[side*8,10,0],1,'#b68d61')
        a.add('orb',[side*8,10,0],[1.4,1.4,1.4],'#77aeb1')
      }
      break
    case 'Community':
      for(let i=0;i<5;i++) {
        const angle=i*Math.PI*2/5,x=Math.cos(angle)*6,z=Math.sin(angle)*6
        a.beam([x,0,z],[x,8+i%2*2,z],.55,i%2?'#cbac88':'#76b6ab')
        a.add(i%2?'cone':'orb',[x,9+i%2*2,z],[4,1.4,4],i%2?'#a47b6e':'#527d89')
        a.beam([x,8,z],[0,10,0],.25,p.secondary,true)
      }
      a.add('pillar',[0,.8,0],[5,1.4,5],'#b09e89');a.ring([0,1.55,0],4,p.accent)
  }
  return a
}
export function CityLandmark({city}: {city:CityId}) {
  const data=useMemo(()=>landmarkArchitecture(city),[city]),p=CITIES[city].palette
  return <group name={city+'-main-landmark'} onClick={e=>{e.stopPropagation();useDistrictSignals.getState().open(city)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
    <LandmarkResponse city={city}/>
    <Parts data={data} />
    {city==='Graveyard' && <BlackHole />}
    {city==='AI' && <><mesh position={[0,16,0]}><sphereGeometry args={[7,28,20]} /><meshPhysicalMaterial color="#4599b4" transparent opacity={.1} roughness={.15} depthWrite={false} side={THREE.DoubleSide} /></mesh><Motion position={[0,16,0]} speed={.08}><BrainCore color={p.accent} /><OrbitalRings color={p.secondary} radius={8.5}/></Motion></>}
    {city==='Health' && <><mesh position={[0,1,0]}><sphereGeometry args={[12,32,20,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color="#81e5cb" transparent opacity={.1} wireframe depthWrite={false} /></mesh><Motion position={[0,14,0]} speed={.06}><OrbitalRings color={p.accent} radius={4}/></Motion></>}
    {city==='Creator' && <ImaginationEngine />}
    {city==='IdeaHub' && <RepairCycle />}
    {city==='Robotics' && <><Motion position={[0,15,0]} speed={.17}><OrbitalRings color={p.accent} radius={5.5}/></Motion><MechanicalArms /></>}
    {city==='Space' && <><Motion position={[0,18,0]} speed={.055}><OrbitalRings color={p.secondary} radius={10}/></Motion><mesh position={[-45,30,-75]}><sphereGeometry args={[12,24,16]} /><meshStandardMaterial color="#6d608b" /></mesh><mesh position={[48,15,-70]}><sphereGeometry args={[6,16,12]} /><meshStandardMaterial color="#446a82" /></mesh></>}
    {city==='Legend' && <Motion position={[0,26,0]} speed={.04}><OrbitalRings color={p.accent} radius={4}/></Motion>}
    {city==='Gaming' && <Motion position={[0,23,0]} speed={.15}><mesh><octahedronGeometry args={[2]} /><meshStandardMaterial color="#ab8dc4" emissive={p.secondary} emissiveIntensity={.3}/></mesh></Motion>}
    {city==='Education' && <Motion position={[0,22,0]} speed={.04}><OrbitalRings color={p.secondary} radius={8}/></Motion>}
  </group>
}
export function OrbitalRings({color,radius}: {color:string;radius:number}) {
  return <>{[0,1,2].map(i=><mesh key={i} rotation={[.5+i*.7,.3*i,0]}><torusGeometry args={[radius,.06,6,64]} /><meshBasicMaterial color={color} /></mesh>)}</>
}
export function BrainCore({color}: {color:string}) {
  const data=useMemo(()=>{
    const a=new Architecture()
    for(let side of [-1,1])for(let i=0;i<12;i++) {const t=i*2.4,y=(i/11-.5)*5,x=side*(1.4+Math.cos(t)*.8),z=Math.sin(t)*2;a.add('rock',[x,y,z],[1.15,1.1,1.1],color);if(i)a.beam([side*1.4,y-.45,0],[x,y,z],.045,'#b8ecff',true)}
    return a
  },[color])
  return <Parts data={data} name="geometric-neural-core"/>
}
function ImaginationEngine() {
  const ref=useRef<THREE.Group>(null),{reduced,lowEffects}=useEnvironment(),time=useRef(0)
  useFrame((_,delta)=>{if(reduced||!ref.current)return;time.current+=Math.min(delta,.1);ref.current.children.forEach((child,i)=>{child.position.set(Math.cos(i*2.4+time.current*.1)*(3+Math.sin(time.current*.3+i)),Math.sin(i*1.7+time.current*.25)*3,Math.sin(i*2.4+time.current*.1)*4);child.rotation.set(time.current*.1+i,i,time.current*.08)})})
  return <group position={[0,18,0]}><group ref={ref}>{Array.from({length:lowEffects?7:12},(_,i)=><mesh key={i} position={[Math.cos(i*2.4)*4,Math.sin(i)*3,Math.sin(i*2.4)*4]}><octahedronGeometry args={[1.3]} /><meshStandardMaterial color={['#b978bb','#719cdb','#e6b987'][i%3]} metalness={.6} roughness={.25}/></mesh>)}</group></group>
}
function RepairCycle() {
  const ref=useRef<THREE.Group>(null),{reduced}=useEnvironment(),t=useRef(0)
  useFrame((_,delta)=>{if(reduced||!ref.current)return;t.current+=Math.min(delta,.1);const phase=(t.current*.1)%1;ref.current.position.set(-5+phase*10,9+Math.sin(phase*Math.PI)*9,3)})
  return <group ref={ref} position={[-5,9,3]}><mesh><boxGeometry args={[3,.5,3]}/><meshStandardMaterial color="#8dc8b2" /></mesh><mesh position={[0,1.4,0]}><boxGeometry args={[1,.5,1]}/><meshBasicMaterial color="#dfbe7c"/></mesh></group>
}
function MechanicalArms() {
  return <>{[-1,1].map(side=><Motion key={side} position={[side*8,10,0]} axis="z" speed={side*.35} swing><mesh position={[0,3,0]}><boxGeometry args={[.8,6,1]}/><meshStandardMaterial color="#c39465" /></mesh><mesh position={[0,6,0]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#75a8b6" /></mesh><mesh position={[side*2,6,0]}><boxGeometry args={[4,.6,.8]}/><meshStandardMaterial color="#ab9479" /></mesh></Motion>)}</>
}

function LandmarkResponse({city}:{city:CityId}) {
  const group=useRef<THREE.Group>(null),scan=useRef<THREE.Mesh>(null),{reduced}=useEnvironment()
  const active=useDistrictSignals(s=>s.repairPreview),pulse=useDistrictSignals(s=>s.pulse)
  useFrame(()=>{
    const seconds=(performance.now()-pulse)/1000
    if(scan.current){scan.current.visible=pulse>0&&seconds<4;scan.current.scale.setScalar(1+Math.min(seconds,4)*.35)}
    if(group.current)group.current.children.forEach((child,i)=>{child.visible=active&&(reduced||seconds>i*.55);child.position.y=1+i*1.6+(reduced?0:Math.max(0,1-(seconds-i*.55))*5)})
  })
  return <><mesh ref={scan} visible={false} rotation={[-Math.PI/2,0,0]} position={[0,.4,0]}><ringGeometry args={[10,10.12,64]}/><meshBasicMaterial color={CITIES[city].palette.accent} transparent opacity={.65} side={THREE.DoubleSide}/></mesh>
  {city==='IdeaHub'&&<group ref={group} position={[0,0,5]}>{Array.from({length:7},(_,i)=><mesh key={i} visible={active} position={[0,1+i*1.6,0]}><boxGeometry args={[3-i*.22,1.3,3-i*.22]}/><meshStandardMaterial color="#91d4bb" emissive="#46b8b0" emissiveIntensity={.18}/></mesh>)}</group>}</>
}
