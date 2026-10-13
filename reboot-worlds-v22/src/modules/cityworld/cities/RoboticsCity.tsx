import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { Group } from 'three'
import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'
import { CITIES } from '../cityRegistry'

export function RoboticsCity(props: CitySceneProps) {
  const arm = useRef<Group>(null)
  const time = useRef(0)
  const reduced = useReducedMotion()
  const { accent, secondary } = CITIES.Robotics.palette
  useFrame((_, delta) => { if (arm.current && !reduced) { time.current += delta; arm.current.rotation.y = Math.sin(time.current * .4) * .6 } })
  return <DistrictScene {...props} city="Robotics" cap="cube">
    <group name="robotics-assembly-arm">
      <mesh position={[0,1,0]}><cylinderGeometry args={[4.5,5.5,2,8]} /><meshStandardMaterial color="#25333a" metalness={.7} roughness={.3} /></mesh>
      <group ref={arm} position={[0,2,0]}>
        <mesh position={[0,5,0]}><boxGeometry args={[2,10,2]} /><meshStandardMaterial color={secondary} metalness={.6} roughness={.35} /></mesh>
        <mesh position={[0,10,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.6,1.6,2.5,12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.3} /></mesh>
        <group position={[0,10,0]} rotation={[0,0,-.65]}>
          <mesh position={[0,4,0]}><boxGeometry args={[1.5,8,1.5]} /><meshStandardMaterial color={secondary} /></mesh>
          <mesh position={[0,8,0]}><sphereGeometry args={[1.2,10,8]} /><meshBasicMaterial color={accent} /></mesh>
          {[-1,1].map(side=><mesh key={side} position={[side*.85,9.5,0]} rotation={[0,0,side*.2]}><boxGeometry args={[.4,3,.8]} /><meshStandardMaterial color="#92aabc" /></mesh>)}
        </group>
      </group>
    </group>
    {[-1,1].map(side=><group key={side} position={[side*28,0,-18]}>
      <mesh position={[0,1.5,0]}><boxGeometry args={[9,3,24]} /><meshStandardMaterial color="#26343c" /></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[0,3.1,-10+i*2.5]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.3,.3,8,8]} /><meshStandardMaterial color={i%2 ? accent : '#718a9c'} metalness={.7} roughness={.35} /></mesh>)}
      {[0,8].map(z=><mesh key={z} position={[0,4.2,z]}><boxGeometry args={[2,2,2]} /><meshStandardMaterial color={secondary} /></mesh>)}
    </group>)}
  </DistrictScene>
}
