import type { CitySceneProps } from '../CityWorldModule'
import { DistrictScene } from './DistrictScene'

export function GraveyardCity(props: CitySceneProps) {
  return <DistrictScene {...props} city="Graveyard" cap="none" />
}
export default GraveyardCity
