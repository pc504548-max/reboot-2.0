import { isZeroProject } from '@/lib/projectDiscovery'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { BadgeGallery } from '@/components/BadgeGallery'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe2,
  Network,
  Skull,
  Sparkles,
  Search,
  Plus,
  Bell,
  Award,
  ArrowDownWideNarrow,
  Compass,
  Zap,
  TrendingUp,
  Crown,
  Shield,
  Users,
  Lightbulb,
  RefreshCw,
  UserCheck,
  Boxes,
} from 'lucide-react'
import { useUI, type Mode, type SortFilter } from '@/stores/ui'
import { CITIES, isCityId } from '@/modules/cityworld/cityRegistry'
import { useAuth, useProjects } from '@/stores/auth'
import { useDistrictSignals } from '@/modules/cityworld/environment/districtSignals'
import { GuestProjects } from '@/components/projects/GuestProjects'
import { DISTRICTS, STATUS_BADGES, computeAwards, type ProjectStatus, type AwardType } from '@/types/project'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

const MODES: { id: Mode; label: string; icon: typeof Globe2; desc: string }[] = [
  { id: 'city', label: 'World', icon: Globe2, desc: 'Explore the planet' },
  { id: 'worlds', label: 'Worlds', icon: Boxes, desc: 'Explore connected cities' },
  { id: 'zero', label: 'Zero Hub', icon: Lightbulb, desc: 'Discover ideas before their first 100 views' },
  { id: 'network', label: 'Network', icon: Network, desc: 'See connections' },
  { id: 'graveyard', label: 'Graveyard', icon: Skull, desc: 'Visit the fallen' },
  { id: 'echo', label: 'Echo', icon: Sparkles, desc: 'Digital consciousness' },
]

