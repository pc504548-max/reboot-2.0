import { normalizeAppearance } from '@/lib/buildingAppearance'
import { useState } from 'react'
import { useProjects } from '@/stores/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sliders, Palette, Building, Sparkles } from 'lucide-react'
import { useUI, type BuildingCustomization } from '@/stores/ui'
import { CATEGORY_THEME } from '@/types/project'
import { CITIES, isCityId } from '@/modules/cityworld/cityRegistry'

const COLORS = [
  '#3DD8FF', '#3BFF91', '#FFB547', '#5CFFAA', '#FF5959',
  '#FF5C8A', '#F8F8F8', '#5C8AFF', '#FF8A5C', '#3BAAFF',
]

const STYLES: { id: BuildingCustomization['style']; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'spire', label: 'Spire' },
  { id: 'pyramid', label: 'Pyramid' },
  { id: 'dome', label: 'Dome' },
  { id: 'crystal', label: 'Crystal' },
]

export function CustomizationPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const customizingProjectId = useUI((s) => s.customizingProjectId)
  const stopCustomizing = useUI((s) => s.stopCustomizing)
  const customizations = useUI((s) => s.customizations)
  const updateCustomization = useUI((s) => s.updateCustomization)

  const isOpen = customizingProjectId === projectId
  const project = useProjects(s=>s.projects.find(p=>p.id===projectId))
  const cityCategory = useUI(s => s.cityCategory)
  const defaultColor = project
    ? cityCategory === project.category && isCityId(project.category)
      ? CITIES[project.category].palette.accent
      : CATEGORY_THEME[project.category].emissive
    : '#3DD8FF'
  const custom = normalizeAppearance({...project?.buildingCustomization,...customizations[projectId]})
  const [saving,setSaving]=useState(false),[message,setMessage]=useState('')
  async function save() {
    setSaving(true)
    try {
      const ok=await useProjects.getState().updateProject(projectId,{buildingCustomization:{color:custom.color??defaultColor,height:custom.height??1,style:custom.style??'standard',glowIntensity:custom.glowIntensity??1.4}})
      setMessage(ok?(project?.temporary?'Appearance saved in this tab.':'Appearance saved to your project.'):(useProjects.getState().error??'Could not save.'))
    }finally{setSaving(false)}
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="customization-panel absolute bottom-lg left-1/2 -translate-x-1/2 w-[400px] max-w-[calc(100vw-2rem)] z-40"
      >
        <div className="glass-strong p-lg rounded-lg">
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Sliders size={14} className="text-primary" />
              <span className="text-sm font-medium text-text">Customize: {projectName}</span>
            </div>
            <button
              aria-label="Close customization" onClick={stopCustomizing}
              className="text-text-secondary hover:text-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Color picker */}
          <div className="mb-md">
            <div className="flex items-center gap-1.5 mb-2">
              <Palette size={11} className="text-text-secondary" />
              <span className="text-[10px] uppercase tracking-wider text-text-secondary">Neon Color</span>
            </div>
            <div className="flex flex-wrap gap-sm">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Building color ${c}`}
                  onClick={() => updateCustomization(projectId, { color: c })}
                  className="w-7 h-7 rounded-md transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: c,
                    boxShadow: (custom.color ?? defaultColor) === c ? `0 0 12px ${c}` : 'none',
                    border: (custom.color ?? defaultColor) === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Building style */}
          <div className="mb-md">
            <div className="flex items-center gap-1.5 mb-2">
              <Building size={11} className="text-text-secondary" />
              <span className="text-[10px] uppercase tracking-wider text-text-secondary">Rooftop Style</span>
            </div>
            <div className="flex flex-wrap gap-sm">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateCustomization(projectId, { style: s.id })}
                  className={`px-sm py-1 rounded-md text-[10px] font-mono transition-all duration-200 ${
                    (custom?.style ?? 'standard') === s.id
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-border/40 bg-card/60 text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Height slider */}
          <div className="mb-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary">Height</span>
              <span className="text-xs font-mono text-text">
                {((custom?.height ?? 1) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              aria-label="Building height"
              min={0.5}
              max={2}
              step={0.1}
              value={custom?.height ?? 1}
              onChange={(e) => updateCustomization(projectId, { height: parseFloat(e.target.value) })}
              className="w-full accent-[#3DD8FF]"
            />
          </div>

          {/* Glow intensity slider */}
          <div className="mb-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-text-secondary" />
                <span className="text-[10px] uppercase tracking-wider text-text-secondary">Glow Intensity</span>
              </div>
              <span className="text-xs font-mono text-text">
                {(custom?.glowIntensity ?? 1.4).toFixed(1)}
              </span>
            </div>
            <input
              type="range" aria-label="Glow intensity"
              min={0.5}
              max={4}
              step={0.1}
              value={custom?.glowIntensity ?? 1.4}
              onChange={(e) => updateCustomization(projectId, { glowIntensity: parseFloat(e.target.value) })}
              className="w-full accent-[#3DD8FF]"
            />
          </div>

          <div className="pt-md border-t border-border/40"><button className="btn-primary" disabled={saving} onClick={save}>{saving?'Saving…':'Save appearance'}</button>{message&&<p role="status">{message}</p>}
            <p className="text-[10px] text-text-secondary/60 text-center">
              Preview updates live. Save to keep this appearance.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
