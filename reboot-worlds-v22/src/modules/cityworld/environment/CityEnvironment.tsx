import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITIES, type CityId } from '../cityRegistry'
import { seeded } from '../cities/cityKit'
import { Architecture, Parts, useEnvironment, type Vec } from './ScenePrimitives'
import { terrain, skylinePlan } from './DistrictTerrain'
import { WORK_SITES } from './cityDesign'

/** Functions are architectural types, not project statuses. Only CityTower represents records. */
function building(a: Architecture, city: CityId, x: number, z: number, h: number, w: number, variant: number) {
  const p = CITIES[city].palette, dark = p.body, light = p.accent
  const box = (y: number,s: Vec,c = dark,r: Vec = [0,0,0],glow = false) => a.box([x,y,z],s,c,r,glow)
  if(variant%3===1) {
    // Low halls, bays and galleries punctuate the tall silhouettes.
    const roof=city==='Graveyard'?'#686073':city==='Legend'?'#c3b795':city==='Health'?'#8ac4b2':'#7793a6'
    if(['Health','Education','Community'].includes(city)) {
      a.add('orb',[x,h*.13,z],[w*2,h*.18,w*1.5],roof)
      for(const side of [-1,1])a.beam([x+side*w,0,z],[x+side*w,h*.23,z],.45,roof)
      a.ring([x,h*.1,z],w*1.6,p.secondary)
    } else if(city==='Space') {
      a.ring([x,h*.4,z],w*2.2,roof,[.2,.2,0],false)
      for(let j=0;j<4;j++)a.box([x+(j-1.5)*w,h*.25,z],[w*.8,.25,w*1.6],'#46699e')
      a.beam([x,0,z],[x,h*.4,z],.5,roof)
    } else {
      a.box([x,h*.12,z],[w*3,h*.24,w*1.7],dark,[0,city==='Creator'?.4:0,city==='Graveyard'?.22:0])
      for(let j=0;j<4;j++)a.box([x+(j-1.5)*w*.7,h*.3,z],[.2,h*.22,w*1.9],roof)
      a.box([x,h*.12,z+w*.87],[w*2,h*.06,.05],light,undefined,true)
      if(city==='Gaming')a.add('hex',[x,h*.35,z],[w*1.3,.3,w*1.3],'#b58a9e')
    }
    return
  }
  if(variant%3===2) {
    // Gateways, cantilevered observatories and broken arches break up the skyline.
    const pale=city==='Legend'?'#d2c59f':city==='Creator'?'#b49dbd':'#7896a7'
    const height=city==='Community'?h*.55:h*.8
    for(const side of [-1,1])a.beam([x+side*w,0,z],[x+side*w*.65,height,z],city==='Graveyard'?.35:1,pale)
    if(city==='Graveyard'){a.box([x+w,height*.5,z],[w*2,.8,w],'#72677b',[0,.2,.8]);return}
    if(city==='Robotics'||city==='IdeaHub') {
      a.box([x,height,z],[w*3,1,w*1.5],'#c59a65');a.beam([x+w,height,z],[x+w,height*.4,z],.1,p.secondary,true)
    } else if(city==='AI')a.add('rock',[x,height,z],[w*.8,3,w*.8],'#72b7d3')
    else if(city==='Space'||city==='Education')a.add('orb',[x,height,z],[w*1.5,2.5,w*1.5],pale)
    else if(city==='Health'||city==='Community')a.add('orb',[x,height,z],[w*2,1.3,w*1.5],'#65a294')
    else a.add('hex',[x,height,z],[w*1.8,1.5,w*1.4],pale,[0,0,city==='Creator'?.3:0])
    if(city==='Legend')a.add('cone',[x,height+5,z],[w*.4,9,w*.4],'#dfcf9f')
    return
  }
  switch (city) {
    case 'Graveyard':
      // Exposed frame, offset slabs, hanging cables and a fallen wall. No striped solid towers.
      for (let j=0;j<3;j++) a.beam([x+(j-1)*w/2,0,z-w/2],[x+(j-1)*w/2+h*.12,h*(j===1?.74:1),z-w/2],.28,'#46505b')
      for(let j=0;j<4;j++) box(h*(j+1)/5,[w,.35,w],j%2?'#29313d':'#352836',[0,0,(variant%3-1)*.16])
      a.box([x+w*.6,h*.24,z+w*.4],[w*.35,h*.5,.45],'#293440',[.2,0,.65])
      a.beam([x,h*.8,z],[x+.7,h*.38,z],.06,'#8b637b')
      if(variant%3===0) a.box([x,h*.63,z+.5],[w*.7,1,.08],'#6d354d',[0,0,.2],true)
      break
    case 'IdeaHub':
      box(h*.23,[w,h*.46,w],'#3b3439',[0,0,-.06])
      for(const side of [-1,1]) for(const depth of [-1,1]) a.beam([x+side*w*.65,0,z+depth*w*.65],[x+side*w*.65,h*1.15,z+depth*w*.65],.13,'#d4a064')
      for(let j=0;j<4;j++) box(h*(.5+j*.16),[w*(1-j*.12),.45,w],j>1?'#2b8b83':'#547076')
      a.beam([x-w*.5,.3,z+w*.55],[x-w*.5,h,z+w*.55],.12,light,true)
      break
    case 'Legend':
      a.add('pillar',[x,h*.4,z],[w*.65,h*.8,w*.65],'#607080')
      a.add('cone',[x,h*.96,z],[w*.65,h*.4,w*.65],'#d4c295')
      for(const side of [-1,1]) a.beam([x+side*w*.62,.2,z],[x+side*w*.32,h*.83,z],.12,light,true)
      a.ring([x,h*.7,z],w*.8,'#90dfeb')
      break
    case 'AI':
      a.add('pillar',[x,h/2,z],[w*.5,h,w*.5],dark)
      for(let j=0;j<3;j++) a.box([x+(j-1)*w*.4,h*.53,z],[.15,h*(.7+j*.08),w*.85],j===1?light:'#345d79',[0,0,.05],j===1)
      a.add('rock',[x,h+1.3,z],[w*.5,1.3,w*.5],'#5099b3')
      break
    case 'Gaming':
      for(let j=0;j<4;j++) a.box([x+(j%2)*w*.25,h*(j+.5)/4,z],[w*(1-j*.14),h/4,w*(1-j*.14)],j%2?'#47306a':'#394166')
      box(h+.3,[w*1.1,.35,w*1.1],light,[0,0,0],true)
      break
    case 'Education':
      a.add('pillar',[x,h*.35,z],[w,h*.7,w],'#344a67')
      for(let j=0;j<3;j++) a.ring([x,h*(.2+j*.24),z],w*1.04,j===1?'#e3c697':'#759ab0',undefined,j===1)
      a.add('orb',[x,h*.74,z],[w*.9,h*.25,w*.9],'#6889a0')
      break
    case 'Health':
      a.add('orb',[x,h*.38,z],[w,h*.5,w],'#3b7e7c')
      a.add('orb',[x,h*.64,z],[w*.62,h*.38,w*.62],'#99bdb4')
      a.ring([x,h*.55,z],w,light)
      break
    case 'Creator':
      a.add(variant%2?'rock':'cone',[x,h*.5,z],[w,h*.6,w],'#694575',[.2,variant,.3])
      box(h*.4,[w*2,.4,w*1.7],'#9ba4b3',[0,.4,.2])
      a.ring([x,h*.85,z],w*.8,light,[.3,.5,0])
      break
    case 'Space':
      a.add('pillar',[x,h*.3,z],[w*.8,h*.6,w*.8],'#46516c')
      a.ring([x,h*.7,z],w*1.8,'#8e94bf',[.5,0,0],false)
      a.add('orb',[x,h*.6,z],[w*.7,w*.7,w*.7],'#7694ae')
      a.box([x+w*1.4,h*.5,z],[w*1.6,.14,w],'#294482')
      break
    case 'Robotics':
      for(const side of [-1,1]) a.box([x+side*w*.7,h*.4,z],[.4,h*.8,w*1.5],'#627485')
      box(h*.8,[w*1.9,.7,w*1.5],'#b38659')
      a.add('pillar',[x,h*.35,z],[w*.7,h*.6,w*.7],'#30444f')
      a.ring([x,h*.5,z],w*.85,light)
      break
    case 'Community':
      box(h*.3,[w*1.7,h*.6,w*1.6],variant%2?'#588b87':'#a68976')
      a.add(variant%2?'cone':'orb',[x,h*.7,z],[w*1.3,h*.35,w*1.3],variant%2?'#bd9973':'#5a9991')
      a.box([x,h*.3,z+w*.82],[w*.65,h*.45,.12],'#ffe1ad',undefined,true)
  }
}

