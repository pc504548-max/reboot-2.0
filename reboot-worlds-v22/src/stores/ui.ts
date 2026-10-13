/**
 * Global UI store: the currently active mode and city-level view settings that
 * more than one module may want to read (e.g. selected project id). Kept
 * separate from auth/project data so modules stay decoupled.
 */
import { create } from 'zustand'
import { isCityId } from '@/modules/cityworld/cityRegistry'
import type { ProjectCategory, ProjectStatus } from '@/types/project'

export type Mode = 'zero' | 'beta' | 'boot' | 'landing' | 'auth' | 'city' | 'network' | 'graveyard' | 'echo' | 'worlds' | 'cityworld'

export type SortFilter =
  | 'newest'
  | 'trending'
  | 'revived'
  | 'abandoned'
  | 'alphabetical'

export interface BuildingCustomization {
  color: string
  height: number
  style: 'standard' | 'spire' | 'pyramid' | 'dome' | 'crystal'
  glowIntensity: number
}

export type TravelPhase = 'idle' | 'loading' | 'departing' | 'crossing' | 'arriving'

interface UIState {
  travelPhase: TravelPhase
  destination: ProjectCategory | null
  travelId: number
  travelError: string | null
  advanceTravel: (id: number, phase: TravelPhase) => void
  cancelTravel: (error?: string) => void
  mode: Mode
  selectedProjectId: string | null
  categoryFilter: ProjectCategory | null
  statusFilter: ProjectStatus | null
  sortFilter: SortFilter
  searchQuery: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  tutorialSeen: boolean
  customizingProjectId: string | null
  customizations: Record<string, BuildingCustomization>
  setMode: (m: Mode) => void
  selectProject: (id: string | null) => void
  setCategoryFilter: (c: ProjectCategory | null) => void
  setStatusFilter: (s: ProjectStatus | null) => void
  setSortFilter: (s: SortFilter) => void
  setSearchQuery: (q: string) => void
  setTimeOfDay: (t: UIState['timeOfDay']) => void
  setTutorialSeen: (seen: boolean) => void
  cityCategory: ProjectCategory | null
  enterCity: (category: ProjectCategory) => void
  exitCity: () => void
  startCustomizing: (id: string) => void
  stopCustomizing: () => void
  updateCustomization: (id: string, patch: Partial<BuildingCustomization>) => void
}

export const useUI = create<UIState>((set, get) => ({
  mode: 'boot',
  selectedProjectId: null,
  categoryFilter: null,
  statusFilter: null,
  sortFilter: 'newest',
  searchQuery: '',
  timeOfDay: 'night',
  tutorialSeen: false,
  customizingProjectId: null,
  customizations: {},
  travelPhase: 'idle',
  destination: null,
  travelId: 0,
  travelError: null,
  setMode: (mode) => {
    if (mode === 'city' && get().mode === 'cityworld') {
      if (get().travelPhase !== 'idle') get().cancelTravel()
      get().exitCity(); return
    }
    const current = get()
    set({ mode, selectedProjectId:mode==='echo'||mode==='network'?current.selectedProjectId:null, customizingProjectId:null, travelPhase: 'idle', travelError: null, travelId: current.travelId + 1,
      ...(current.travelPhase !== 'idle' ? { destination: current.cityCategory, categoryFilter: current.cityCategory } : {}),
      ...(mode === 'city' || mode === 'worlds' || mode === 'zero' || mode === 'graveyard' ? {cityCategory: null, categoryFilter: null, destination: null} : {}) })
  },
  advanceTravel: (id, phase) => set(s => {
    const next: Record<TravelPhase, TravelPhase> = { idle: 'loading', loading: 'departing', departing: 'crossing', crossing: 'arriving', arriving: 'idle' }
    if (s.travelId !== id || next[s.travelPhase] !== phase) return s
    return { travelPhase: phase, ...(phase === 'crossing' ? {
      cityCategory: s.destination, categoryFilter: s.destination,
      mode: s.destination ? 'cityworld' as const : 'city' as const,
    } : {}) }
  }),
  cancelTravel: (error) => set(s => ({ travelPhase: 'idle', travelId: s.travelId + 1,
    destination: s.cityCategory, categoryFilter: s.cityCategory, travelError: error ?? null })),
  cityCategory: null,
  enterCity: (category) => {
    const s = get()
    if (s.travelPhase !== 'idle' || !isCityId(category) || (s.mode === 'cityworld' && s.cityCategory === category)) return
    set({ destination: category, categoryFilter: category, travelPhase: 'loading', travelId: s.travelId + 1,
      travelError: null, selectedProjectId: null,
      ...(!['city', 'cityworld', 'worlds'].includes(s.mode) ? {mode: 'city' as const, cityCategory: null} : {}) })
  },
  exitCity: () => {
    const s = get()
    if (s.travelPhase !== 'idle' || !s.cityCategory) return
    set({ destination: null, categoryFilter: null, travelPhase: 'loading', travelId: s.travelId + 1,
      travelError: null, selectedProjectId: null })
  },
  selectProject: (id) => set({ selectedProjectId: id }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortFilter: (sortFilter) => set({ sortFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setTutorialSeen: (tutorialSeen) => set({ tutorialSeen }),
  startCustomizing: (id) => set({ customizingProjectId: id }),
  stopCustomizing: () => set({ customizingProjectId: null }),
  updateCustomization: (id, patch) =>
    set((state) => ({
      customizations: {
        ...state.customizations,
        [id]: { ...state.customizations[id], ...patch },
      },
    })),
}))
