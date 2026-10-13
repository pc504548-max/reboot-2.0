import { useRef, useState, type FormEvent } from 'react'
import { Building2, Award } from 'lucide-react'
import { WorldDialog } from '../WorldDialog'
import { useAuth, useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { CITIES, CITY_CATEGORIES, isCityId, type CityId } from '@/modules/cityworld/cityRegistry'

export function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const user = useAuth(s => s.user)
  const [temporary,setTemporary]=useState(false)
  const localOnly=!user||temporary
  const current = useUI.getState().cityCategory
  const [category, setCategory] = useState<CityId>(current && isCityId(current) ? current : 'AI')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') ?? '').trim()
    const tagline = String(fields.get('tagline') ?? '').trim()
    if (!name || !tagline) { setError('Give your project a name and a short description.'); return }
    pending.current = true; setSaving(true); setError('')
    try {
      const create = !localOnly ? useProjects.getState().createProject : useProjects.getState().createGuestProject
      const project = await create({
        name, tagline, description: String(fields.get('description') ?? '').trim(), category,
        status: category === 'Graveyard' ? 'abandoned' : category === 'IdeaHub' ? 'reviving' : 'alive',
        stage: 1, momentum: 0, founder: user?.displayName?.trim() || (user ? 'Reboot Builder' : 'Anonymous explorer'),
        foundedYear: new Date().getFullYear(), failureYear: null, failureReason: String(fields.get('failureReason')??'').trim()||null,
        lessonsLearned: String(fields.get('lessons')??'').trim()||null, revivalRequirements: String(fields.get('requirements')??'').trim()||null,
        tags: [], connections: [], followers: 0,
      })
      if (!project) { setError(useProjects.getState().error || 'Your project could not be saved. Please try again.'); return }
      const ui = useUI.getState()
      ui.cancelTravel(); ui.setStatusFilter(null); ui.setSearchQuery(''); ui.setSortFilter('newest')
      ui.setMode('zero'); ui.selectProject(project.id)
      onClose()
    } catch { setError('Could not reach the project service. Your form is still here; please try again.') }
    finally { pending.current = false; setSaving(false) }
  }
  return <WorldDialog title="Give your idea a home" onClose={onClose} busy={saving}>
    <p className="dialog-intro">Your building begins in Zero Hub. At 100 unique beta-member views, it joins its chosen city.</p>
    {localOnly && <p className="guest-notice">Temporary mode · Only visible in this tab. Temporary buildings expire after 24 hours or when this tab closes. After beta approval, save them to your account to keep them.</p>}
    <form onSubmit={submit}>
      <fieldset disabled={saving} className="creation-fields">
        <>{user&&<label className="temporary-choice"><input type="checkbox" checked={temporary} onChange={e=>setTemporary(e.target.checked)}/> Temporary building · no beta approval needed</label>}</>
        <label>Project name<input name="name" required maxLength={80} autoFocus placeholder="What are you building?" /></label>
        <label>One-line pitch<input name="tagline" required maxLength={160} placeholder="A small idea with a big future" /></label>
        <label>Choose a city<select value={category} onChange={e => setCategory(e.target.value as CityId)}>{CITY_CATEGORIES.map(id=><option key={id} value={id}>{CITIES[id].name}</option>)}</select></label>
        <label>The story <span>(optional)</span><textarea name="description" maxLength={2000} rows={3} placeholder="Tell the world what you want to make." /></label>
        <details><summary>Document the past and the next step</summary>
          <label>Why did it stop? <span>(optional)</span><textarea name="failureReason" maxLength={2000} rows={2} placeholder="Only what is known or documented." /></label>
          <label>Lessons learned <span>(optional)</span><textarea name="lessons" maxLength={2000} rows={2}/></label>
          <label>Revival requirements <span>(optional)</span><textarea name="requirements" maxLength={2000} rows={2}/></label>
        </details>
      </fieldset>
      <div className="building-preview" style={{'--city-color':CITIES[category].palette.accent} as React.CSSProperties}><Building2 size={36} /><div><strong>Zero Hub → {CITIES[category].name}</strong><p>{!localOnly ? <>Stage 1 building · <Award size={13} /> Founder badge</> : 'Stage 1 temporary building'}</p></div></div>
      {error && <p role="alert" className="creation-error">{error}</p>}
      <button className="btn-primary creation-submit" type="submit" disabled={saving}>{saving ? 'Creating your building…' : !localOnly ? 'Create project & building' : 'Build a temporary idea'}</button>
      <p className="creation-note">{!localOnly ? 'Your building appears after your project is saved.' : 'Keep this tab open until you save your idea to an account.'}</p>
    </form>
  </WorldDialog>
}
