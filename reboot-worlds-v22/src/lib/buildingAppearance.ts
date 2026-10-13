export interface BuildingAppearance {
  color:string; height:number; glowIntensity:number
  style:'standard'|'spire'|'pyramid'|'dome'|'crystal'
}
/** Public records and session storage are data boundaries, not trusted render props. */
export function normalizeAppearance(value:unknown):Partial<BuildingAppearance> {
  if(!value||typeof value!=='object'||Array.isArray(value))return {}
  const v=value as Record<string,unknown>,result:Partial<BuildingAppearance>={}
  if(typeof v.color==='string'&&/^#[0-9a-f]{6}$/i.test(v.color))result.color=v.color
  if(typeof v.height==='number'&&Number.isFinite(v.height))result.height=Math.max(.5,Math.min(2,v.height))
  if(typeof v.glowIntensity==='number'&&Number.isFinite(v.glowIntensity))result.glowIntensity=Math.max(.5,Math.min(4,v.glowIntensity))
  if(typeof v.style==='string'&&['standard','spire','pyramid','dome','crystal'].includes(v.style))result.style=v.style as BuildingAppearance['style']
  return result
}
