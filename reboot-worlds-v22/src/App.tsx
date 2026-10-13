import { useEffect, lazy, Suspense } from 'react'
import { useUI } from '@/stores/ui'
import { useProjects } from '@/stores/auth'
import { BetaPanel } from '@/components/beta/BetaPanel'
import { betaCall } from '@/lib/beta'
import { useAuth } from '@/stores/auth'
import { GuideBuddy } from '@/components/GuideBuddy'
import { BootIntro } from '@/components/BootIntro'
import { LandingPage } from '@/components/landing/LandingPage'
import { LandingSkyline } from '@/components/landing/LandingSkyline'
import { AuthPage } from '@/components/auth/AuthPage'
import { AppShell } from '@/components/shell/AppShell'

const EchoModule = lazy(() => import('@/modules/echo/EchoModule').then((m) => ({ default: m.EchoModule })))
const GraveyardModule = lazy(() => import('@/modules/graveyard/GraveyardPlanet').then((m) => ({ default: m.GraveyardPlanet })))
const NetworkModule = lazy(() => import('@/modules/network/NetworkModule').then((m) => ({ default: m.NetworkModule })))
const CityWorldModule = lazy(() => import('@/modules/cityworld/CityWorldModule').then((m) => ({ default: m.CityWorldModule })))

function ModuleLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="font-mono text-xs text-text-secondary animate-pulse-soft">Loading module...</div>
    </div>
  )
}

export default function App() {
  const mode = useUI((s) => s.mode)
  const selected = useUI(s=>s.selectedProjectId)
  const user = useAuth(s=>s.user)
  useEffect(()=>{
    const p=useProjects.getState().projects.find(p=>p.id===selected)
    if(!p||p.temporary||!user)return
    let live=true
    betaCall<number>('record_project_view',{target_id:p.id}).then(viewCount=>{if(live)useProjects.setState(s=>({projects:s.projects.map(x=>x.id===p.id?{...x,viewCount}:x)}))}).catch(()=>{/* No invented views when services are unavailable. */})
    return()=>{live=false}
  },[selected,user?.uid])
  const fetchProjects = useProjects((s) => s.fetchProjects)

  useEffect(() => {
    fetchProjects()
    const timer = window.setInterval(() => useProjects.getState().expireGuests(), 30000)
    return () => window.clearInterval(timer)
  }, [fetchProjects])

  if (mode === 'boot') {
    return <BootIntro />
  }

  if (mode === 'landing') {
    return (
      <div className="relative w-full h-full">
        <LandingSkyline />
        <LandingPage />
      </div>
    )
  }

  if (mode === 'auth') {
    return (
      <div className="relative w-full h-full">
        <AuthPage />
      </div>
    )
  }

  return (
    <AppShell>
      <Suspense fallback={<ModuleLoader />}>
        {(mode === 'city' || mode === 'cityworld' || mode === 'worlds' || mode === 'zero') && <CityWorldModule />}
        {mode === 'beta' && <BetaPanel />}
        {mode === 'echo' && <EchoModule />}
        {mode === 'graveyard' && <GraveyardModule />}
        {mode === 'network' && <NetworkModule />}
      </Suspense>
      <GuideBuddy />
    </AppShell>
  )
}
