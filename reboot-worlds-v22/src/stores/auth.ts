import { create } from 'zustand'
import { onIdTokenChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as fbSignOut, type User as FbUser } from 'firebase/auth'
import { firebaseAuth, googleProvider, githubProvider } from '@/lib/firebase'
import { supabase, publicSupabase, dataConfigured, databaseSession } from '@/lib/supabase'
import { authMessage } from '@/lib/authBridge'
import { loadGuestProjects, makeGuestProject, storeGuestProjects, GUEST_LIMIT } from '@/lib/guestProjects'
import { rowToProject, type Project, type NewProject, type ProjectRow } from '@/types/project'
export type AuthProvider = 'google' | 'github' | 'email'
interface RebootUser {uid:string;email:string|null;displayName:string|null;photoURL:string|null}
interface AuthState {
  user:RebootUser|null; initializing:boolean; error:string|null
  signIn:(provider:AuthProvider,email?:string,password?:string)=>Promise<void>
  signUp:(email:string,password:string)=>Promise<void>
  resetPassword:(email:string)=>Promise<void>
  signOut:()=>Promise<void>; clearError:()=>void
}
function auth() { if(!firebaseAuth) throw new Error('Account sign-in is not configured yet. You can explore and build in anonymous mode.'); return firebaseAuth }
function toUser(u:FbUser):RebootUser {return {uid:u.uid,email:u.email,displayName:u.displayName,photoURL:u.photoURL}}
export const useAuth=create<AuthState>((set)=>({
  user:null,initializing:!!firebaseAuth,error:null,
  async signIn(provider,email,password) {
    set({error:null})
    try {
      const instance=auth()
      if(provider==='email') {
        if(!email?.trim()||!password)throw new Error('Enter your email and password.')
        await signInWithEmailAndPassword(instance,email.trim(),password)
      } else await signInWithPopup(instance,provider==='google'?googleProvider:githubProvider)
    } catch(e) {set({error:authMessage(e)});throw e}
  },
  async signUp(email,password) {
    set({error:null})
    try { if(password.length<6)throw new Error('Choose a password with at least 6 characters.');await createUserWithEmailAndPassword(auth(),email.trim(),password) }
    catch(e){set({error:authMessage(e)});throw e}
  },
  async resetPassword(email) {
    set({error:null})
    try {if(!email.trim())throw new Error('Enter your email first.');await sendPasswordResetEmail(auth(),email.trim())}
    catch(e){set({error:authMessage(e)});throw e}
  },
  async signOut() {
    try {await fbSignOut(auth());databaseSession.clear();set({user:null,error:null})}
    catch(e){set({error:authMessage(e)});throw e}
  },
  clearError(){set({error:null})},
}))
if(firebaseAuth) {
  let identity: string | null = null
  const unsubscribe=onIdTokenChanged(firebaseAuth,user=>{
    if (identity !== (user?.uid ?? null)) databaseSession.clear()
    identity = user?.uid ?? null
    useAuth.setState({user:user?toUser(user):null,initializing:false})
  },error=>useAuth.setState({initializing:false,error:authMessage(error)}))
  if(import.meta.hot)import.meta.hot.dispose(unsubscribe)
}
interface ProjectDataState {
  projects:Project[]; loading:boolean; error:string|null; savingDrafts:string[]
  nextOffset:number; hasMore:boolean
  fetchProjects:(more?:boolean)=>Promise<void>
  createProject:(input:NewProject)=>Promise<Project|null>
  createGuestProject:(input:NewProject)=>Project|null
  saveGuestProject:(id:string)=>Promise<Project|null>
  discardGuestProject:(id:string)=>void
  expireGuests:()=>void
  updateProject:(id:string,patch:Partial<Project>)=>Promise<boolean>
}
export function rowToInsert(input: NewProject) {
  return {name:input.name,tagline:input.tagline,description:input.description,category:input.category,status:input.status,stage:input.stage,momentum:input.momentum,founder:input.founder,founded_year:input.foundedYear,failure_year:input.failureYear,failure_reason:input.failureReason,lessons_learned:input.lessonsLearned??null,revival_requirements:input.revivalRequirements??null,tags:input.tags,connections:input.connections,followers:input.followers,...(input.buildingCustomization?{building_customization:input.buildingCustomization}:{})}
}
export const useProjects=create<ProjectDataState>((set,get)=>({
  projects:loadGuestProjects(),nextOffset:0,hasMore:false,loading:false,error:null,savingDrafts:[],
  expireGuests(){const projects=get().projects.filter(p=>!p.temporary||(p.expiresAt??0)>Date.now());if(projects.length!==get().projects.length){storeGuestProjects(projects);set({projects})}},
  async fetchProjects(more=false){
    if(get().loading)return
    get().expireGuests()
    if(!dataConfigured){set({loading:false,error:null});return}
    set({loading:true,error:null})
    try {
      const {data,error}=await publicSupabase.from('projects').select('*,project_metrics(view_count)').order('created_at',{ascending:false}).order('id').range(more?get().nextOffset:0,(more?get().nextOffset:0)+499).abortSignal(AbortSignal.timeout(15000)).returns<ProjectRow[]>()
      if(error)throw error
      const saved=(data??[]).map(rowToProject)
      set(state=>({projects:[...state.projects.filter(p=>(more||p.temporary)&&!saved.some(s=>s.id===p.id)),...saved],loading:false,nextOffset:(more?state.nextOffset:0)+(data?.length??0),hasMore:data?.length===500}))
    } catch {set({loading:false,error:'Project records could not load. Your temporary buildings are still available. Retry when connected.'})}
  },
  createGuestProject(input){
    get().expireGuests()
    if(get().projects.filter(p=>p.temporary).length>=GUEST_LIMIT){set({error:'This tab can hold 20 temporary ideas. Save or discard one first.'});return null}
    const project=makeGuestProject(input),projects=[project,...get().projects]
    storeGuestProjects(projects);set({projects,error:null});return project
  },
  discardGuestProject(id){const projects=get().projects.filter(p=>p.id!==id||!p.temporary);storeGuestProjects(projects);set({projects})},
  async createProject(input){
    const owner=useAuth.getState().user
    if(!owner){set({error:'Sign in to save a project.'});return null}
    set({error:null})
    try {
      const {data,error}=await supabase.from('projects').insert({...rowToInsert(input),firebase_uid:owner.uid}).select('*,project_metrics(view_count)').abortSignal(AbortSignal.timeout(20000)).single<ProjectRow>()
      if(error){set({error:error.message});return null}
      const project=rowToProject(data)
      set(state=>({projects:[project,...state.projects.filter(p=>p.id!==project.id)]}));return project
    }catch(e){set({error:e instanceof Error?e.message:'Could not save your project. Check your connection and try again.'});return null}
  },
  async saveGuestProject(id){
    get().expireGuests()
    const owner=useAuth.getState().user,draft=get().projects.find(p=>p.id===id&&p.temporary)
    if(!owner||!draft||get().savingDrafts.includes(id))return null
    set(s=>({savingDrafts:[...s.savingDrafts,id],error:null}))
    try {
      // A stable UUID makes retries idempotent, including a lost response after a successful write.
      const {data,error}=await supabase.from('projects').upsert({...rowToInsert(draft),id:draft.id,firebase_uid:owner.uid},{onConflict:'id'}).select('*,project_metrics(view_count)').abortSignal(AbortSignal.timeout(20000)).single<ProjectRow>()
      if(error)throw error
      const saved=rowToProject(data),projects=get().projects.map(p=>p.id===id?saved:p)
      storeGuestProjects(projects);set({projects});return saved
    }catch{set({error:'Could not save to your account. Your temporary building is still here; please retry.'});return null}
    finally{set(s=>({savingDrafts:s.savingDrafts.filter(x=>x!==id)}))}
  },
  async updateProject(id,patch){
    get().expireGuests()
    const current=get().projects.find(p=>p.id===id)
    if(!current)return false
    const {name,tagline,description,category,status,stage,momentum,founder,foundedYear,failureYear,failureReason,tags,connections,followers,buildingCustomization,lessonsLearned,revivalRequirements}= {...current,...patch}
    const input:NewProject={name,tagline,description,category,status,stage,momentum,founder,foundedYear,failureYear,failureReason,tags,connections,followers,buildingCustomization,lessonsLearned,revivalRequirements}
    if(current.temporary){const projects=get().projects.map(p=>p.id===id?{...p,...input,updatedAt:new Date().toISOString()}:p);storeGuestProjects(projects);set({projects,error:null});return true}
    const owner=useAuth.getState().user
    if(!owner||current.ownerId!==owner.uid){set({error:'Only the project owner can save changes.'});return false}
    try {
      const {data,error}=await supabase.from('projects').update(rowToInsert(input)).eq('id',id).eq('firebase_uid',owner.uid).select('*,project_metrics(view_count)').abortSignal(AbortSignal.timeout(20000)).single<ProjectRow>()
      if(error)throw error
      set(s=>({projects:s.projects.map(p=>p.id===id?rowToProject(data):p),error:null}));return true
    }catch{set({error:'Changes could not be saved. Please retry.'});return false}
  },
}))
