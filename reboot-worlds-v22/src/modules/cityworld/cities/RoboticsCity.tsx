import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function RoboticsCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Robotics" cap="cube" />
}
export default RoboticsCity
