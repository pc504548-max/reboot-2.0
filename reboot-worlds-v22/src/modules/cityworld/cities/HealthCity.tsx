import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function HealthCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Health" cap="dome" />
}
export default HealthCity
