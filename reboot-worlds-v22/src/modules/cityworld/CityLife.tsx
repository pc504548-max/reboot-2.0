import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITIES, type CityId } from './cityRegistry'

/** Shared streets and residents; only the active city's population is mounted. */
export function CityLife({ city, reduced, lowEffects }: { city: CityId; reduced: boolean; lowEffects: boolean }) {
  const { palette } = CITIES[city]
  const population = city === 'Graveyard' ? 3 : lowEffects ? 12 : city === 'Legend' ? 36 : 24
  const bodies = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const pods = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const time = useRef(0)
  function update(t: number) {
    if (!bodies.current || !heads.current || !pods.current) return
    for (let i = 0; i < population; i++) {
      const a = i / population * Math.PI * 2 + t * (i % 2 ? .09 : -.07)
      const radius = i % 2 ? 11.7 : 12.4
      const x = Math.cos(a) * radius, z = Math.sin(a) * radius
      dummy.rotation.set(0, -a, 0)
      dummy.position.set(x, 1.05, z); dummy.scale.set(.42, .7, .3); dummy.updateMatrix()
      bodies.current.setMatrixAt(i * 3, dummy.matrix)
      for (let leg = 0; leg < 2; leg++) {
        const stride = reduced ? 0 : Math.sin(t * 5 + i + leg * Math.PI) * .15
        dummy.position.set(x + Math.cos(a) * (leg ? .14 : -.14), .52, z + stride)
        dummy.scale.set(.14, .5, .16); dummy.updateMatrix()
        bodies.current.setMatrixAt(i * 3 + leg + 1, dummy.matrix)
      }
      dummy.position.set(x, 1.63, z); dummy.scale.setScalar(.25); dummy.updateMatrix()
      heads.current.setMatrixAt(i, dummy.matrix)
    }
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + t * .13
      dummy.position.set(Math.cos(a) * 8.8, .65, Math.sin(a) * 8.8)
      dummy.rotation.set(0, -a, 0); dummy.scale.set(1, .55, 1.9); dummy.updateMatrix()
      pods.current.setMatrixAt(i, dummy.matrix)
    }
    for (const mesh of [bodies.current, heads.current, pods.current]) mesh.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => { time.current = 0; update(0) }, [population, city, reduced])
  useFrame((_, delta) => { if (!reduced) { time.current += delta; update(time.current) } })
  return <group name="city-streets-and-residents">
    {/* Inner civic loop and the outer district highway. */}
    {[9, 80].map((r) => <group key={r}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,.08,0]}><ringGeometry args={[r-1.8,r+1.8,128]} /><meshStandardMaterial color="#182735" roughness={.8} /></mesh>
      {[r-1.8,r+1.8].map(edge => <mesh key={edge} rotation={[-Math.PI/2,0,0]} position={[0,.1,0]}><ringGeometry args={[edge,edge+.12,128]} /><meshBasicMaterial color={palette.accent} /></mesh>)}
    </group>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[10.9,13,96]} /><meshStandardMaterial color="#35444f" /></mesh>
    <mesh position={[0,.08,48]}><boxGeometry args={[6,.14,68]} /><meshStandardMaterial color="#1b2c3a" /></mesh>
    {[-3,3].map(x=><mesh key={x} position={[x,.18,48]}><boxGeometry args={[.12,.08,68]} /><meshBasicMaterial color={palette.accent} /></mesh>)}
    {Array.from({length:16},(_,i)=><mesh key={i} position={[0,.18,17+i*4]}><boxGeometry args={[.12,.05,1.8]} /><meshBasicMaterial color="#ddeaf0" /></mesh>)}
    {/* Street lamps, transit shelters and planted civic terraces. */}
    {[-1,1].flatMap(side => [24,44,64].map(z=><group key={`${side}:${z}`} position={[side*5,0,z]}>
      <mesh position={[0,2,0]}><cylinderGeometry args={[.08,.12,4,6]} /><meshStandardMaterial color="#53677b" /></mesh>
      <mesh position={[0,4,0]}><boxGeometry args={[1.2,.18,.7]} /><meshBasicMaterial color={palette.secondary} /></mesh>
      <mesh position={[side*2,.4,0]}><boxGeometry args={[2,.8,3]} /><meshStandardMaterial color={palette.body} /></mesh>
      <mesh position={[side*2,1.1,0]}><icosahedronGeometry args={[.85,0]} /><meshStandardMaterial color={city === 'Graveyard' ? '#514555' : '#237a6c'} flatShading /></mesh>
    </group>))}
    {[-1,1].map(side=><group key={side} position={[side*7,0,36]}>
      <mesh position={[0,2.8,0]}><boxGeometry args={[5,.35,7]} /><meshStandardMaterial color={palette.body} emissive={palette.accent} emissiveIntensity={.35} /></mesh>
      <mesh position={[side*2,1.4,0]}><boxGeometry args={[.25,2.8,6]} /><meshStandardMaterial color="#527384" /></mesh>
      <mesh position={[0,.5,0]}><boxGeometry args={[3,1,4]} /><meshStandardMaterial color={palette.body} /></mesh>
    </group>)}
    <instancedMesh name="residents" ref={bodies} args={[undefined,undefined,population*3]} frustumCulled={false}><boxGeometry /><meshStandardMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={.2} /></instancedMesh>
    <instancedMesh name="resident-heads" ref={heads} args={[undefined,undefined,population]} frustumCulled={false}><sphereGeometry args={[1,8,6]} /><meshStandardMaterial color="#e3f5ff" /></instancedMesh>
    <instancedMesh name="transit-pods" ref={pods} args={[undefined,undefined,4]} frustumCulled={false}><boxGeometry /><meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={.5} metalness={.6} roughness={.3} /></instancedMesh>
  </group>
}
