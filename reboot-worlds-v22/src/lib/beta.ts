import { supabase, dataConfigured } from './supabase'
export interface BetaStatus {admin:boolean;status:'none'|'pending'|'approved'|'rejected'|'owner';memberLimit:number;projectLimit:number;myProjectLimit:number;myProjects:number}
export async function betaCall<T>(name:string,args:Record<string,unknown>={}):Promise<T> {
 if(!dataConfigured)throw new Error('Live beta services are not configured on this preview. You can still explore and build temporary ideas.')
 const {data,error}=await supabase.rpc(name,args).abortSignal(AbortSignal.timeout(15000))
 if(error)throw new Error(error.message)
 return data as T
}
