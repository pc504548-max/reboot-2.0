import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function AICity(props: CitySceneProps) {
  return <DistrictScene {...props} city="AI" cap="spire" />
}
export default AICity
