import { CATEGORY_THEME } from '@/types/project'
import { useMemo } from 'react'
import type { CitySceneProps } from '../cityworld/CityWorldModule'
import { Architecture, Parts, Motion } from '../cityworld/environment/ScenePrimitives'
import { CityTower,makeTowerDNA } from '../cityworld/cities/cityKit'
import { CITIES } from '../cityworld/cityRegistry'
export function ZeroScene({projects,selectedId,onSelect}:CitySceneProps){
 const ground=useMemo(()=>{const a=new Architecture();a.add('pillar',[0,-1.1,0],[30,1,30],'#283747');for(let i=0;i<9;i++){const angle=i*Math.PI*2/9,x=Math.cos(angle)*26,z=Math.sin(angle)*26;a.add('hex',[x,-.35,z],[7,.5,7],'#405568');a.beam([0,-.3,0],[x,-.3,z],.35,'#84b9c4',true);a.add('orb',[x,1,z],[.4,.4,.4],'#b5f4e3',[0,0,0],true)}a.ring([0,.05,0],8,'#a7e1d9');return a},[])
 return <group name="zero-hub"><Parts data={ground}/><Motion speed={.08} position={[0,9,0]}><mesh rotation={[.15,0,.12]}><torusGeometry args={[5,.65,8,48]}/><meshStandardMaterial color="#b3dfdc" emissive="#79c5c1" emissiveIntensity={.4}/></mesh></Motion><mesh position={[0,2,0]}><cylinderGeometry args={[6,8,4,12]}/><meshStandardMaterial color="#21394b"/></mesh>
 {projects.map((p,i)=><CityTower key={p.id} project={p} dna={makeTowerDNA(p,i,projects.length)} palette={{...CITIES.Community.palette,accent:CATEGORY_THEME[p.category].emissive}} cap="dome" hovered={false} selected={p.id===selectedId} onHover={()=>{}} onSelect={onSelect}/>)}
 </group>
}
