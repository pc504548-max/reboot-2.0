import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useUI } from '@/stores/ui'
import { CITIES, isCityId } from './cityRegistry'
import type { ProjectCategory } from '@/types/project'
import { CityPortal } from './CityPortal'

export function viewFor(city: ProjectCategory | null, worlds: boolean) {
  return { position: new THREE.Vector3(...(city && isCityId(city) ? CITIES[city].overview : worlds ? [0, 34, 138] : [0, 26, 124]) as [number, number, number]),
    target: new THREE.Vector3(0, city ? 8 : 0, 0) }
}
const ease = (x: number) => x * x * (3 - 2 * x)
export function PortalTransition({ color, reduced, lowEffects, ready, veil }: {
  color: string; reduced: boolean; lowEffects: boolean; ready: boolean; veil: RefObject<HTMLDivElement>
}) {
  const { camera } = useThree()
  const phase = useUI(s => s.travelPhase)
  const id = useUI(s => s.travelId)
  const category = useUI(s => s.cityCategory)
  const mode = useUI(s => s.mode)
  const started = useRef(0)
  const from = useMemo(() => new THREE.Vector3(), [])
  const fromLook = useMemo(() => new THREE.Vector3(), [])
  const direction = useMemo(() => new THREE.Vector3(), [])
  const portal = useMemo(() => new THREE.Vector3(0, 22, 84), [])
  const rotation = useMemo(() => new THREE.Quaternion(), [])
  const end = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(), [])
  useLayoutEffect(() => {
    started.current = performance.now()
    if (phase === 'departing') {
      from.copy(camera.position)
      camera.getWorldDirection(direction)
      fromLook.copy(from).addScaledVector(direction, 30)
      direction.copy(portal).sub(from).normalize()
      rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().negate())
      end.copy(portal).addScaledVector(direction, 10)
      curve.v0.copy(from)
      curve.v1.copy(portal).addScaledVector(direction, -22)
      curve.v2.copy(end)
    }
    if (phase === 'crossing') {
      portal.set(...(category ? [0, 20, -55] : [0, 22, 84]) as [number, number, number])
      rotation.identity()
    }
    if (phase === 'arriving') {
      const view = viewFor(category, false)
      curve.v0.set(...(category ? [0, 20, -53] : [0, 22, 84]) as [number, number, number])
      curve.v1.set(...(category ? [44, 32, -24] : [22, 40, 104]) as [number, number, number])
      curve.v2.copy(view.position)
      if (reduced) { camera.position.copy(view.position); camera.lookAt(view.target) }
      else camera.position.copy(curve.v0)
    }
    if (phase === 'idle') {
      const view = viewFor(category, mode === 'worlds')
      camera.position.copy(view.position)
      camera.lookAt(view.target)
      portal.set(...(category ? [0, 20, -55] : [0, 22, 84]) as [number, number, number])
      rotation.identity()
      if (veil.current) veil.current.style.opacity = '0'
    }
  }, [phase, id, camera, category, mode, reduced])
  useFrame(() => {
    const state = useUI.getState()
    if (state.travelId !== id) return
    const elapsed = (performance.now() - started.current) / 1000
    let opacity = 0
    if (phase === 'departing') {
      const p = Math.min(1, elapsed / (reduced ? .15 : 1.25))
      if (!reduced) {
        curve.getPoint(ease(p), camera.position)
        look.copy(portal).addScaledVector(direction, 20)
        look.lerpVectors(fromLook, look, ease(Math.min(1, p * 3)))
        camera.lookAt(look)
      }
      opacity = reduced ? p : Math.max(0, (p - .78) / .22)
      if (p === 1) state.advanceTravel(id, 'crossing')
    } else if (phase === 'crossing') {
      opacity = 1
      if (ready && elapsed >= .18) state.advanceTravel(id, 'arriving')
    } else if (phase === 'arriving') {
      const p = Math.min(1, elapsed / (reduced ? .15 : 1.2))
      if (!reduced) {
        curve.getPoint(ease(p), camera.position)
        look.set(0, category ? 8 : 0, 0)
        camera.lookAt(look)
      }
      opacity = Math.max(0, 1 - p * 4)
      if (p === 1) state.advanceTravel(id, 'idle')
    }
    if (veil.current) veil.current.style.opacity = String(opacity)
  })
  return <CityPortal color={color} position={portal} quaternion={rotation} reduced={reduced} lowEffects={lowEffects} />
}
