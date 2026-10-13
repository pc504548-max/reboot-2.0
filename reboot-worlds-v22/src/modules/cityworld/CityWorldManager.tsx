import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CityLife } from './CityLife'
import { WorldControls } from './WorldControls'
import { useUI } from '@/stores/ui'
import { useProjects } from '@/stores/auth'
import { planPlanet } from '@/modules/city/CityModule'
import { WorldHub, CityStatsOverlay, ProjectDetail, AIGuide } from '@/modules/city/CityVisualization'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import { CITIES, isCityId, CITY_CATEGORIES, CITY_LABELS, CITY_ENV } from './cityRegistry'
import { DISTRICT_MAP } from '@/types/project'
import { CITY_SCENES } from './cityScenes'
import { PortalTransition } from './PortalTransition'
import { useCityNavigation, useMotionSettings } from './hooks/useCityNavigation'

const WorldsScene = lazy(() => import('@/modules/city/MiniatureWorlds').then(m => ({default: m.WorldsScene})))
class SceneBoundary extends Component<{children: ReactNode; onError: () => void; fallback: ReactNode}, {failed: boolean}> {
  state = {failed: false}
  static getDerivedStateFromError() { return {failed: true} }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
function Ready({ onReady }: {onReady: () => void}) {
  useEffect(onReady, [onReady])
  return null
}
function ContextHealth({ onLost }: {onLost: () => void}) {
  const gl = useThree(s => s.gl)
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => gl.domElement.removeEventListener('webglcontextlost', lost)
  }, [gl, onLost])
  return null
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

