import type { CityId } from '../cityRegistry'
import type { Vec } from './ScenePrimitives'

export const CITY_STORIES: Record<CityId, {purpose: string; sites: [string,string,string,string]; roles: [string,string,string]; atmosphere: string}> = {
  Graveyard: {purpose:'What remains when an idea goes quiet.',sites:['Frozen construction','Prototype fragments','Silent launchpad','Sealed archive'],roles:['Archive keeper','Scavenger','Memory echo'],atmosphere:'Lanterns still search the ruins. These keepers are fictional custodians of memory.'},
  IdeaHub: {purpose:'A second chance, built piece by piece.',sites:['Broken foundations','Repair gantry','Assembly workshop','Restored bridge'],roles:['Restoration engineer','Cargo drone','Construction robot'],atmosphere:'Old frames meet new structure. The repair cycle is an environmental illustration.'},
  Legend: {purpose:'Ideas that endured. A place to remember the work.',sites:['Legacy gallery','Sky garden','Presentation hall','Milestone terrace'],roles:['Visitor','Presenter','Garden steward'],atmosphere:'The monuments await documented achievements; architecture does not imply platform results.'},
  AI: {purpose:'A civilization thinking together.',sites:['Server sanctuary','Neural exchange','Research terminal','Data reservoir'],roles:['Synthetic researcher','Data drone','Maintenance bot'],atmosphere:'Capsules travel from the Intelligence Core to the computational districts.'},
  Gaming: {purpose:'Worlds within worlds, waiting to be played.',sites:['Strategy board','Arcade stacks','Fantasy arena','Racing gate'],roles:['Arena competitor','Companion bot','Level designer'],atmosphere:'Arena sequences are scripted scenery, with no invented scores or rankings.'},
  Education: {purpose:'Knowledge grows where ideas connect.',sites:['Suspended library','Lecture dome','Observatory','Discovery exhibit'],roles:['Researcher','Teacher','Library assistant'],atmosphere:'A luminous tree connects quiet study terraces and moving scientific exhibits.'},
  Health: {purpose:'An ecosystem of care and renewal.',sites:['Botanical conservatory','Water garden','Research dome','Supply pavilion'],roles:['Garden researcher','Supply drone','Botanical caretaker'],atmosphere:'A fictional restorative ecosystem; its animations do not represent medical treatment.'},
  Creator: {purpose:'Unfinished imagination takes physical form.',sites:['Suspended cinema','Sound sculpture','Prototype studio','Canvas gallery'],roles:['Sculptor','Musician','Assembly sprite'],atmosphere:'Fragments rearrange around a shared work in progress.'},
  Space: {purpose:'Look beyond the edge of what is known.',sites:['Docking station','Orbital habitat','Asteroid bridge','Star chart'],roles:['Explorer','Survey drone','Dock mechanic'],atmosphere:'The orbital chart is an imagined sky, not a live astronomical feed.'},
  Robotics: {purpose:'Machines making room for the next invention.',sites:['Assembly hall','Parts conveyor','Mechanical garden','Testing gantry'],roles:['Inventor','Inspection drone','Wheeled mechanic'],atmosphere:'Articulated arms inspect and assemble components in coordinated cycles.'},
  Community: {purpose:'Different ideas. One common ground.',sites:['Public forum','Shared workshop','Neighborhood garden','Exhibit hall'],roles:['Creator','Guide bot','Collaborator'],atmosphere:'Ambient characters are fictional inhabitants, not real users or live activity.'},
}
/** Deliberately placed work sites, leaving the entry axis open. */
export const WORK_SITES: Vec[] = [[-30,0,8],[29,0,4],[-22,0,-34],[25,0,-32]]
export function viewFor(city: CityId, view: string): {position: Vec; target: Vec} {
  const height=city==='Community'?5:city==='Health'?8:city==='Legend'?18:city==='Robotics'?11:14
  if (view === 'Path') return {position:[9,9,44],target:[0,height,0]}
  if (view === 'Landmark') return {position:city==='Legend'?[30,24,36]:[23,height+5,27],target:[0,height,0]}
  if (view === 'Activity') return {position:[-20,5,21],target:[-29,2,8]}
  if (view === 'Skyline') return {position:[70,49,77],target:[0,13,-6]}
  return {position:[38,24,58],target:[0,10,0]}
}

export const CITY_LIGHTING: Record<CityId,{sky:string;sun:string;intensity:number}> = {
 AI:{sky:'#7eaed9',sun:'#c1ebff',intensity:1.6}, Gaming:{sky:'#9b82bb',sun:'#ffe2b9',intensity:1.5},
 Education:{sky:'#a7c6dc',sun:'#fff0d5',intensity:1.5},Health:{sky:'#a0d9c5',sun:'#d3f9e5',intensity:1.5},
 Creator:{sky:'#ae99cb',sun:'#e9c3e3',intensity:1.6},IdeaHub:{sky:'#92b7b5',sun:'#ffe1aa',intensity:1.6},
 Graveyard:{sky:'#9b9ebc',sun:'#b2a5bd',intensity:1.3},Legend:{sky:'#c9c1a9',sun:'#fff0cc',intensity:1.8},
 Space:{sky:'#899ec4',sun:'#b5cafa',intensity:1.7},Robotics:{sky:'#91acb9',sun:'#ffd0a1',intensity:1.6},
 Community:{sky:'#b1c9bc',sun:'#ffe3bd',intensity:1.5},
}
