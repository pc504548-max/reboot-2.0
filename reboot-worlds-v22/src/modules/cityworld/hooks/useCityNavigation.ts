import { useEffect, useState } from 'react'
import { useUI } from '@/stores/ui'
import { loadCity } from '../cityScenes'

export function useCityNavigation() {
  const phase = useUI(s => s.travelPhase)
  const destination = useUI(s => s.destination)
  const id = useUI(s => s.travelId)
  useEffect(() => {
    if (phase !== 'loading') return
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) useUI.getState().cancelTravel('The destination took too long to load. Please try again.')
    }, 15000)
    loadCity(destination).then(() => {
      if (!cancelled) useUI.getState().advanceTravel(id, 'departing')
    }).catch(() => {
      if (!cancelled) useUI.getState().cancelTravel('Could not load this city. Reload to retry, or choose another destination.')
    })
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [phase, destination, id])
  useEffect(() => {
    if (phase === 'idle' || phase === 'loading') return
    const timer = window.setTimeout(() => useUI.getState().cancelTravel('Journey interrupted. You can try again.'), 12000)
    return () => clearTimeout(timer)
  }, [phase, id])
  return { phase, destination, id, busy: phase !== 'idle' }
}

export function useMotionSettings() {
  const [hidden,setHidden]=useState(()=>document.hidden)
  useEffect(()=>{const changed=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed)},[])
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [lowEffects, updateLowEffects] = useState(() => {
    try { const stored=localStorage.getItem('reboot-reduced-effects'); if(stored!==null)return stored==='true' } catch {}
    return matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4
  })
  const setLowEffects=(value:boolean)=>{
    updateLowEffects(value)
    try {localStorage.setItem('reboot-reduced-effects',String(value))} catch {}
    window.dispatchEvent(new CustomEvent('reboot-effects',{detail:value}))
  }
  useEffect(()=>{
    const changed=(event:Event)=>updateLowEffects((event as CustomEvent<boolean>).detail)
    window.addEventListener('reboot-effects',changed)
    return ()=>window.removeEventListener('reboot-effects',changed)
  },[])
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => setReduced(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])
  return { reduced: reduced || hidden, lowEffects, setLowEffects }
}
