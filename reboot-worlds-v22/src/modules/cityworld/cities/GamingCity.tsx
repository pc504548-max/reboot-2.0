import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function GamingCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Gaming" cap="cube" />
}
export default GamingCity
