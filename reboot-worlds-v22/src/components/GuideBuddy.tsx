import { useState } from 'react'
import { useUI } from '@/stores/ui'
const steps=[{title:'Hey, I’m Pip.',text:'Pick a district to explore. Drag to look around and scroll to get closer. Return takes you back.',action:'Next'}, {title:'Start small.',text:'Build an idea makes a temporary building. Try its color and roof. You can keep it after beta approval.',action:'Next'}, {title:'Nothing starts famous.',text:'Zero Hub holds ideas below 100 unique member views. Graveyard is a separate broken planet. Beta & feedback is where you request access or share a thought.',action:'Let’s explore'}]
export function GuideBuddy(){
 const mode=useUI(s=>s.mode),busy=useUI(s=>s.travelPhase!=='idle'),selected=useUI(s=>s.selectedProjectId)
 const [open,setOpen]=useState(()=>{try{return localStorage.getItem('reboot-pip-seen')!=='true'}catch{return true}}),[step,setStep]=useState(0)
 function close(){setOpen(false);try{localStorage.setItem('reboot-pip-seen','true')}catch{}}
 if(mode==='beta'||busy||selected)return null
 return <aside className={`guide-buddy ${open?'open':''} ${mode==='graveyard'?'planet-guide':''}`} aria-label="Pip guide">{open?<><div className="buddy-face" aria-hidden="true">◉ ◉</div><div><small>PIP · YOUR GUIDE · {step+1}/3</small><h2>{steps[step].title}</h2><p>{steps[step].text}</p><button onClick={()=>step===2?close():setStep(step+1)}>{steps[step].action}</button><button className="text-link" onClick={close}>Skip — I’ll explore</button></div></>:<button onClick={()=>{setStep(0);setOpen(true)}}>◉ Ask Pip</button>}</aside>
}
