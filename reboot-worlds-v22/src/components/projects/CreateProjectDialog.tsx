import { useRef, useState, type FormEvent } from 'react'
import { Building2, Award } from 'lucide-react'
import { WorldDialog } from '../WorldDialog'
import { useAuth, useProjects } from '@/stores/auth'
import { useUI } from '@/stores/ui'
import { CITIES, CITY_CATEGORIES, isCityId, type CityId } from '@/modules/cityworld/cityRegistry'

export function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const user = useAuth(s => s.user)
  const current = useUI.getState().cityCategory
  const [category, setCategory] = useState<CityId>(current && isCityId(current) ? current : 'AI')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || !user) return
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') ?? '').trim()
    const tagline = String(fields.get('tagline') ?? '').trim()
    if (!name || !tagline) { setError('Give your project a name and a short description.'); return }
    pending.current = true; setSaving(true); setError('')
    try {
      const project = await useProjects.getState().createProject({
        name, tagline, description: String(fields.get('description') ?? '').trim(), category,
        status: category === 'Graveyard' ? 'abandoned' : category === 'IdeaHub' ? 'reviving' : 'alive',
        stage: 1, momentum: 0, founder: user.displayName?.trim() || 'Reboot Builder',
        foundedYear: new Date().getFullYear(), failureYear: null, failureReason: null,
        tags: [], connections: [], followers: 0,
      })
      if (!project) { setError(useProjects.getState().error || 'Your project could not be saved. Please try again.'); return }
      const ui = useUI.getState()
      ui.cancelTravel(); ui.setStatusFilter(null); ui.setSearchQuery(''); ui.setSortFilter('newest')
      ui.enterCity(project.category); ui.selectProject(project.id)
      onClose()
    } catch { setError('Could not reach the project service. Your form is still here; please try again.') }
    finally { pending.current = false; setSaving(false) }
  }
  return <WorldDialog title="Give your idea a home" onClose={onClose} busy={saving}>
    <p className="dialog-intro">Create a project and a building appears in its city. As your project grows, its tower grows with it.</p>
    {!user ? <div className="creation-signin"><Building2 size={40} /><h3>Your next building starts here.</h3><p>Sign in to save your project and earn your Founder badge.</p><button className="btn-primary" onClick={() => { onClose(); useUI.getState().setMode('auth') }}>Sign in to create</button></div> :
    <form onSubmit={submit}>
      <fieldset disabled={saving} className="creation-fields">
        <label>Project name<input name="name" required maxLength={80} autoFocus placeholder="What are you building?" /></label>
        <label>One-line pitch<input name="tagline" required maxLength={160} placeholder="A small idea with a big future" /></label>
        <label>Choose a city<select value={category} onChange={e => setCategory(e.target.value as CityId)}>{CITY_CATEGORIES.map(id=><option key={id} value={id}>{CITIES[id].name}</option>)}</select></label>
        <label>The story <span>(optional)</span><textarea name="description" maxLength={2000} rows={3} placeholder="Tell the world what you want to make." /></label>
      </fieldset>
      <div className="building-preview" style={{'--city-color':CITIES[category].palette.accent} as React.CSSProperties}><Building2 size={36} /><div><strong>A new address in {CITIES[category].name}</strong><p>Stage 1 building · <Award size={13} /> Founder badge</p></div></div>
      {error && <p role="alert" className="creation-error">{error}</p>}
      <button className="btn-primary creation-submit" type="submit" disabled={saving}>{saving ? 'Creating your building…' : 'Create project & building'}</button>
      <p className="creation-note">Your building appears after your project is saved.</p>
    </form>}
  </WorldDialog>
}