const AWARD_ICONS: Record<AwardType, typeof Zap> = {
  revival: Zap,
  milestone: TrendingUp,
  legend: Crown,
  survivor: Shield,
  community: Users,
  innovator: Lightbulb,
  comeback: RefreshCw,
  founder: UserCheck, firstlook: Sparkles, discovered: TrendingUp, historian: Shield, restorer: Lightbulb,
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuth(s => s.user)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [accountError, setAccountError] = useState('')
  const mode = useUI((s) => s.mode)
  const selectedRecord = useUI(s => s.selectedProjectId)
  const activeLandmark = useDistrictSignals(s=>!!s.landmark || !!s.resident)
  const inspectingRecord = !!selectedRecord || activeLandmark || mode==='beta'
  const activeMode = mode === 'cityworld' ? 'city' : mode
  const setMode = useUI((s) => s.setMode)
  const selectProject = useUI((s) => s.selectProject)
  const projects = useProjects((s) => s.projects)
  const searchQuery = useUI((s) => s.searchQuery)
  const setSearchQuery = useUI((s) => s.setSearchQuery)
  const [quietView,setQuietView]=useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const statusFilter = useUI((s) => s.statusFilter)
  const setStatusFilter = useUI((s) => s.setStatusFilter)
  const sortFilter = useUI((s) => s.sortFilter)
  const setSortFilter = useUI((s) => s.setSortFilter)
  const categoryFilter = useUI((s) => s.categoryFilter)
  const setCategoryFilter = useUI((s) => s.setCategoryFilter)
  const cityCategory = useUI((s) => s.cityCategory)
  const enterCity = useUI((s) => s.enterCity)
  const travelling = useUI(s => s.travelPhase !== 'idle')
  const [creating, setCreating] = useState(false)
  const [badgesOpen, setBadgesOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filtered = searchQuery
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.founder.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  const statusPills: { id: ProjectStatus; label: string; color: string }[] = [
    { id: 'alive', label: 'Alive', color: '#3BFF91' },
    { id: 'reviving', label: 'Reviving', color: '#3DD8FF' },
    { id: 'decaying', label: 'Decaying', color: '#FFB547' },
    { id: 'abandoned', label: 'Abandoned', color: '#FF5959' },
  ]

  const sortOptions: { id: SortFilter; label: string }[] = [
    { id: 'newest', label: 'Newest' },
    { id: 'trending', label: 'Trending' },
    { id: 'revived', label: 'Reviving' },
    { id: 'abandoned', label: 'Abandoned' },
    { id: 'alphabetical', label: 'A-Z' },
  ]

  const activeSortLabel = sortOptions.find((s) => s.id === sortFilter)?.label ?? 'Sort'

  const awardSummary = useMemo(() => {
    const counts = new Map<string, { type: string; label: string; count: number; awardType: AwardType }>()
    for (const p of projects) {
      for (const a of computeAwards(p)) {
        const existing = counts.get(a.type)
        if (existing) {
          existing.count++
        } else {
          counts.set(a.type, { type: a.type, label: a.label, count: 1, awardType: a.type })
        }
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)
  }, [projects])

  const districtCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of projects) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1)
    }
    return map
  }, [projects])

  return (
    <div className={`reboot-shell relative w-full h-full flex bg-background overflow-hidden ${quietView?'quiet-view':''}`}>
      <button className="interface-toggle" onClick={()=>setQuietView(!quietView)}>{quietView?'Show interface':'Hide interface'}</button>
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute md:relative z-30 w-[300px] h-full flex flex-col border-r border-border/60 bg-surface/80 backdrop-blur-xl"
          >
            {/* Logo — planet icon */}
            <div className="flex items-center gap-md px-lg py-lg border-b border-border/40">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="relative w-8 h-8 rounded-full border-2 border-primary/40 flex items-center justify-center"
                style={{ boxShadow: '0 0 15px rgba(61,216,255,0.2)' }}
              >
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse-soft" />
                <div className="absolute inset-0 rounded-full border border-primary/20" style={{ transform: 'rotateX(70deg)' }} />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-text">Reboot</span>
                <span className="font-mono text-[9px] text-text-secondary/60">PLANET / REBOOT</span>
              </div>
            </div>

            {/* Search */}
            <div className="px-md py-md">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the world..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs text-text placeholder:text-text-secondary/60 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>
              {filtered.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-sm max-h-[240px] overflow-y-auto rounded-lg border border-border/40 bg-card/80 backdrop-blur-xl"
                >
                  {filtered.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setMode(isZeroProject(p)?'zero':'city')
                        selectProject(p.id)
                        setSearchQuery('')
                      }}
                      className="w-full text-left px-md py-2 hover:bg-primary/10 transition-colors border-b border-border/20 last:border-0"
                    >
                      <div className="text-xs text-text truncate">{p.name}</div>
                      <div className="text-[10px] text-text-secondary truncate">{p.tagline}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Districts as biome cards */}
            <div className="flex-1 overflow-y-auto px-md pb-md">
              <div className="label-mono px-sm py-sm flex items-center gap-1">
                <Compass size={11} /> Biomes
              </div>
              {DISTRICTS.filter(d=>d.id!=='Graveyard').map((d) => {
                const isActive = categoryFilter === d.id
                const color = isCityId(d.id) ? CITIES[d.id].palette.accent : d.theme.color
                const count = districtCounts.get(d.id) ?? 0
                return (
                  <button
                    key={d.id}
                    disabled={travelling}
                    aria-pressed={isActive}
                    onClick={() => {
                  if (isCityId(d.id)) {
                    enterCity(d.id)
                    if (window.innerWidth < 768) setSidebarOpen(false)
                    return
                  }
                  setCategoryFilter(isActive ? null : d.id)
                }}
                    className={cn(
                      'w-full flex items-center gap-md px-sm py-2.5 rounded-lg text-xs transition-all duration-300 group relative overflow-hidden',
                      isActive
                        ? 'text-text bg-card/80 border border-border/60'
                        : 'text-text-secondary hover:text-text hover:bg-card/40 border border-transparent',
                    )}
                    style={isActive ? { boxShadow: `0 0 12px ${color}15` } : undefined}
                  >
                    {/* Biome color indicator — now a small geometric shape */}
                    <span
                      className="w-2 h-2 transition-all duration-300 shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: isActive ? `0 0 10px ${color}` : `0 0 4px ${color}80`,
                        transform: isActive ? 'rotate(45deg)' : 'none',
                      }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{isCityId(d.id) ? CITIES[d.id].name : d.shortName}</div>
                      <div className="text-[9px] text-text-secondary/60 truncate">{d.description}</div>
                    </div>
                    {count > 0 && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                        style={{ color: color, backgroundColor: `${color}15` }}
                      >
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="district-active"
                        className="absolute left-0 top-0 bottom-0 w-0.5"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Awards showcase */}
            {awardSummary.length > 0 && (
              <div className="px-md py-md border-t border-border/40">
                <div className="label-mono px-sm py-sm flex items-center gap-1">
                  <Award size={11} /> Achievements
                </div>
                <div className="flex flex-wrap gap-sm px-sm">
                  {awardSummary.slice(0, 5).map((a) => {
                    const Icon = AWARD_ICONS[a.awardType]
                    return (
                      <div
                        key={a.type}
                        className="flex items-center gap-1 px-sm py-1 rounded-lg border border-border/40 bg-card/60"
                        title={`${a.count} ${a.label}`}
                      >
                        <Icon size={11} className="text-primary" />
                        <span className="text-[10px] font-mono text-text">{a.label}</span>
                        <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 rounded">{a.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — redesigned with mode cards */}
        <header className="flex items-center justify-between px-lg py-sm border-b border-border/60 bg-surface/60 backdrop-blur-xl z-20">
          <div className="flex items-center gap-md">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-text-secondary hover:text-text transition-colors"
              aria-label="Toggle sidebar"
            >
              <div className="flex flex-col gap-1">
                <span className="w-4 h-[1.5px] bg-current" />
                <span className="w-4 h-[1.5px] bg-current" />
              </div>
            </button>

            {/* Mode switcher — card style with descriptions */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-card/40 border border-border/40">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  aria-label={m.label}
                  className={cn(
                    'flex items-center gap-1.5 px-md py-1.5 rounded-lg text-xs font-medium transition-all duration-300 relative group',
                    activeMode === m.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:text-text hover:bg-card/60',
                  )}
                  title={m.desc}
                >
                  <m.icon size={14} />
                  <span className="hidden sm:inline">{m.label}</span>
                  {activeMode === m.id && (
                    <motion.div
                      layoutId="mode-active"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-md">
            {/* Status filter pills */}
            <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-card/40 border border-border/40">
              {statusPills.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setStatusFilter(statusFilter === p.id ? null : p.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-sm py-1 rounded-md text-[11px] font-medium transition-all duration-200',
                    statusFilter === p.id
                      ? 'bg-card/80 text-text'
                      : 'text-text-secondary hover:text-text',
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: p.color,
                      boxShadow: statusFilter === p.id ? `0 0 8px ${p.color}` : 'none',
                    }}
                  />
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 px-sm py-1.5 rounded-lg bg-card/40 border border-border/40 text-xs text-text-secondary hover:text-text transition-colors"
              >
                <ArrowDownWideNarrow size={13} />
                <span className="hidden md:inline">{activeSortLabel}</span>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg bg-card/95 backdrop-blur-xl border border-border/60 overflow-hidden shadow-xl"
                    >
                      {sortOptions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSortFilter(s.id); setSortOpen(false) }}
                          className={cn(
                            'w-full text-left px-md py-2 text-xs transition-colors',
                            sortFilter === s.id
                              ? 'text-primary bg-primary/10'
                              : 'text-text-secondary hover:text-text hover:bg-card/60',
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className="beta-trigger" onClick={()=>setMode('beta')}>Beta & feedback</button><button className="account-trigger" onClick={()=>user ? useAuth.getState().signOut().catch(()=>setAccountError('Sign out failed. Please retry.')) : setMode('auth')}>{user?'Sign out':'Sign in'}</button>

          </div>
        </header>

        {/* Module canvas */}
        <main className="relative flex-1 min-h-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={['city', 'cityworld', 'worlds'].includes(mode) ? 'world-system' : mode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {accountError && <div role="alert" className="world-error">{accountError}<button onClick={()=>setAccountError('')}>Dismiss</button></div>}
          {!inspectingRecord && <button className="guest-shelf" onClick={()=>setGuestsOpen(true)}>{user?'My temporary ideas':'Anonymous mode'} · {projects.filter(p=>p.temporary).length} temporary</button>}
          {guestsOpen && <GuestProjects onClose={()=>setGuestsOpen(false)} />}
          {creating && <CreateProjectDialog onClose={() => setCreating(false)} />}
          {badgesOpen && <BadgeGallery onClose={() => setBadgesOpen(false)} />}
          {!inspectingRecord && <>
          <button className="badge-gallery-trigger" onClick={event => { event.currentTarget.focus(); setBadgesOpen(true) }}><Award size={16} /> Badges</button>
          {/* Floating initialize button */}
          <motion.button
            onClick={event => { event.currentTarget.focus(); setCreating(true) }}
            disabled={travelling}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-2xl right-2xl z-20 btn-primary px-xl py-lg rounded-xl shadow-lg flex items-center gap-sm"
            style={{ boxShadow: '0 0 30px rgba(61,216,255,0.25)' }}
          >
            <Plus size={18} />
            <span className="font-mono text-sm tracking-wider">Build an idea</span>
          </motion.button>
          </>}
        </main>
      </div>
    </div>
  )
}
