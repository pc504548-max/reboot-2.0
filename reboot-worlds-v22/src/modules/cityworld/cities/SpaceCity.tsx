import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function SpaceCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Space" cap="dome" />
}
export default SpaceCity
