import { create } from 'zustand'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEnvironment, Architecture, Parts } from './ScenePrimitives'
export type WeatherKind='clear'|'summer'|'rain'|'snow'
export const useWeather=create<{kind:WeatherKind;set:(kind:WeatherKind)=>void}>(set=>({kind:'clear',set:kind=>set({kind})}))
export function WeatherControl(){const {kind,set}=useWeather();return <label className="weather-control">Weather <select aria-label="Weather" value={kind} onChange={e=>set(e.target.value as WeatherKind)}><option value="clear">Clear</option><option value="summer">Summer</option><option value="rain">Rain</option><option value="snow">Snow</option></select></label>}
export function Weather(){
 const kind=useWeather(s=>s.kind),{lowEffects,reduced}=useEnvironment()
 const count=lowEffects?72:320,time=useRef(0),attr=useRef<THREE.BufferAttribute>(null)
 const vertices=useMemo(()=>{const a=new Float32Array(count*6);for(let i=0;i<count;i++){const x=((i*17.31)%94)-47,z=((i*23.77)%94)-47,y=(i*7.3)%45;a.set([x,y,z,x+.1,y-(kind==='rain'?1.1:.06),z],i*6)}return a},[count,kind])
 const snow=useMemo(()=>{const a=new Architecture();for(let i=0;i<12;i++)a.add('rock',[Math.cos(i*2.4)*29,-.05,Math.sin(i*2.4)*29],[2,.22,1.6],'#d7e9ef');return a},[])
 useFrame((_,delta)=>{if(reduced||!attr.current||!['rain','snow'].includes(kind))return;time.current+=Math.min(delta,.05);const a=attr.current.array as Float32Array;for(let i=0;i<count;i++){const base=i*6,y=45-((i*7.3+time.current*(kind==='rain'?21:2.2))%45),x=((i*17.31)%94)-47+(kind==='snow'?Math.sin(time.current*.4+i)*1.5:0);a[base]=x;a[base+1]=y;a[base+3]=x+.1;a[base+4]=y-(kind==='rain'?1.1:.06)}attr.current.needsUpdate=true})
 if(kind==='clear')return null
 if(kind==='summer')return <group name="summer-weather"><directionalLight position={[-30,45,-70]} color="#ffcf91" intensity={.6}/><mesh position={[-45,52,-95]}><sphereGeometry args={[5,16,12]}/><meshBasicMaterial color="#ffcf91"/></mesh></group>
 return <group name={`${kind}-weather`} userData={{particles:count}}>{kind==='snow'&&<Parts data={snow}/>}
 <lineSegments frustumCulled={false}><bufferGeometry><bufferAttribute ref={attr} attach="attributes-position" args={[vertices,3]}/></bufferGeometry><lineBasicMaterial color={kind==='snow'?'#e5f4ff':'#7da9c7'} transparent opacity={kind==='snow'?.75:.42} depthWrite={false}/></lineSegments>
 </group>
}
