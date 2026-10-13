import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function CreatorCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Creator" cap="cube" />
}
export default CreatorCity
