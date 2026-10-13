import { DISTRICT_MAP, type Project, type NewProject } from '@/types/project'
export const GUEST_KEY = 'reboot-guest-projects-v1'
export const GUEST_LIFETIME = 24 * 60 * 60 * 1000
export const GUEST_LIMIT = 20
function guestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // getRandomValues is also available on HTTP LAN previews.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
export function makeGuestProject(input: NewProject, now = Date.now()): Project {
  return {...input,id:guestId(),temporary:true,expiresAt:now+GUEST_LIFETIME,createdAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString()}
}
export function readGuestProjects(raw: string | null, now = Date.now()): Project[] {
  try {
    const data: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(data)) return []
    return data.filter((p): p is Project => !!p && typeof p === 'object' && p.temporary === true && typeof p.id === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(p.id) && Number.isFinite(p.expiresAt) && p.expiresAt > now && p.expiresAt <= now+GUEST_LIFETIME && typeof p.name === 'string' && typeof p.tagline === 'string' && typeof p.description === 'string' && typeof p.founder === 'string' && Object.prototype.hasOwnProperty.call(DISTRICT_MAP,p.category) && ['alive','decaying','abandoned','reviving'].includes(p.status) && Number.isInteger(p.stage) && p.stage>=1 && p.stage<=5 && Number.isFinite(p.momentum) && Number.isFinite(p.followers) && Number.isFinite(Date.parse(p.createdAt)) && Number.isFinite(Date.parse(p.updatedAt)) && Array.isArray(p.tags) && p.tags.every((x:unknown)=>typeof x==='string') && Array.isArray(p.connections) && p.connections.every((x:unknown)=>typeof x==='string')).slice(0,GUEST_LIMIT)
  } catch { return [] }
}
export function loadGuestProjects() {
  try { return readGuestProjects(sessionStorage.getItem(GUEST_KEY)) } catch { return [] }
}
export function storeGuestProjects(projects: Project[]) {
  try { sessionStorage.setItem(GUEST_KEY,JSON.stringify(projects.filter(p=>p.temporary))) } catch { /* In-memory drafts remain usable when storage is blocked. */ }
}
