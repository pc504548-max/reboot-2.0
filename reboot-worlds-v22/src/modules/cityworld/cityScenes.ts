import { lazy, type ComponentType } from 'react'
import type { ProjectCategory } from '@/types/project'
import type { CityId } from './cityRegistry'
import type { CitySceneProps } from './CityWorldModule'
const loaders = {
  Space: () => import('./cities/SpaceCity').then(m => ({ default: m.SpaceCity })),
  Robotics: () => import('./cities/RoboticsCity').then(m => ({ default: m.RoboticsCity })),
  Community: () => import('./cities/CommunityCity').then(m => ({ default: m.CommunityCity })),
  AI: () => import('./cities/AICity').then(m => ({ default: m.AICity })),
  Gaming: () => import('./cities/GamingCity').then(m => ({ default: m.GamingCity })),
  Education: () => import('./cities/EducationCity').then(m => ({ default: m.EducationCity })),
  Health: () => import('./cities/HealthCity').then(m => ({ default: m.HealthCity })),
  Creator: () => import('./cities/CreatorCity').then(m => ({ default: m.CreatorCity })),
  IdeaHub: () => import('./cities/RevivalCity').then(m => ({ default: m.RevivalCity })),
  Graveyard: () => import('./cities/GraveyardCity').then(m => ({ default: m.GraveyardCity })),
  Legend: () => import('./cities/SuccessCity').then(m => ({ default: m.SuccessCity })),
} satisfies Record<CityId, () => Promise<{default: ComponentType<CitySceneProps>}>>
const pending = new Map<string, Promise<{default: ComponentType<CitySceneProps>}>>()
export function loadCity(category: ProjectCategory | null) {
  if (!category) return Promise.resolve()
  const loader = loaders[category as keyof typeof loaders]
  if (!loader) return Promise.reject(new Error('City unavailable'))
  if (!pending.has(category)) pending.set(category, loader().catch(error => { pending.delete(category); throw error }))
  return pending.get(category)!
}
export const CITY_SCENES = Object.fromEntries(Object.keys(loaders).map(category => [category,
  lazy(() => loadCity(category as ProjectCategory) as Promise<{default: ComponentType<CitySceneProps>}>)
])) as Partial<Record<ProjectCategory, ComponentType<CitySceneProps>>>
