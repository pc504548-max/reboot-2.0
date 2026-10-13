import { useEffect,useRef } from 'react'
import { useFrame,useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

export function RecordCamera({position,reduced}:{position:[number,number,number]|null;reduced:boolean}) {
  const {camera,controls,invalidate}=useThree()
  const active=useRef(false),goal=useRef(new Vector3()),target=useRef(new Vector3())
  const orbit=controls as unknown as {target:Vector3;update:()=>void;addEventListener:(type:string,fn:()=>void)=>void;removeEventListener:(type:string,fn:()=>void)=>void}|null
  const x=position?.[0],y=position?.[1],z=position?.[2]
  useEffect(()=>{
    if(!orbit)return
    target.current.set(x??0,y??0,z??0)
    goal.current.copy(target.current).add(new Vector3(x===undefined?0:8,x===undefined?12:5,x===undefined?40:14))
    active.current=true;invalidate()
    const stop=()=>{active.current=false}
    orbit.addEventListener('start',stop)
    return ()=>{orbit.removeEventListener('start',stop);active.current=false}
  },[x,y,z,orbit,invalidate])
  useFrame((_,delta)=>{
    if(!active.current||!orbit)return
    const blend=reduced?1:1-Math.exp(-delta*4)
    camera.position.lerp(goal.current,blend);orbit.target.lerp(target.current,blend);orbit.update()
    if(camera.position.distanceTo(goal.current)<.03)active.current=false
    else invalidate()
  })
  return null
}
