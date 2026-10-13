import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEnvironment } from './ScenePrimitives'
import { Architecture, Motion, Parts } from './ScenePrimitives'

/** Layered accretion geometry creates a bent-light silhouette without a screen-space pass. */
export function BlackHole({position = [-28,34,-42], scale = 1}: {position?: [number,number,number];scale?:number}) {
  const debris=useMemo(()=>{
    const a=new Architecture()
    for(let i=0;i<28;i++) {const angle=i*2.4,r=15+(i%7)*1.6;a.add('rock',[Math.cos(angle)*r,Math.sin(angle)*r*.38,(i%3-1)*2],[.25+i%3*.15,.4,.5],i%3?'#596579':'#794758',[i,0,i])}
    return a
  },[])
  return <group name="black-hole" position={position} scale={scale} rotation={[.15,-.45,.25]}>
    <mesh><sphereGeometry args={[8,32,20]} /><meshBasicMaterial fog={false} color="#010104" /></mesh>
    {[8.3,9.1,11,13,15].map((r,i)=><mesh key={r} rotation={[i<2?0:1.16,0,0]} scale={[1,i<2?1:1.12,1]}><torusGeometry args={[r,i===0?.15:.24,6,96]} /><meshBasicMaterial fog={false} color={['#b797bd','#334f67','#a85178','#6d425d','#334958'][i]} transparent opacity={1-i*.14} depthWrite={false} /></mesh>)}
    <Motion speed={-.055}><Parts data={debris} /></Motion><Infall />
  </group>
}

function Infall() {
  const mesh=useRef<THREE.InstancedMesh>(null),time=useRef(0),{reduced,lowEffects}=useEnvironment()
  const dummy=useMemo(()=>new THREE.Object3D(),[])
  useFrame((_,delta)=>{
    if(!mesh.current)return
    if(!reduced)time.current+=Math.min(delta,.1)
    for(let i=0;i<8;i++) {
      const progress=(time.current*.025+i/8)%1,r=22-progress*15,angle=i*2.4+progress*4
      dummy.position.set(Math.cos(angle)*r,Math.sin(angle)*r*.5,Math.sin(angle)*2)
      dummy.scale.setScalar((1-progress)*.6);dummy.rotation.set(angle,angle,0);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate=true
  })
  if(lowEffects)return null
  return <instancedMesh ref={mesh} args={[undefined,undefined,8]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="#8c647f" fog={false}/></instancedMesh>
}
