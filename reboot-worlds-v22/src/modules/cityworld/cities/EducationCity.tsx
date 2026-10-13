import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function EducationCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Education" cap="dome" />
}
export default EducationCity
