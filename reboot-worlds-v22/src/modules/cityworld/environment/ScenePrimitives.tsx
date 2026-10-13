import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const EnvironmentSettings = createContext({ reduced: false, lowEffects: false })
export const useEnvironment = () => useContext(EnvironmentSettings)
export type Vec = [number, number, number]
export type Shape = 'hex' | 'box' | 'pillar' | 'cone' | 'orb' | 'rock' | 'ring'
export interface Part { shape: Shape; p: Vec; s: Vec; r: Vec; color: string; glow: boolean }
/** Unit primitives are batched by geometry and material, including instance colors. */
export class Architecture {
  parts: Part[] = []
  add(shape: Shape, p: Vec, s: Vec, color: string, r: Vec = [0, 0, 0], glow = false) {
    this.parts.push({shape,p,s,r,color,glow}); return this
  }
  box(p: Vec, s: Vec, color: string, r: Vec = [0,0,0], glow = false) { return this.add('box',p,s,color,r,glow) }
  ring(p: Vec, radius: number, color: string, r: Vec = [Math.PI/2,0,0], glow = true) { return this.add('ring',p,[radius,radius,radius],color,r,glow) }
  beam(a: Vec, b: Vec, width: number, color: string, glow = false) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const direction = end.clone().sub(start)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize())
    const r = new THREE.Euler().setFromQuaternion(q)
    return this.box(start.add(end).multiplyScalar(.5).toArray() as Vec,[width,direction.length(),width],color,[r.x,r.y,r.z],glow)
  }
}
function Batch({ parts, shape, glow }: { parts: Part[]; shape: Shape; glow: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D(), color = new THREE.Color()
    parts.forEach((part,i) => {
      dummy.position.set(...part.p); dummy.scale.set(...part.s); dummy.rotation.set(...part.r); dummy.updateMatrix()
      ref.current!.setMatrixAt(i,dummy.matrix); ref.current!.setColorAt(i,color.set(part.color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  },[parts])
  return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]}>
    {shape === 'hex' && <cylinderGeometry args={[1,1,1,6]} />}
    {shape === 'box' && <boxGeometry />}
    {shape === 'pillar' && <cylinderGeometry args={[1,1,1,12]} />}
    {shape === 'cone' && <coneGeometry args={[1,1,6]} />}
    {shape === 'orb' && <sphereGeometry args={[1,16,10]} />}
    {shape === 'rock' && <icosahedronGeometry args={[1,0]} />}
    {shape === 'ring' && <torusGeometry args={[1,.018,5,48]} />}
    {glow ? <meshBasicMaterial toneMapped={false} /> : <meshStandardMaterial metalness={.2} roughness={.72} flatShading />}
  </instancedMesh>
}
export function Parts({ data, name }: {data: Architecture; name?: string}) {
  const batches = useMemo(() => {
    const result = new Map<string,Part[]>()
    data.parts.forEach(part => {const key = `${part.shape}-${part.glow}`; const list = result.get(key) ?? []; list.push(part); result.set(key,list)})
    return [...result.entries()]
  },[data])
  return <group name={name}>{batches.map(([key,parts]) => <Batch key={key} parts={parts} shape={parts[0].shape} glow={parts[0].glow} />)}</group>
}
export function Motion({ children, position = [0,0,0], speed = .12, bob = 0, axis = 'y', swing = false }: {children: ReactNode; position?: Vec; speed?: number; bob?: number; axis?: 'x'|'y'|'z'; swing?: boolean}) {
  const ref = useRef<THREE.Group>(null), time = useRef(0)
  const {reduced,lowEffects} = useEnvironment()
  useFrame((_,delta) => {
    if (reduced || !ref.current) return
    time.current += Math.min(delta,.1)
    ref.current.rotation[axis] = swing ? Math.sin(time.current * speed)*.55 : time.current * speed * (lowEffects ? .5 : 1)
    ref.current.position.y = position[1] + Math.sin(time.current*.65)*bob
  })
  return <group ref={ref} position={position}>{children}</group>
}
