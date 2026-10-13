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
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [lowEffects, setLowEffects] = useState(() => matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => setReduced(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])
  return { reduced, lowEffects, setLowEffects }
}