function stationDetail(a:Architecture,city:CityId,x:number,z:number,i:number) {
  const p=CITIES[city].palette
  // Four deliberately different satellite structures supplement each main silhouette.
  if(city==='Graveyard') {
    if(i===1) {
      a.ring([x+6,5,z-2],3,'#68516e',[.4,0,.6],false)
      a.box([x+5,1,z],[4,.5,5],'#4d435c',[.1,.3,.15])
      a.box([x+6,4,z-1],[.4,5,1],'#536578',[0,0,.5])
    } else if(i===2) {
      a.add('pillar',[x+6,.3,z],[5,.6,5],'#3f4759')
      a.add('cone',[x+6,3,z],[2,6,2],'#77616c',[.2,0,.8])
      a.beam([x+2,0,z+4],[x+8,1,z-3],.2,'#a25868',true)
    } else if(i===3) {
      a.box([x+7,3,z],[8,.5,6],'#625363',[0,0,.24])
      for(const side of [-1,1])a.beam([x+7+side*3,0,z],[x+7+side*3,3,z],.3,'#727081')
    }
    return
  }
  if(city==='IdeaHub'||city==='Robotics') {
    if(i===0) a.box([x+6,2,z],[4,4,4],'#594a4d',[0,0,.12])
    if(i===1) {a.box([x+6,1.5,z],[5,.5,8],'#647683');for(let j=0;j<5;j++)a.add('pillar',[x+6,1.85,z-3+j*1.5],[.2,5,.2],'#af9975',[0,0,Math.PI/2])}
    if(i===2) {a.ring([x+7,6,z],4,p.secondary,[0,0,0]);a.box([x+7,2,z],[6,4,3],'#455a63')}
    if(i===3) {a.beam([x+4,2,z],[x+12,5,z],1,'#91b6ad');a.beam([x+4,2.6,z],[x+12,5.6,z],.1,p.accent,true)}
    return
  }
  if(city==='Gaming') {
    if(i===0)for(let j=0;j<16;j++)a.box([x+6+j%4,1.2,z+Math.floor(j/4)],[.95,.2,.95],j%2?'#c5aa8f':'#403254')
    if(i===1)for(let j=0;j<4;j++)a.box([x+5+j,2+j,z],[1,4+j,1],j%2?'#9b5eac':'#536ca9')
    if(i===2)for(const side of [-1,1])a.add('cone',[x+6+side*3,4,z],[2,8,2],'#766bab')
    if(i===3)a.ring([x+6,4,z],3,p.accent,[0,0,0])
    return
  }
  if(city==='AI') {
    if(i===0)for(let j=0;j<3;j++)a.box([x+5+j*1.4,4+j,z],[.7,8+j*2,2],'#416781')
    if(i===1)a.ring([x+7,7,z],4,p.accent,[.5,.4,0])
    if(i===2)for(let j=0;j<3;j++)a.box([x+5,3+j*2,z],[4,1,.1],'#477492',[0,.5,0])
    if(i===3)a.add('orb',[x+6,4,z],[3,4,3],'#49788c')
    return
  }
  if(city==='Creator') {
    if(i===0)a.box([x+6,6,z],[7,4,.3],'#a98daa',[0,.4,.12])
    if(i===1)for(let j=0;j<4;j++)a.ring([x+6,j*2+2,z],1+j*.4,p.secondary,[0,Math.PI/2,0])
    if(i===2)a.add('rock',[x+6,4,z],[4,2,3],'#bda987',[.4,.2,.8])
    if(i===3)for(let j=0;j<3;j++)a.box([x+5+j*2,3,z],[1.8,4,.1],['#95799e','#7799b5','#bda987'][j],[0,.2,0])
    return
  }
  if(city==='Space') {
    if(i===0){a.add('pillar',[x+7,1,z],[5,.5,5],'#65728b');a.ring([x+7,1.3,z],4,p.accent)}
    if(i===1)a.ring([x+7,8,z],5,p.secondary,[.7,0,0],false)
    if(i===2){a.add('rock',[x+9,-1,z],[5,3,4],'#686a7f');a.beam([x+3,1,z],[x+9,1,z],1.2,'#81849c')}
    if(i===3)a.box([x+6,4,z],[6,4,.12],'#3c608a',[.3,0,0])
    return
  }
  // Peaceful districts: library / conservatory / public forum / sky garden.
  if(i===0)for(let j=0;j<4;j++)a.box([x+6,1+j*1.3,z],[6,.3,4],city==='Education'?'#a69c88':'#78948d')
  if(i===1){a.add('orb',[x+6,2,z],[4,2.5,4],city==='Health'?'#599d8d':'#607e91');a.ring([x+6,.5,z],4,p.secondary)}
  if(i===2){a.add('pillar',[x+6,3,z],[2,6,2],'#7b91a0');a.add('orb',[x+6,7,z],[3,1.5,3],'#a4a79c')}
  if(i===3){a.add('pillar',[x+6,1,z],[4,.5,4],'#799b91');for(let j=0;j<3;j++)a.add('rock',[x+4+j*2,2.2,z],[.9,1.5,.9],'#58a08b')}
}

