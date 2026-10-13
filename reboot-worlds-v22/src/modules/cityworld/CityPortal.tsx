import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUI } from '@/stores/ui'

/** Original radial shader: no textures, noise libraries, or postprocessing. */
const fragmentShader = `
  uniform vec3 tint;
  uniform float time;
  uniform float energy;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float wave = sin(r * 24.0 - time * 3.0 + sin(a * 5.0 + time) * .35);
    float edge = smoothstep(.55, .97, r);
    float alpha = (1.0 - smoothstep(.96, 1.0, r)) * (.16 + energy * .55 + edge * .25);
    gl_FragColor = vec4(mix(tint, vec3(.85, .98, 1.0), edge * .6 + wave * .08), alpha);
  }
`
export function CityPortal({ color, position, quaternion, reduced, lowEffects }: {
  color: string; position: THREE.Vector3; quaternion: THREE.Quaternion; reduced: boolean; lowEffects: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const rim = useRef<THREE.MeshStandardMaterial>(null)
  const rings = useRef<THREE.Group>(null)
  const uniforms = useMemo(() => ({ tint: { value: new THREE.Color() }, time: { value: 0 }, energy: { value: 0 } }), [])
  uniforms.tint.value.set(color)
  useFrame((_, delta) => {
    group.current?.position.copy(position)
    group.current?.quaternion.copy(quaternion)
    const active = useUI.getState().travelPhase !== 'idle'
    if (!reduced) {
      uniforms.time.value += delta
      if (rings.current) rings.current.rotation.z += delta * (active ? .9 : .12)
    }
    if (rim.current) rim.current.emissiveIntensity = THREE.MathUtils.damp(rim.current.emissiveIntensity, active ? 3 : 1.2, 5, delta)
    uniforms.energy.value = THREE.MathUtils.damp(uniforms.energy.value, active ? 1 : 0, 5, delta)
  })
  return <group ref={group} position={position} quaternion={quaternion}>
    <mesh><torusGeometry args={[5.8, .32, 8, 64]} /><meshStandardMaterial ref={rim} color="#132536" emissive={color} emissiveIntensity={1.7} /></mesh>
    <group ref={rings}>
      {[6.4, 7].map((r, i) => <mesh key={r} rotation={[0, 0, i * Math.PI]}>
        <torusGeometry args={[r, .06, 5, lowEffects ? 32 : 64, Math.PI * 1.6]} /><meshBasicMaterial color={color} toneMapped={false} />
      </mesh>)}
      {!lowEffects && Array.from({length: 12}, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 6) * 6.7, Math.sin(i * Math.PI / 6) * 6.7, .15]}>
        <octahedronGeometry args={[.11]} /><meshBasicMaterial color={color} />
      </mesh>)}
    </group>
    <mesh><circleGeometry args={[5.6, 64]} /><shaderMaterial uniforms={uniforms}
      vertexShader="varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
      fragmentShader={fragmentShader} transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <mesh position={[0, -7.6, 0]}><cylinderGeometry args={[8, 5, 1.2, 8]} /><meshStandardMaterial color="#102236" emissive={color} emissiveIntensity={.18} /></mesh>
  </group>
}
