import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function RevivalCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="IdeaHub" cap="spire" />
}
export default RevivalCity
