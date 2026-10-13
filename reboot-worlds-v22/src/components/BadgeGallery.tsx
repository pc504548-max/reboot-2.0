import { Award, LockKeyhole } from 'lucide-react'
import { useProjects } from '@/stores/auth'
import { AWARD_DEFINITIONS, computeAwards } from '@/types/project'
import { WorldDialog } from './WorldDialog'

export function BadgeGallery({ onClose }: { onClose: () => void }) {
  const projects = useProjects(s => s.projects)
  const earned = new Map<string, string[]>()
  for (const project of projects) for (const award of computeAwards(project)) earned.set(award.type, [...(earned.get(award.type) ?? []), project.name])
  return <WorldDialog title="City badge collection" onClose={onClose}>
    <p className="dialog-intro">Milestones earned by projects across Reboot. Create a project to give it a Founder badge, then keep building.</p>
    <p className="label-mono">{earned.size} / {AWARD_DEFINITIONS.length} BADGES DISCOVERED</p>
    <div className="badge-gallery">{AWARD_DEFINITIONS.map(award=>{
      const names = earned.get(award.type) ?? []
      return <article key={award.type} className={`badge-card ${names.length ? 'earned' : ''}`}><div className="badge-medallion">{names.length ? <Award size={28} /> : <LockKeyhole size={24} />}</div><h3>{award.label}</h3><p>{award.description}</p><span>{names.length ? `${names.length} project${names.length === 1 ? '' : 's'} earned this` : 'Not earned yet'}</span>{names.length > 0 && <p className="badge-projects" title={names.join(', ')}>{names.slice(0,3).join(' · ')}{names.length > 3 ? ' …' : ''}</p>}</article>
    })}</div>
  </WorldDialog>
}
