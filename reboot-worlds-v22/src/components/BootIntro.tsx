import { Component, useRef, type ReactNode } from 'react'
import { Canvas,useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUI } from '@/stores/ui'
import { useMotionSettings } from '@/modules/cityworld/hooks/useCityNavigation'
class IntroBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="intro-fallback">REBOOT / A WORLD OF IDEAS</div>:this.props.children}
}
function IntroPlanet({reduced}:{reduced:boolean}) {
  const ref=useRef<THREE.Group>(null)
  useFrame((_,d)=>{if(ref.current&&!reduced)ref.current.rotation.y+=Math.min(d,.05)*.055})
  return <group ref={ref} rotation={[.18,0,-.16]}>
    <mesh><icosahedronGeometry args={[3,3]}/><meshStandardMaterial color="#153847" roughness={.82} flatShading/></mesh>
    <mesh><sphereGeometry args={[3.08,32,24]}/><meshBasicMaterial color="#61b3ce" wireframe transparent opacity={.08}/></mesh>
    {Array.from({length:11},(_,i)=>{const a=i*2.4,y=1-(i/10)*2,r=Math.sqrt(1-y*y),normal=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),normal);return <group key={i} position={normal.clone().multiplyScalar(3)} quaternion={q}>
      <mesh position={[0,.05,0]}><cylinderGeometry args={[.58,.42,.2,6]}/><meshStandardMaterial color={['#558f98','#346657','#5d4565'][i%3]}/></mesh>
      {[0,1,2].map(j=><mesh key={j} position={[(j-1)*.24,.35+j*.08,0]}><boxGeometry args={[.13,.5+j*.16,.16]}/><meshStandardMaterial color="#92b1bc" emissive={['#39d9ef','#9a78e8','#ffd185'][i%3]} emissiveIntensity={.25}/></mesh>)}
      <mesh position={[0,.86,0]}><octahedronGeometry args={[.14]}/><meshBasicMaterial color={['#64ead7','#c594ff','#ffd391'][i%3]}/></mesh>
    </group>})}
    {[0,1].map(i=><mesh key={i} rotation={[1.05+i*.3,.2,0]}><torusGeometry args={[4+i*.45,.013,4,120]}/><meshBasicMaterial color={i?'#a487cc':'#65d6db'} transparent opacity={.5}/></mesh>)}
  </group>
}
export function BootIntro() {
  const {reduced,lowEffects}=useMotionSettings()
  return <main className="reboot-intro"><section className="intro-stage">
    <div className="intro-brand"><span className="brand-mark">◈</span> REBOOT <span>AN ATLAS OF SECOND CHANCES</span></div>
    <div className="intro-planet" aria-label="A three-dimensional miniature of planet Reboot"><IntroBoundary><Canvas dpr={[1,lowEffects?1:1.5]} camera={{position:[0,1,10],fov:48}} frameloop={reduced?'demand':'always'} gl={{antialias:!lowEffects}}><ambientLight intensity={1.2}/><directionalLight position={[4,7,6]} intensity={2.6} color="#d5efff"/><directionalLight position={[-4,0,-2]} intensity={2} color="#a48af4"/><IntroPlanet reduced={reduced}/></Canvas></IntroBoundary></div>
    <section className="intro-copy"><p className="eyebrow">WELCOME TO PLANET REBOOT</p><h1>Every idea<br/>leaves a <em>world.</em></h1><p>Explore the lives, deaths, and second chances of ideas. Build a small beginning. Find something worth bringing back.</p><div className="intro-actions"><button className="btn-primary" onClick={()=>useUI.getState().setMode('city')}>Explore Reboot <span>↗</span></button><button onClick={()=>useUI.getState().setMode('auth')}>Create an account</button></div><small>Enter anonymously. Build now, save to an account later.</small></section>
    <button className="intro-scroll" onClick={()=>document.getElementById('reboot-story')?.scrollIntoView({behavior:reduced?'auto':'smooth'})}>Scroll to discover ↓</button>
    <footer className="intro-footer"><span>11 DESTINATIONS · TWO PLANETS</span><div><span>01 / Remember</span><span>02 / Rebuild</span><span>03 / Become</span></div></footer>
  </section><section id="reboot-story" className="intro-story"><p className="eyebrow">SMALL BEGINNINGS. SECOND CHANCES.</p><h2>Start with one idea.</h2><div className="story-cards"><article><span>01</span><h3>Explore</h3><p>Visit a district, meet its caretakers, and see what people are building.</p></article><article><span>02</span><h3>Try a building</h3><p>No account needed to experiment. Your temporary idea stays in this tab for up to 24 hours.</p></article><article><span>03</span><h3>Find your first audience</h3><p>Zero Hub makes room for ideas below 100 views. Approved members can keep their projects and give feedback.</p></article></div><button className="btn-primary" onClick={()=>useUI.getState().setMode('city')}>Explore now ↗</button><button onClick={()=>useUI.getState().setMode('beta')}>Pre-register for beta</button><p className="muted">1,000 approved beta places initially. The owner reviews requests privately.</p></section></main>
}
