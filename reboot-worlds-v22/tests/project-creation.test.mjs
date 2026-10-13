import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
let server, useAuth, useProjects, computeAwards
const input = {name:'New idea',tagline:'An idea',description:'',category:'AI',status:'alive',stage:1,momentum:0,founder:'Builder',foundedYear:2026,failureYear:null,failureReason:null,tags:[],connections:[],followers:0}
before(async()=>{
  server = await createServer({cacheDir:'node_modules/.vite-project-tests',ssr:{noExternal:['firebase']},server:{middlewareMode:true},appType:'custom',plugins:[{name:'project-boundary-test',enforce:'pre',resolveId(id){if(id==='firebase/auth'||id.endsWith('/lib/firebase')||id.endsWith('/lib/supabase'))return '\0mock:'+id},load(id){
    if(id==='\0mock:firebase/auth')return 'export const onAuthStateChanged = () => {}; export const signInWithPopup = () => {}; export const signInWithEmailAndPassword = () => {}; export const createUserWithEmailAndPassword = () => {}; export const signOut = () => {};'
    if(id.endsWith('/lib/firebase'))return 'export const firebaseAuth = {}; export const googleProvider = {}; export const githubProvider = {};'
    if(id.endsWith('/lib/supabase'))return 'export const supabase = {from: () => globalThis.projectBoundary};'
  }}]})
  ;({useAuth,useProjects}=await server.ssrLoadModule('/src/stores/auth.ts'))
  ;({computeAwards}=await server.ssrLoadModule('/src/types/project.ts'))
})
after(async()=>{await server?.close();delete globalThis.projectBoundary})
beforeEach(()=>{
  useAuth.setState({user:{uid:'synthetic-owner',displayName:'Builder'}})
  useProjects.setState({projects:[],error:null})
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
  assert.equal(useProjects.getState().projects.length,0);assert.match(useProjects.getState().error,/connection/)
})
