import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function SuccessCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Legend" cap="spire" />
}
export default SuccessCity
