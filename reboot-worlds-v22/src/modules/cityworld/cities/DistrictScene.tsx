import { useMemo, useState, type ReactNode } from 'react'
import { Grid } from '@react-three/drei'
import type { CitySceneProps } from '../CityWorldModule'
import { CITIES, type CityId } from '../cityRegistry'
import { CityTower, FillerSkyline, makeTowerDNA, type TowerCap } from './cityKit'

/** Shared infrastructure for a district; its landmark stays specific to the city. */
export function DistrictScene({ city, children, cap = 'spire', projects, selectedId, onSelect }: CitySceneProps & { city: CityId; children: ReactNode; cap?: TowerCap }) {
  const palette = CITIES[city].palette
  const [hovered, setHovered] = useState<string | null>(null)
  const towers = useMemo(() => projects.map((p, i) => makeTowerDNA(p, i, projects.length)), [projects])
  return <group name={`${city}-district`}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[320, 320]} /><meshStandardMaterial color={palette.ground} roughness={.85} /></mesh>
    <Grid position={[0,.02,0]} args={[100,100]} cellSize={4} cellColor={palette.gridCell} sectionSize={20} sectionColor={palette.gridSection} fadeDistance={160} infiniteGrid />
    {children}
    {projects.map((project,i)=><CityTower key={project.id} project={project} dna={towers[i]} palette={palette} cap={cap} hovered={hovered === project.id} selected={selectedId === project.id} onHover={setHovered} onSelect={onSelect} />)}
    <FillerSkyline palette={palette} count={city === 'Community' ? 54 : 44} seed={city} heightScale={city === 'Community' ? .65 : .9} />
  </group>
}
