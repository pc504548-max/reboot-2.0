import { useLayoutEffect,useMemo,useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { type CityId,CITIES } from '../cityRegistry'
import { useEnvironment } from './ScenePrimitives'
import { WORK_SITES } from './cityDesign'
import { useDistrictSignals } from './districtSignals'
/** Small mechanical fauna: seed carriers, archive moths, survey rays and workshop beetles. */
export function LifeForms({city}:{city:CityId}) {
  const ref=useRef<THREE.InstancedMesh>(null),time=useRef(0),tick=useRef(0)
  const {lowEffects,reduced}=useEnvironment(),count=lowEffects?6:14
  const dummy=useMemo(()=>new THREE.Object3D(),[]),color=useMemo(()=>new THREE.Color(),[])
  const aquatic=city==='Health'||city==='Community',ground=city==='Robotics'||city==='IdeaHub'
  function update(t:number) {
    if(!ref.current)return
    const signal=useDistrictSignals.getState().pulse,reaction=signal>0?Math.max(0,1-(performance.now()-signal)/3500):0
    for(let i=0;i<count;i++) {
      const site=WORK_SITES[i%4],angle=t*(city==='Graveyard'?.08:.22)+i*2.4,r=6+i%3*2-reaction*2
      const x=site[0]+Math.cos(angle)*r,z=site[2]+Math.sin(angle)*r
      const y=ground?.5:aquatic?1.4+Math.sin(t+i)*.2:4+i%3+Math.sin(t+i)*.8
      for(let part=0;part<3;part++) {
        const side=part===1?-1:1
        dummy.position.set(x+(part?Math.cos(angle)*side*.6:0),y+(part&&!ground?Math.sin(t*3+i)*.3:0),z+(part?-Math.sin(angle)*side*.6:0))
        dummy.rotation.set(0,angle,part&&!ground?side*Math.sin(t*3+i)*.4:0)
        dummy.scale.set(part?ground?.2:1.1:.5,part?.08:.22,part?.45:.8)
        dummy.updateMatrix();ref.current.setMatrixAt(i*3+part,dummy.matrix)
        ref.current.setColorAt(i*3+part,color.set(part?CITIES[city].palette.secondary:ground?'#99acb4':CITIES[city].palette.accent))
      }
    }
    ref.current.instanceMatrix.needsUpdate=true
    if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true
  }
  useLayoutEffect(()=>update(0),[city,count])
  useFrame((_,d)=>{if(reduced)return;time.current+=Math.min(d,.05);if(time.current-tick.current<(lowEffects?.12:.04))return;tick.current=time.current;update(time.current)})
  return <instancedMesh name={`${city}-mechanical-fauna`} ref={ref} args={[undefined,undefined,count*3]} frustumCulled={false} onClick={e=>{e.stopPropagation();useDistrictSignals.getState().inspect(city,8)}}><octahedronGeometry args={[1,0]}/><meshStandardMaterial metalness={.35} roughness={.55}/></instancedMesh>
}
