import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'
import { CITIES } from '../cityRegistry'

export function CommunityCity(props: CitySceneProps) {
  const { accent, secondary } = CITIES.Community.palette
  return <DistrictScene {...props} city="Community" cap="dome">
    <group name="community-forum">
      {[6,4.8,3.6].map((r,i)=><mesh key={r} position={[0,.4+i*.6,0]}><cylinderGeometry args={[r,r+.3,.7,12]} /><meshStandardMaterial color={i%2 ? '#347779' : '#e0cdb0'} /></mesh>)}
      {Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*4.8,4.5,Math.sin(a)*4.8]}><cylinderGeometry args={[.25,.35,7,8]} /><meshStandardMaterial color={secondary} /></mesh>})}
      <mesh position={[0,8.5,0]}><coneGeometry args={[6.5,2,6]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.2} /></mesh>
      <mesh position={[0,10.5,0]}><icosahedronGeometry args={[1.1,0]} /><meshBasicMaterial color={secondary} /></mesh>
    </group>
    {Array.from({length:8},(_,i)=>{const a=Math.PI+i/7*Math.PI, x=Math.cos(a)*33,z=Math.sin(a)*33;return <group key={i} position={[x,0,z]} rotation={[0,-a,0]}>
      <mesh position={[0,2.5,0]}><boxGeometry args={[6,5,5]} /><meshStandardMaterial color={i%2 ? '#dfc2a0' : '#508f8b'} /></mesh>
      <mesh position={[0,5.5,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[4.8,2,4]} /><meshStandardMaterial color={i%2 ? secondary : accent} /></mesh>
      <mesh position={[0,2,2.55]}><boxGeometry args={[2,3,.15]} /><meshBasicMaterial color="#fff0cd" /></mesh>
      <mesh position={[5,.4,0]}><boxGeometry args={[2,.8,3]} /><meshStandardMaterial color="#204c46" /></mesh>
      <mesh position={[5,2,0]}><icosahedronGeometry args={[1.6,0]} /><meshStandardMaterial color="#58ab75" flatShading /></mesh>
    </group>})}
  </DistrictScene>
}
