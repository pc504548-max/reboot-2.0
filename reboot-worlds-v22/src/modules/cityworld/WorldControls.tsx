import { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Spherical, Vector3 } from 'three'

/** Mouse/touch orbit plus keyboard exploration from the focused canvas. */
export function WorldControls({ city, reduced }: {city: boolean; reduced: boolean}) {
  const { camera, gl, invalidate } = useThree()
  const controls = useThree(s => s.controls) as unknown as {target: Vector3; update: () => void} | null
  useEffect(() => {
    const canvas = gl.domElement
    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', '3D world. Drag to orbit, pinch to zoom. Arrow keys rotate; plus and minus zoom.')
    const onKey = (event: KeyboardEvent) => {
      if (!controls || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)) return
      event.preventDefault()
      const offset = camera.position.clone().sub(controls.target)
      const spherical = new Spherical().setFromVector3(offset)
      if (event.key === 'ArrowLeft') spherical.theta -= .12
      if (event.key === 'ArrowRight') spherical.theta += .12
      if (event.key === 'ArrowUp') spherical.phi -= .08
      if (event.key === 'ArrowDown') spherical.phi += .08
      if (event.key === '+' || event.key === '=') spherical.radius *= .9
      if (event.key === '-') spherical.radius *= 1.1
      spherical.phi = Math.max(.1, Math.min(Math.PI / 1.9, spherical.phi))
      spherical.radius = Math.max(city ? 20 : 70, Math.min(city ? 130 : 260, spherical.radius))
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical))
      controls.update()
      invalidate()
    }
    canvas.addEventListener('keydown', onKey)
    return () => {canvas.removeEventListener('keydown', onKey); canvas.removeAttribute('tabindex')}
  }, [camera, gl, controls, city, invalidate])
  return <OrbitControls makeDefault target={[0,city ? 8 : 0,0]} enablePan={false}
    minDistance={city ? 20 : 70} maxDistance={city ? 130 : 260} maxPolarAngle={Math.PI / 1.9} enableDamping={!reduced} />
}
