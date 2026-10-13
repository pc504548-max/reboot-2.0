import { useDistrictSignals } from './districtSignals'
import { useLayoutEffect,useMemo,useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITIES,type CityId } from '../cityRegistry'
import { WORK_SITES } from './cityDesign'
import { useEnvironment } from './ScenePrimitives'

/** Delivery, repair and exhibit cycles belong to the work sites, not fabricated platform events. */
export function CityActivity({city}:{city:CityId}) {
  const ref=useRef<THREE.InstancedMesh>(null),t=useRef(0),tick=useRef(0)
  const dummy=useMemo(()=>new THREE.Object3D(),[]),color=useMemo(()=>new THREE.Color(),[])
  const {reduced,lowEffects}=useEnvironment(),count=lowEffects?8:20,p=CITIES[city].palette
  function update(time:number) {
    if(!ref.current)return
    for(let i=0;i<count;i++) {
      const signal=useDistrictSignals.getState().pulse,energy=signal>0?Math.max(0,1-(performance.now()-signal)/4000):0
      const site=WORK_SITES[i%4],phase=(time*.08+i/count)%1,a=phase*Math.PI*2
      let x=site[0]*phase,y=5+Math.sin(phase*Math.PI)*8,z=site[2]*phase
      let sx=.24,sy=.24,sz=.24
      if(city==='Graveyard') {x=site[0]+Math.cos(a)*3;y=.6+Math.sin(time+i)*.04;z=site[2]+4+Math.sin(a)*2;sx=.3;sy=.08;sz=.5}
      if(city==='Gaming') {x=Math.cos(i*1.7)*5;y=3+Math.floor(i/7)*7;z=Math.sin(i*1.7)*5;sx=.6;sy=.08;sz=.6}
      if(city==='Education') {x=Math.cos(a)*9;y=9+i%6*2;z=Math.sin(a)*9;sx=.6;sy=.12;sz=.4}
      if(city==='Health') {x=Math.cos(i*2.4)*5;y=5+phase*8;z=Math.sin(i*2.4)*5;sx=.07;sy=.9;sz=.07}
      if(city==='Legend'||city==='Community') {x=site[0]+Math.cos(a)*2;y=2;z=site[2]+4+Math.sin(a)*2;sx=.16;sy=.32;sz=.16}
      if(city==='Creator') {x=site[0]+Math.cos(a)*3;y=4+Math.sin(a+i);z=site[2]+Math.sin(a)*2;sx=.4;sy=.2;sz=.4}
      if(city==='Robotics') {x=site[0]-3+phase*6;y=1.6;z=site[2]+4;sx=.5;sy=.35;sz=.5}
      if(city==='Space') {y=10+Math.sin(phase*Math.PI)*6;sx=.6;sy=.15;sz=.3}
      dummy.position.set(x,y+energy*.7,z);dummy.rotation.set(0,-a,city==='Education'?.25:0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix()
      ref.current.setMatrixAt(i,dummy.matrix)
      ref.current.setColorAt(i,color.set(city==='Graveyard'?'#5c4768':i%3?p.secondary:p.accent).multiplyScalar(city==='Gaming'?.35+.65*Math.max(0,Math.sin(time*2+i)):1))
    }
    ref.current.instanceMatrix.needsUpdate=true
    if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true
  }
  useLayoutEffect(()=>update(0),[city,count])
  useFrame((_,delta)=>{if(reduced)return;t.current+=Math.min(delta,.1);if(t.current-tick.current<(lowEffects?.15:.033))return;tick.current=t.current;update(t.current)})
  return <instancedMesh name={city+'-environmental-activity'} ref={ref} args={[undefined,undefined,count]} frustumCulled={false}><boxGeometry/><meshBasicMaterial/></instancedMesh>
}
