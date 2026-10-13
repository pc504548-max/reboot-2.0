import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
let server, useAuth, useProjects, computeAwards
const input = {name:'New idea',tagline:'An idea',description:'',category:'AI',status:'alive',stage:1,momentum:0,founder:'Builder',foundedYear:2026,failureYear:null,failureReason:null,tags:[],connections:[],followers:0}
before(async()=>{
  server = await createServer({cacheDir:'node_modules/.vite-project-tests',ssr:{noExternal:['firebase']},server:{middlewareMode:true},appType:'custom',plugins:[{name:'project-boundary-test',enforce:'pre',resolveId(id){if(id==='firebase/auth'||id.endsWith('/lib/firebase')||id.endsWith('/lib/supabase'))return '\0mock:'+id},load(id){
    if(id==='\0mock:firebase/auth')return 'export const onIdTokenChanged = () => () => {}; export const sendPasswordResetEmail = () => {}; export const signInWithPopup = () => {}; export const signInWithEmailAndPassword = () => {}; export const createUserWithEmailAndPassword = () => {}; export const signOut = () => {};'
    if(id.endsWith('/lib/firebase'))return 'export const firebaseAuth = {}; export const googleProvider = {}; export const githubProvider = {};'
    if(id.endsWith('/lib/supabase'))return 'export const dataConfigured = true; export const databaseSession = {clear(){}}; export const supabase = {from: () => globalThis.projectBoundary}; export const publicSupabase = {from: () => globalThis.publicBoundary};'
  }}]})
  ;({useAuth,useProjects}=await server.ssrLoadModule('/src/stores/auth.ts'))
  ;({computeAwards}=await server.ssrLoadModule('/src/types/project.ts'))
})
after(async()=>{await server?.close();delete globalThis.projectBoundary;delete globalThis.publicBoundary})
beforeEach(()=>{
  useAuth.setState({user:{uid:'synthetic-owner',displayName:'Builder'}})
  useProjects.setState({projects:[],error:null,savingDrafts:[],loading:false,nextOffset:0,hasMore:false});delete globalThis.publicBoundary
  globalThis.projectBoundary={calls:0,insert(row){this.calls++;this.row=row;return this},select(){return this},abortSignal(signal){assert.ok(signal instanceof AbortSignal);return this},async single(){return {data:{...this.row,id:'saved-project',created_at:'2026-10-10T00:00:00Z',updated_at:'2026-10-10T00:00:00Z'},error:null}}}
})
test('signed-out creation sends no insert and creates no building record',async()=>{
  useAuth.setState({user:null});assert.equal(await useProjects.getState().createProject(input),null)
  assert.equal(globalThis.projectBoundary.calls,0);assert.equal(useProjects.getState().projects.length,0)
})
test('save includes authenticated owner and returned project earns Founder',async()=>{
  const project=await useProjects.getState().createProject(input)
  assert.equal(globalThis.projectBoundary.row.firebase_uid,'synthetic-owner')
  assert.equal(globalThis.projectBoundary.row.founded_year,2026)
  assert.equal(project.id,'saved-project');assert.equal(useProjects.getState().projects[0].id,project.id)
  assert.ok(computeAwards(project).some(a=>a.type==='founder'))
  await useProjects.getState().createProject(input)
  assert.equal(useProjects.getState().projects.length,1,'same returned row must not duplicate a building')
})
test('database rejection preserves projects and successful retry clears error',async()=>{
  const single=globalThis.projectBoundary.single
  globalThis.projectBoundary.single=async()=>({data:null,error:{message:'Write denied'}})
  assert.equal(await useProjects.getState().createProject(input),null)
  assert.equal(useProjects.getState().projects.length,0);assert.equal(useProjects.getState().error,'Write denied')
  globalThis.projectBoundary.single=single
  assert.ok(await useProjects.getState().createProject(input));assert.equal(useProjects.getState().error,null)
})
test('network exception leaves no phantom project',async()=>{
  globalThis.projectBoundary.single=async()=>{throw Error('offline')}
  assert.equal(await useProjects.getState().createProject(input),null)
  assert.equal(useProjects.getState().projects.length,0);assert.ok(useProjects.getState().error)
})

test('guest creation stays local, survives a refresh payload and expires',async()=>{
  useAuth.setState({user:null})
  const draft=useProjects.getState().createGuestProject(input)
  assert.equal(globalThis.projectBoundary.calls,0)
  assert.equal(draft.temporary,true)
  assert.deepEqual(computeAwards(draft),[])
  useProjects.setState({projects:[{...draft,expiresAt:Date.now()-1}]})
  useProjects.getState().expireGuests()
  assert.equal(useProjects.getState().projects.length,0)
})
test('draft promotion retries the same UUID and keeps failed drafts',async()=>{
  const draft=useProjects.getState().createGuestProject(input)
  const boundary=globalThis.projectBoundary
  boundary.upsert=function(row){this.row=row;this.calls++;return this}
  boundary.single=async()=>({error:{message:'offline'}})
  assert.equal(await useProjects.getState().saveGuestProject(draft.id),null)
  assert.equal(useProjects.getState().projects[0].temporary,true)
  assert.equal(boundary.row.id,draft.id)
  boundary.single=async()=>({data:{...boundary.row,created_at:draft.createdAt,updated_at:draft.updatedAt},error:null})
  const saved=await useProjects.getState().saveGuestProject(draft.id)
  assert.equal(saved.id,draft.id);assert.equal(saved.ownerId,'synthetic-owner')
  assert.equal(useProjects.getState().projects[0].temporary,undefined)
  assert.equal(useProjects.getState().savingDrafts.length,0)
})
test('guest appearance persists in the draft and owner checks block remote edits',async()=>{
  const draft=useProjects.getState().createGuestProject(input)
  assert.equal(await useProjects.getState().updateProject(draft.id,{buildingCustomization:{color:'#eebb99',height:1.5,style:'crystal',glowIntensity:2}}),true)
  assert.equal(useProjects.getState().projects[0].buildingCustomization.style,'crystal')
  useProjects.setState({projects:[{...draft,temporary:false,ownerId:'someone-else'}]})
  assert.equal(await useProjects.getState().updateProject(draft.id,{name:'Changed'}),false)
  assert.equal(globalThis.projectBoundary.calls,0)
})

test('public catalog pages are independent of private writes and merge without duplicates',async()=>{
 const rows=Array.from({length:500},(_,i)=>({...input,id:'p'+i,founded_year:2026,created_at:'2026-10-13',updated_at:'2026-10-13',project_metrics:{view_count:i}}))
 const ranges=[];globalThis.publicBoundary={select(){return this},order(){return this},range(a,b){ranges.push([a,b]);return this},abortSignal(){return this},async returns(){return {data:ranges.length===1?rows:[rows[0]],error:null}}}
 await useProjects.getState().fetchProjects();assert.equal(useProjects.getState().projects.length,500);assert.equal(useProjects.getState().hasMore,true);assert.equal(useProjects.getState().projects[99].viewCount,99)
 await useProjects.getState().fetchProjects(true);assert.deepEqual(ranges,[[0,499],[500,999]]);assert.equal(useProjects.getState().projects.length,500);assert.equal(useProjects.getState().hasMore,false);assert.equal(globalThis.projectBoundary.calls,0)
})
