import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import type { Group } from 'three'
import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'
import { CITIES } from '../cityRegistry'

export function SpaceCity(props: CitySceneProps) {
  const satellite = useRef<Group>(null)
  const reduced = useReducedMotion()
  const { accent, secondary } = CITIES.Space.palette
  useFrame((_, delta) => { if (satellite.current && !reduced) satellite.current.rotation.y += delta * .12 })
  return <DistrictScene {...props} city="Space">
    <group name="spaceport-launch-tower">
      <mesh position={[0,.5,0]}><cylinderGeometry args={[6.8,7.4,1,12]} /><meshStandardMaterial color="#182440" /></mesh>
      <mesh position={[0,9,0]}><cylinderGeometry args={[1.4,2,16,12]} /><meshStandardMaterial color="#e0e8f4" metalness={.6} roughness={.3} /></mesh>
      <mesh position={[0,19,0]}><coneGeometry args={[1.4,4,12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.3} /></mesh>
      {[-1,1].map(side=><group key={side} position={[side*2.5,0,0]}>
        <mesh position={[0,5,0]}><cylinderGeometry args={[.8,1,8,8]} /><meshStandardMaterial color="#8a9eaf" /></mesh>
        <mesh position={[0,10,0]}><coneGeometry args={[.8,2,8]} /><meshStandardMaterial color={secondary} /></mesh>
      </group>)}
      <mesh position={[-4,11,0]}><boxGeometry args={[1.2,22,1.2]} /><meshStandardMaterial color="#38557b" /></mesh>
      {[5,11,17].map(y=><mesh key={y} position={[-2.5,y,0]}><boxGeometry args={[3,.4,.6]} /><meshBasicMaterial color={accent} /></mesh>)}
    </group>
    <group ref={satellite} name="orbital-satellites" position={[0,26,0]}>
      {[0,Math.PI].map(a=><group key={a} position={[Math.cos(a)*16,0,Math.sin(a)*16]} rotation={[0,-a,.2]}>
        <mesh><boxGeometry args={[2,2,2]} /><meshStandardMaterial color="#d6e6ff" metalness={.7} roughness={.3} /></mesh>
        {[-1,1].map(side=><mesh key={side} position={[side*4,0,0]}><boxGeometry args={[5,.15,3]} /><meshStandardMaterial color="#23418a" emissive={secondary} emissiveIntensity={.4} /></mesh>)}
      </group>)}
    </group>
    {[-1,1].map(side=><group key={side} position={[side*30,0,-24]}>
      <mesh position={[0,.5,0]}><cylinderGeometry args={[7,8,1,12]} /><meshStandardMaterial color="#162843" /></mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,1.05,0]}><ringGeometry args={[5,5.2,40]} /><meshBasicMaterial color={accent} /></mesh>
    </group>)}
  </DistrictScene>
}
