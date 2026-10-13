import { useDistrictSignals } from './environment/districtSignals'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITIES, type CityId } from './cityRegistry'
import { WORK_SITES } from './environment/cityDesign'

type Behavior = 'walking' | 'turning' | 'working' | 'inspecting' | 'interacting' | 'idle'
/** Fixed lanes around actual work sites avoid buildings and each other without a physics engine. */
export function residentPose(index: number, t: number, city: CityId) {
  const site=WORK_SITES[index%4],lane=Math.floor(index/4),drone=lane===2
  const active=lane<3, cycle=(t*(city==='Graveyard'?.35:1)+index*2)%24
  const walking=active && cycle<12
  const state:Behavior=walking?'walking':cycle<14?'turning':lane%3===0?'working':lane%3===1?'interacting':cycle<20?'inspecting':'idle'
  const progress=Math.min(cycle,12)/12,angle=progress*Math.PI*2+index*.9
  const r=2.3+lane*.48
  const x=site[0]+Math.cos(active?angle:index)*r,z=site[2]+4+Math.sin(active?angle:index)*r
  return {x,z,y:drone?3.8+Math.sin(t*.6+index)*.3:0,angle:walking?-angle:Math.atan2(site[0]-x,site[2]+4-z),state,drone}
}

export function CityLife({ city, reduced, lowEffects }: { city: CityId; reduced: boolean; lowEffects: boolean }) {
  const population=city==='Graveyard'?(lowEffects?6:14):lowEffects?16:36
  const body=useRef<THREE.InstancedMesh>(null),head=useRef<THREE.InstancedMesh>(null),cloth=useRef<THREE.InstancedMesh>(null),light=useRef<THREE.InstancedMesh>(null)
  const wheels=useRef<THREE.InstancedMesh>(null)
  const dummy=useMemo(()=>new THREE.Object3D(),[]),color=useMemo(()=>new THREE.Color(),[])
  const time=useRef(0),last=useRef(-1)
  const p=CITIES[city].palette
  function update(t:number,colors=false) {
    if(!body.current||!head.current||!cloth.current||!light.current||!wheels.current)return
    for(let i=0;i<population;i++) {
      const pose=residentPose(i,t,city),{x,z,angle,state,drone}=pose
      const stature=.85+(i%4)*.12,robot=['AI','Robotics','IdeaHub'].includes(city),ghost=city==='Graveyard'&&i%4===3
      const creature=city==='Gaming'&&i%4===2&&!drone
      const wheeled=(city==='Robotics'||city==='IdeaHub')&&i%3===1&&!drone
      const reaction=useDistrictSignals.getState().pulse>0 && performance.now()-useDistrictSignals.getState().pulse<2500
      const y=pose.y+(ghost?.35:0),wide=creature?.7:robot?.58:.42+(i%3)*.06
      const limb=state==='walking'?Math.sin(t*4+i)*.3:state==='working'?Math.sin(t*2+i)*.15:0
      function part(mesh:THREE.InstancedMesh,n:number,lx:number,ly:number,lz:number,sx:number,sy:number,sz:number,rx=0) {
        dummy.position.set(x+Math.cos(angle)*lx+Math.sin(angle)*lz,y+ly*stature,z-Math.sin(angle)*lx+Math.cos(angle)*lz)
        dummy.rotation.set(rx,angle+(reaction?.35:0),0);dummy.scale.set(sx,sy*stature,sz);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix)
      }
      part(body.current,i*6,0,1.05,0,drone?.65:wide,drone?.28:creature?.5:.8,.38)
      for(let side=0;side<2;side++) {
        const sign=side?1:-1
        part(body.current,i*6+1+side,sign*.19,.4,0,drone||wheeled?0:.16,.65,.18,limb*sign)
        part(body.current,i*6+3+side,sign*(wide*.7),1.05,state==='working'?.28:0,city==='Graveyard'&&i%3===1&&side===0?0:.14,drone?.1:.65,.16,drone?0:state==='working'?-1:limb*-sign)
      }
      // Role accessory: supply pack, astronaut tank, artist tool or robot chassis.
      part(body.current,i*6+5,0,robot&&!drone?1.68:1.12,robot&&!drone?0:-.3,robot&&!drone?.48:.34,city==='Space'?.65:.45,robot&&!drone?.45:.25)
      part(head.current,i,0,drone?1.1:1.68,0,drone?.38:robot?0:city==='Space'?.36:creature?.38:.27,.3,.27)
      const robe=(city==='Graveyard'||city==='Education'||city==='Health')&&!drone
      part(cloth.current,i*2,0,.9,0,robe?.5:0,1.4,.5)
      const hood=city==='Graveyard',hat=city==='Creator'||city==='Education'
      part(cloth.current,i*2+1,0,hood?1.85:1.99,0,!drone&&(hood||hat)?.38:0,hood?.7:.16,.38)
      for(let j=0;j<2;j++) {
        part(wheels.current,i*2+j,(j?1:-1)*.36,.3,0,wheeled?.28:0,.28,.28)
      }
      part(light.current,i*2,0,drone?1.12:1.72,.255,.32,.085,.06)
      const book=city==='Education'||city==='Community',brush=city==='Creator'
      part(light.current,i*2+1,.46,.8,.35,brush?.06:book?.28:.15,brush?.7:book?.06:.23,book?.35:.15)
      if(colors) {
        const tone=city==='Graveyard'?['#687181','#323f53','#6c526b'][i%3]:[p.secondary,'#97abb8',p.body,'#bc9c88'][i%4]
        for(let j=0;j<6;j++)body.current.setColorAt(i*6+j,color.set(tone))
        head.current.setColorAt(i,color.set(city==='Space'?'#c6d7de':robot?'#7a969e':tone))
      }
    }
    for(const mesh of [body.current,head.current,cloth.current,light.current,wheels.current]) {
      mesh.instanceMatrix.needsUpdate=true
      if(colors&&mesh.instanceColor)mesh.instanceColor.needsUpdate=true
    }
  }
  useLayoutEffect(()=>{time.current=0;last.current=-1;update(0,true)},[city,population,reduced])
  useFrame(({camera},delta)=>{
    if(reduced)return
    time.current+=Math.min(delta,.1)
    const interval=lowEffects?.1:camera.position.length()>85?.16:1/30
    if(time.current-last.current<interval)return
    last.current=time.current;update(time.current)
  })
  return <group name={city+'-fictional-inhabitants'} userData={{population,animated:Math.min(population,12)}}>
    <instancedMesh name="resident-bodies" onClick={e=>{e.stopPropagation();if(e.instanceId!==undefined)useDistrictSignals.getState().inspect(city,Math.floor(e.instanceId/6))}} ref={body} args={[undefined,undefined,population*6]} frustumCulled={false}><boxGeometry/><meshStandardMaterial roughness={.7}/></instancedMesh>
    <instancedMesh name="resident-heads-and-drones" ref={head} args={[undefined,undefined,population]} frustumCulled={false}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial metalness={.35} roughness={.4}/></instancedMesh>
    <instancedMesh name="archive-cloaks" ref={cloth} args={[undefined,undefined,population*2]} frustumCulled={false}><coneGeometry args={[1,1,7]}/><meshStandardMaterial color={city==='Health'?'#a6d0c1':city==='Education'?'#657c9e':city==='Creator'?'#ba8cad':'#3d334b'}/></instancedMesh>
    <instancedMesh name="maintenance-wheels" ref={wheels} args={[undefined,undefined,population*2]} frustumCulled={false}><torusGeometry args={[1,.28,5,12]}/><meshStandardMaterial color="#718899" metalness={.7}/></instancedMesh>
    <instancedMesh name="eyes-and-role-tools" ref={light} args={[undefined,undefined,population*2]} frustumCulled={false}><boxGeometry/><meshBasicMaterial color={city==='Graveyard'?'#b7a2d4':p.accent}/></instancedMesh>
  </group>
}
