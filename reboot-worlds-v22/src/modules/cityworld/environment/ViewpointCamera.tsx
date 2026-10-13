import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { CityId } from '../cityRegistry'
import { viewFor } from './cityDesign'

export function ViewpointCamera({city,view,request,reduced}: {city:CityId;view:string;request:number;reduced:boolean}) {
  const {camera,controls,invalidate}=useThree()
  const active=useRef(false)
  const orbit=controls as unknown as {target:Vector3;update:()=>void;enabled:boolean;addEventListener:(type:string,fn:()=>void)=>void;removeEventListener:(type:string,fn:()=>void)=>void}|null
  const goal=useRef(new Vector3()),target=useRef(new Vector3())
  useEffect(()=>{
    if(!request||!orbit)return
    const pose=viewFor(city,view);goal.current.set(...pose.position);target.current.set(...pose.target)
    active.current=true;invalidate()
    const cancel=()=>{active.current=false}
    orbit.addEventListener('start',cancel)
    return ()=>{orbit.removeEventListener('start',cancel);active.current=false}
  },[city,view,request,orbit,invalidate])
  useFrame((_,delta)=>{
    if(!active.current||!orbit)return
    const blend=reduced?1:1-Math.exp(-delta*5)
    camera.position.lerp(goal.current,blend);orbit.target.lerp(target.current,blend);orbit.update()
    if(camera.position.distanceTo(goal.current)<.02){active.current=false}
    else invalidate()
  })
  return null
}