export function CityWorldManager() {
  const {phase, destination, busy} = useCityNavigation()
  const {reduced, lowEffects, setLowEffects} = useMotionSettings()
  const category = useUI(s => s.cityCategory)
  const mode = useUI(s => s.mode)
  const projects = useProjects(s => s.projects)
  const selectedId = useUI(s => s.selectedProjectId)
  const selectProject = useUI(s => s.selectProject)
  const error = useUI(s => s.travelError)
  const status = useUI(s => s.statusFilter)
  const sort = useUI(s => s.sortFilter)
  const filter = useUI(s => s.categoryFilter)
  const [readyKey, setReadyKey] = useState('')
  const [webgl, setWebgl] = useState(supportsWebGL)
  const veil = useRef<HTMLDivElement>(null)
  const canCustomize = mode === 'city' && !category
  const key = category ?? mode
  const visible = useMemo(() => {
    let list = projects.filter(p => (!category || p.category === category) && (!status || p.status === status))
    if (!category && !busy && filter) list = list.filter(p => p.category === filter)
    return [...list].sort((a,b) => sort === 'alphabetical' ? a.name.localeCompare(b.name) : sort === 'trending' ? b.followers-a.followers : sort === 'revived' ? Number(b.status==='reviving')-Number(a.status==='reviving') : sort === 'abandoned' ? Number(b.status==='abandoned')-Number(a.status==='abandoned') : +new Date(b.createdAt)-+new Date(a.createdAt))
  }, [projects, category, status, sort, filter, busy])
  const planet = useMemo(() => planPlanet(visible), [visible])
  const selected = projects.find(p => p.id === selectedId)
  const Scene = category ? CITY_SCENES[category] : null
  const env = category ? CITY_ENV[category]! : {bg:'#03050a', fogNear:260, fogFar:700}
  const name = category ? CITY_LABELS[category] : mode === 'worlds' ? 'Worlds' : 'World Hub'
  const tintCity = destination ?? category ?? 'AI'
  const accent = isCityId(tintCity) ? CITIES[tintCity].palette.accent : '#3DD8FF'
  useEffect(() => {
    if (!webgl && phase !== 'idle') {
      useUI.getState().advanceTravel(useUI.getState().travelId, phase === 'loading' ? 'departing' : phase === 'departing' ? 'crossing' : phase === 'crossing' ? 'arriving' : 'idle')
    }
  }, [webgl, phase])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog[open]') || event.key !== 'Escape' || /INPUT|TEXTAREA/.test((event.target as HTMLElement).tagName)) return
      const state = useUI.getState()
      if (state.travelPhase !== 'idle') state.cancelTravel()
      else if (state.selectedProjectId) state.selectProject(null)
      else if (state.cityCategory) state.exitCity()
    }
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', escape); document.body.style.cursor = '' }
  }, [])
  useEffect(() => { document.body.style.cursor = '' }, [key])
  const onReady = useMemo(() => () => setReadyKey(key), [key])
  const onLost = useMemo(() => () => {setWebgl(false); useUI.getState().cancelTravel('Graphics connection lost. Project navigation is still available.')}, [])
  const fallback = <div className="world-fallback"><h2>3D view unavailable</h2><p>You can still explore cities and open their projects using the controls below.</p></div>
  return <div className="absolute inset-0" data-city={category ?? 'hub'} data-travel-phase={phase} data-reduced-motion={reduced}>
    {webgl ? <SceneBoundary onError={() => {setWebgl(false); useUI.getState().cancelTravel('The 3D scene could not load. Project navigation is still available.')}} fallback={fallback}>
      <Canvas camera={{position:[0,26,124], fov:50, near:.1, far:1200}}
        dpr={[1, lowEffects ? 1 : 1.5]} gl={{antialias:!lowEffects, powerPreference:'high-performance'}} frameloop={reduced && !busy ? 'demand' : 'always'}>
        <color attach="background" args={[env.bg]} /><fog attach="fog" args={[env.bg, env.fogNear, env.fogFar]} />
        <ambientLight intensity={category ? .65 : .9} />
        <hemisphereLight args={['#9bc4ff','#151827', .65]} />
        <directionalLight position={[60,80,140]} intensity={1.6} color={category === 'IdeaHub' ? '#ffe1aa' : '#cfe2ff'} />
        <Suspense fallback={null}>
          {Scene ? <Scene key={category} projects={visible} selectedId={selectedId} onSelect={p => {if (!busy) selectProject(p.id)}} /> : mode === 'worlds' ? <WorldsScene projects={planet} /> : <WorldHub projects={planet} />}
          <>{category && isCityId(category) && <CityLife key={category} city={category} reduced={reduced} lowEffects={lowEffects} />}</>
          <Ready key={`ready-${key}`} onReady={onReady} />
        </Suspense>
        <PortalTransition color={accent} reduced={reduced} lowEffects={lowEffects} ready={readyKey === key} veil={veil} />
        {!busy && <WorldControls key={key} city={!!category} reduced={reduced} />}
        <ContextHealth onLost={onLost} />
      </Canvas>
    </SceneBoundary> : fallback}
    <div ref={veil} className="portal-veil" style={{opacity:0, background:`radial-gradient(ellipse, #e8ffff 0%, ${accent} 65%, #102337 100%)`}} />
    <div className={`world-hud ${busy ? 'is-travelling' : ''}`}>
      <CityStatsOverlay projects={visible} />
      <section className="world-identity" aria-live="polite"><p className="label-mono">REBOOT / {category ? 'CONNECTED DISTRICT' : `${CITY_CATEGORIES.length} DESTINATIONS`}</p>
        <h1 style={{color:accent}}>{name}</h1><p>{category ? DISTRICT_MAP[category].description : 'Every idea has a world. Choose a portal to explore.'}</p>
      </section>
      {category && <button className="world-return btn" onClick={() => useUI.getState().exitCity()} disabled={busy}>← Return to World Hub</button>}
      <div className="world-quality"><label><input type="checkbox" checked={lowEffects} onChange={e => setLowEffects(e.target.checked)} /> Reduced effects</label></div>
      <nav className="city-destinations" aria-label="City destinations">{CITY_CATEGORIES.map(c => <button key={c} disabled={busy} aria-pressed={category === c} style={{'--city-color':CITIES[c].palette.accent} as React.CSSProperties} onClick={() => useUI.getState().enterCity(c)}>{CITY_LABELS[c]}</button>)}</nav>
      <section className="world-projects"><h2 className="label-mono">{visible.length} projects / {name}</h2><div>
        {visible.map(p => <button key={p.id} disabled={busy} aria-pressed={selectedId === p.id} onClick={() => selectProject(p.id)}><span style={{color:DISTRICT_MAP[p.category].theme.color}}>◆</span> {p.name}</button>)}
        {!visible.length && <p>No projects match this district and filter.</p>}
      </div></section>
      {!category && mode === 'city' && <AIGuide />}
      {selected && !busy && <><ProjectDetail project={selected} canCustomize={canCustomize} onClose={() => selectProject(null)} />{canCustomize && <CustomizationPanel projectId={selected.id} projectName={selected.name} />}</>}
    </div>
    {busy && <div className="travel-status" role="status"><span>{phase === 'loading' ? 'Preparing' : phase === 'arriving' ? 'Arriving in' : 'Travelling to'} {destination ? CITY_LABELS[destination] : 'World Hub'}</span><button onClick={() => useUI.getState().cancelTravel()}>Cancel · Esc</button></div>}
    {error && <div className="world-error" role="alert">{error}<button onClick={() => window.location.reload()}>Reload</button><button onClick={() => useUI.getState().cancelTravel()}>Dismiss</button></div>}
  </div>
}
