import { LifeForms } from '../environment/LifeForms'
import { useMemo, useState, type ReactNode } from 'react'
import type { CitySceneProps } from '../CityWorldModule'
import { CITIES, type CityId } from '../cityRegistry'
import { CityTower, makeTowerDNA, type TowerCap } from './cityKit'
import { CityEnvironment } from '../environment/CityEnvironment'
import { CityActivity } from '../environment/CityActivity'
import { CityLandmark } from '../environment/Landmarks'

/** Project buildings retain real status and selection; scenery is environmental. */
export function DistrictScene({ city, children, cap = 'spire', projects, selectedId, onSelect }: CitySceneProps & { city: CityId; children?: ReactNode; cap?: TowerCap }) {
  const palette = CITIES[city].palette
  const [hovered, setHovered] = useState<string | null>(null)
  const towers = useMemo(() => projects.map((p, i) => makeTowerDNA(p, i, projects.length)), [projects])
  return <group name={city+'-district'}>
    <CityEnvironment city={city} />
    <CityLandmark city={city} />
    <CityActivity city={city} /><LifeForms city={city} />
    {children}
    {projects.map((project,i)=><CityTower key={project.id} project={project} dna={towers[i]} palette={palette} cap={cap} hovered={hovered === project.id} selected={selectedId === project.id} onHover={setHovered} onSelect={onSelect} />)}
  </group>
}
