import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function CommunityCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Community" cap="dome" />
}
export default CommunityCity
