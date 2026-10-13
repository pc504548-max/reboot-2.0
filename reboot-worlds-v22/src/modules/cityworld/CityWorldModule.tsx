import type { Project } from '@/types/project'
export interface CitySceneProps {
  projects: Project[]
  selectedId: string | null
  onSelect: (project: Project) => void
}
export { CityWorldManager as CityWorldModule } from './CityWorldManager'