function makeEnvironment(city: CityId, low: boolean) {
  const a = new Architecture(), p = CITIES[city].palette
  terrain(a,city)
  for(const {x,z,h,w,variant} of skylinePlan(city,low)) building(a,city,x,z,h,w,variant)
  WORK_SITES.forEach(([x,,z],i)=>{
    building(a,city,x,z-5,9+i*2,4,i)
    stationDetail(a,city,x,z,i)
    a.add('pillar',[x,.2,z+4],[4,.4,3],p.body)
    // A work surface, two benches, equipment and a holographic panel per site.
    a.box([x,1.25,z+4],[2.5,.3,1.4],'#617787')
    a.box([x,2.2,z+3.8],[2,1.2,.08],i%2?p.secondary:p.accent,[-.25,0,0],true)
    for(const side of [-1,1]) {
      a.box([x+side*3,.5,z+4],[.8,1,2],p.body)
      a.add(city==='Graveyard'?'rock':'box',[x+side*4,.5,z+2],[.8,.8,.8],i%2?'#967966':'#426d78',[.2,i,.1])
    }
    if(city==='Graveyard'||city==='IdeaHub'||city==='Robotics') {
      a.beam([x-5,0,z-4],[x-5,18,z-4],.35,'#8c7b6b')
      a.beam([x-7,18,z-4],[x+5,18,z-4],.4,'#9b7961')
      a.beam([x+4,18,z-4],[x+4,10,z-4],.07,'#748e9e')
    }
  })
  // Foreground lamps and meaningful ground detail: plants, supply crates or rubble.
  for(let i=0;i<(low?24:56);i++) {
    const site=WORK_SITES[i%4], angle=i*2.4, radius=6+i%5
    const x=site[0]+Math.cos(angle)*radius,z=site[2]+Math.sin(angle)*radius
    if(city==='Health'||city==='Community'||city==='Education'||city==='Legend') {
      a.beam([x,0,z],[x,1.4,z],.12,'#64867d')
      a.add('rock',[x,1.7,z],[.8,1.2,.8],city==='Health'?'#4fb99b':'#407e76')
    } else a.add(city==='Graveyard'||city==='Space'?'rock':'box',[x,.35,z],[.7,.5,.8],i%3?'#394b5b':p.secondary,[.1,i,.2])
  }
  for(let i=0;i<6;i++) for(const side of [-1,1]) {
    a.beam([side*4,0,17+i*6],[side*4,2.4,17+i*6],.12,'#637683')
    a.add('orb',[side*4,2.5,17+i*6],[.22,.22,.22],p.secondary,undefined,true)
  }
  return a
}
export function CityEnvironment({city}: {city:CityId}) {
  const {lowEffects}=useEnvironment()
  const data=useMemo(()=>makeEnvironment(city,lowEffects),[city,lowEffects])
  return <><Parts data={data} name={`${city}-terrain-and-architecture`} /><Atmosphere city={city} /></>
}
function Atmosphere({city}: {city:CityId}) {
  const {lowEffects,reduced}=useEnvironment()
  const ref=useRef<THREE.Points>(null)
  const positions=useMemo(()=>new Float32Array(Array.from({length:(lowEffects?30:180)*3},(_,i)=> (seeded(city,i+801)-.5)*(i%3===1?45:150))),[city,lowEffects])
  useFrame((_,delta)=>{if(ref.current&&!reduced&&!lowEffects)ref.current.rotation.y+=Math.min(delta,.1)*.006})
  return <group name="atmospheric-depth">
    <points ref={ref} position={[0,19,0]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial color={CITIES[city].palette.secondary} size={city==='Space'?.15:.07} transparent opacity={.5} depthWrite={false} /></points>
    {!lowEffects && [0,1,2].map(i=><mesh key={i} position={[0,1+i*.7,-8-i*13]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[130,32]} /><meshBasicMaterial color={CITIES[city].environment.bg} transparent opacity={.1} depthWrite={false} side={THREE.DoubleSide} /></mesh>)}
  </group>
}
