import { Weather,WeatherControl } from './environment/Weather'
import { ZeroScene } from '../zero/ZeroScene'
import { isZeroProject,recordedViews,sceneBuildings } from '@/lib/projectDiscovery'
import { LandmarkConsole } from './environment/LandmarkConsole'
import { useDistrictSignals } from './environment/districtSignals'
import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CityLife } from './CityLife'
import { EnvironmentSettings } from './environment/ScenePrimitives'
import { CITY_STORIES, CITY_LIGHTING } from './environment/cityDesign'
import { ViewpointCamera } from './environment/ViewpointCamera'
import { WorldControls } from './WorldControls'
import { useUI } from '@/stores/ui'
import { useAuth, useProjects } from '@/stores/auth'
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
  const [guideOpen,setGuideOpen]=useState(()=>window.innerWidth>=768)
  const [readyKey, setReadyKey] = useState('')
  const [viewpoint, setViewpoint] = useState({view:'Entrance',request:0})
  useEffect(()=>setViewpoint({view:'Entrance',request:0}),[category])
  const [webgl, setWebgl] = useState(supportsWebGL)
  const veil = useRef<HTMLDivElement>(null)
  const user = useAuth(s => s.user)
  const landmarkOpen = useDistrictSignals(s => !!s.landmark || !!s.resident)
  useEffect(() => {
    useDistrictSignals.getState().close()
    return () => useDistrictSignals.getState().close()
  }, [category])
  useEffect(() => {if(selectedId) useDistrictSignals.getState().signal()}, [selectedId])
  const canCustomize = true
  const key = category ?? mode
  const visible = useMemo(() => {
    let list = projects.filter(p=>mode==='zero'?isZeroProject(p):!isZeroProject(p)).filter(p => (!category || p.category === category || (category==='Graveyard'&&p.status==='abandoned')) && (!status || p.status === status))
    if (!category && !busy && filter) list = list.filter(p => p.category === filter)
    return [...list].sort((a,b) => sort === 'alphabetical' ? a.name.localeCompare(b.name) : sort === 'trending' ? b.followers-a.followers : sort === 'revived' ? Number(b.status==='reviving')-Number(a.status==='reviving') : sort === 'abandoned' ? Number(b.status==='abandoned')-Number(a.status==='abandoned') : +new Date(b.createdAt)-+new Date(a.createdAt))
  }, [projects, category, status, sort, filter, busy,mode])
  const rendered=useMemo(()=>sceneBuildings(visible,selectedId),[visible,selectedId])
  const planet = useMemo(() => planPlanet(rendered), [rendered])
  const customizing = useUI(s=>s.customizingProjectId)
  const selected = projects.find(p => p.id === selectedId)
  const Scene = mode==='zero'?ZeroScene:category ? CITY_SCENES[category] : null
  const env = category ? CITY_ENV[category]! : {bg:'#03050a', fogNear:260, fogFar:700}
  const lighting=category&&isCityId(category)?CITY_LIGHTING[category]:{sky:'#9bc4ff',sun:'#cfe2ff',intensity:1.6}
  const name = mode==='zero'?'Zero Hub':category ? CITY_LABELS[category] : mode === 'worlds' ? 'Worlds' : 'Reboot'
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
      else if (state.cityCategory==='Graveyard')state.setMode('graveyard')
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
        <ambientLight intensity={category ? .85 : .9} />
        <hemisphereLight args={[lighting.sky,'#343448', 1.05]} />
        <directionalLight position={[-45,35,-35]} intensity={category ? .65 : .2} color={lighting.sky} />
        <directionalLight position={[60,80,140]} intensity={lighting.intensity} color={lighting.sun} />
        <EnvironmentSettings.Provider value={{reduced,lowEffects}}><Suspense fallback={null}>
          {Scene ? <Scene key={category} projects={rendered} selectedId={selectedId} onSelect={p => {if (!busy) selectProject(p.id)}} /> : mode === 'worlds' ? <WorldsScene projects={planet} /> : <WorldHub projects={planet} />}
          {(category||mode==='zero')&&<Weather />}<>{mode==='zero'&&<CityLife city="Community" reduced={reduced} lowEffects={lowEffects}/>} {category && isCityId(category) && <CityLife key={category} city={category} reduced={reduced} lowEffects={lowEffects} />}</>
          <Ready key={`ready-${key}`} onReady={onReady} />
        </Suspense></EnvironmentSettings.Provider>
        <PortalTransition color={accent} reduced={reduced} lowEffects={lowEffects} ready={readyKey === key} veil={veil} />
        {!busy && <WorldControls key={key} city={!!category||mode==='zero'} reduced={reduced} />}
        {!busy && mode==='zero' && <ViewpointCamera city="Community" view="Entrance" request={0} reduced={reduced}/>}
        {!busy && category && isCityId(category) && <ViewpointCamera city={category} view={viewpoint.view} request={viewpoint.request} reduced={reduced} />}
        <ContextHealth onLost={onLost} />
      </Canvas>
    </SceneBoundary> : fallback}
    <div ref={veil} className="portal-veil" style={{opacity:0, background:`radial-gradient(ellipse, #e8ffff 0%, ${accent} 65%, #102337 100%)`}} />
    <div className={`world-hud ${busy ? 'is-travelling' : ''}`}>
      <CityStatsOverlay projects={visible} />
      <section className="world-identity" aria-live="polite"><p className="label-mono">REBOOT / {category ? 'CONNECTED DISTRICT' : `${CITY_CATEGORIES.length-1} DISTRICTS`}</p>
        <h1 style={{color:accent}}>{name}</h1><p>{category && isCityId(category) ? CITY_STORIES[category].purpose : mode==='zero'?'A quiet home for ideas below 100 unique beta-member views. At 100, they join their category district.':'Explore a district, or visit Zero Hub for ideas finding their first audience.'}</p>
      </section>
      {category && <button className="world-return btn" onClick={() => category==='Graveyard'?useUI.getState().setMode('graveyard'):useUI.getState().exitCity()} disabled={busy}>← {category==='Graveyard'?'Return to planet':'Return to World Hub'}</button>}
      {category && isCityId(category) && <section className="city-field-guide">
        <p className="label-mono">{CITIES[category].landmark}</p>
        <button className="field-guide-toggle" aria-expanded={guideOpen} onClick={()=>setGuideOpen(!guideOpen)}>{guideOpen?'Close city controls':'Explore this city'}</button>
        {guideOpen&&<><nav aria-label="City viewpoints">{['Entrance','Path','Landmark','Skyline','Activity'].map(view=><button key={view} disabled={busy} aria-pressed={viewpoint.view===view} onClick={()=>setViewpoint(v=>({view,request:v.request+1}))}>{view}</button>)}</nav>
        <button className="landmark-open" onClick={()=>useDistrictSignals.getState().open(category)}>Activate landmark ↗</button>
        <details><summary>Explore this place</summary><p>{CITY_STORIES[category].atmosphere}</p><ul>{CITY_STORIES[category].sites.map(site=><li key={site}>{site}</li>)}</ul><p>{CITY_STORIES[category].roles.join(' · ')}</p></details></>}
      </section>}
      {(category||mode==='zero')&&<WeatherControl />}<div className="world-quality"><label><input type="checkbox" checked={lowEffects} onChange={e => setLowEffects(e.target.checked)} /> Reduced effects</label></div>
      <nav className="city-destinations" aria-label="City destinations">{CITY_CATEGORIES.filter(c=>c!=='Graveyard').map(c => <button key={c} disabled={busy} aria-pressed={category === c} style={{'--city-color':CITIES[c].palette.accent} as React.CSSProperties} onClick={() => useUI.getState().enterCity(c)}>{CITY_LABELS[c]}</button>)}</nav>
      <section className="world-projects" data-empty={visible.length===0}><p className="muted">Up to 120 buildings shown. {useProjects.getState().hasMore&&<button onClick={()=>useProjects.getState().fetchProjects(true)}>Load more records</button>}</p><h2 className="label-mono">{visible.length} projects / {name}</h2><div>
        {visible.map(p => <button key={p.id} disabled={busy} aria-pressed={selectedId === p.id} onClick={() => selectProject(p.id)}><span style={{color:DISTRICT_MAP[p.category].theme.color}}>◆</span> {p.name}{mode==='zero'&&` · ${recordedViews(p)}/100`}</button>)}
        {!visible.length && <p>No projects match this district and filter.</p>}
      </div></section>

      {!busy && <LandmarkConsole />}
      {selected && !busy && !landmarkOpen && <>{customizing !== selected.id && <ProjectDetail project={selected} canCustomize={!!(selected.temporary || (user && selected.ownerId === user.uid))} onClose={() => selectProject(null)} />}{canCustomize && <CustomizationPanel projectId={selected.id} projectName={selected.name} />}</>}
    </div>
    {busy && <div className="travel-status" role="status"><span>{phase === 'loading' ? 'Preparing' : phase === 'arriving' ? 'Arriving in' : 'Travelling to'} {destination ? CITY_LABELS[destination] : 'World Hub'}</span><button onClick={() => useUI.getState().cancelTravel()}>Cancel · Esc</button></div>}
    {error && <div className="world-error" role="alert">{error}<button onClick={() => window.location.reload()}>Reload</button><button onClick={() => useUI.getState().cancelTravel()}>Dismiss</button></div>}
  </div>
}
