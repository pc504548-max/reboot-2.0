import { Architecture, type Vec } from './ScenePrimitives'
import { CITIES, type CityId } from '../cityRegistry'
import { WORK_SITES } from './cityDesign'
import { seeded } from '../cities/cityKit'

/** Walk surfaces remain at y=0; elevation is expressed through deep sections and stepped edges. */
export function terrain(a:Architecture,city:CityId) {
  const p=CITIES[city].palette
  const deck=(x:number,z:number,w:number,d:number,color:string,y=-1.2)=>a.box([x,y,z],[w,2.2,d],color)
  const island=(x:number,z:number,r:number,color:string)=>{a.add('pillar',[x,-1.5,z],[r,3,r],color);a.add('cone',[x,-6,z],[r*.8,8,r*.8],'#283e50',[Math.PI,0,0])}
  switch(city) {
    case 'Graveyard':
      for(let i=0;i<19;i++) {
        const angle=i*2.4,r=15+Math.sqrt(i/18)*49,x=Math.cos(angle)*r,z=Math.sin(angle)*r
        a.add('rock',[x,-5,z],[13+i%3*3,6,11+i%4],'#374052',[.03,angle,(i%3-1)*.07])
        a.beam([x-6,-.2,z],[x+2,-.1,z-8],.16,'#9e4f67',true)
        a.add('cone',[x,-11,z],[9,15,8],'#202635',[Math.PI,angle,0])
      }
      island(0,0,13,'#404554');WORK_SITES.forEach(([x,,z])=>deck(x,z,18,17,'#414350'))
      // Collapsed roadway: broken segments and exposed ribs.
      for(let i=0;i<6;i++){deck(0,14+i*7,6,5.8,'#4e5365',-1.2-i*.02);a.beam([-3,-3,14+i*7],[3,-2,14+i*7],.25,'#867d8f')}
      break
    case 'IdeaHub':
      deck(0,0,27,25,'#4f6269')
      WORK_SITES.forEach(([x,,z],i)=>{
        deck(x,z,23,21,i%2?'#587776':'#685d59')
        for(const side of [-1,1]){a.beam([x+side*10,-7,z-9],[x+side*10,-1,z+9],.45,'#b58d61');a.beam([x-10,-4,z+side*9],[x+10,-4,z+side*9],.4,'#829fa8')}
        for(let j=0;j<5;j++)a.box([x-9+j*4,-.01,z+9.5],[1.8,.05,1],'#edba67',[0,-.45,0],true)
        a.add('orb',[x,-6,z],[2,.8,2],'#6ad3ae',undefined,true)
      });break
    case 'Legend':
      for(let i=0;i<5;i++){a.add('pillar',[0,-1.5-i*2.2,0],[22+i*10,2.4,22+i*10],i%2?'#606d80':'#889098');a.ring([0,-.27-i*2.2,0],22+i*10,'#d9c496')}
      WORK_SITES.forEach(([x,,z])=>{island(x,z,15,'#829397');for(let i=0;i<5;i++)a.box([x,-.15-i*.35,z+9+i],[11,.4,1.1],'#c5b898')})
      for(const side of [-1,1])for(let i=0;i<7;i++)deck(side*(8+i*3),30+i*2,3,14,'#a6a99f',-1.5-i*.35)
      break
    case 'Space':
      island(0,0,16,'#637287');a.ring([0,-3.5,0],24,'#8896c2',undefined,false)
      WORK_SITES.forEach(([x,,z],i)=>{a.add('rock',[x,-5,z],[14,7,12],'#55506a',[.1,i,.2]);a.add('pillar',[x,-.7,z],[11,1.3,11],'#8594a2');a.ring([x,.02,z],10,p.accent);a.add('cone',[x,-13,z],[2,4,2],'#716fde',undefined,true)})
      for(let i=0;i<12;i++){const a0=i*.7;a.add('rock',[Math.cos(a0)*70,-10+i%3*5,Math.sin(a0)*60],[3+i%4,3,5],'#444a62',[i,0,.3])}break
    case 'AI':
      for(let i=0;i<31;i++){const x=(i%6-2.5)*15,z=(Math.floor(i/6)-2)*14;a.add('hex',[x,-1.7,z],[8.5,3,8.5],i%3?'#294e64':'#3d7082');if(i%3===0)a.ring([x,-.15,z],5,'#5ea3b9')}
      island(0,0,14,'#426679');break
    case 'Gaming':
      island(0,0,16,'#5d506e')
      for(let i=0;i<9;i++){const x=(i%3-1)*27,z=(Math.floor(i/3)-1)*25;a.add('hex',[x,-2-i%3,z],[14,3,14],['#5b4576','#46537f','#72535e'][i%3]);a.add('hex',[x,-.8-i%3,z],[13,.2,13],'#997da6')}
      for(let i=0;i<11;i++)deck(-35+i*6,35+Math.sin(i*.7)*8,5,5,['#caac78','#648faa','#a173a0'][i%3]);break
    case 'Education':
      for(let i=0;i<7;i++){const z=-40+i*13;a.add('pillar',[-14,-2-i*.8,z],[26,3,13],i%2?'#617f85':'#495f79');a.box([-14,-.4-i*.8,z+11],[35,.2,1],'#d3bb8a')}
      WORK_SITES.forEach(([x,,z])=>island(x,z,13,'#567b7e'));island(0,0,17,'#6a8988');break
    case 'Health':
      a.add('orb',[0,-4,0],[66,3.4,56],'#205b68')
      for(let i=0;i<9;i++){const angle=i*2.4,r=i?18+i*4:0;a.add('orb',[Math.cos(angle)*r,-1.4,Math.sin(angle)*r],[20,2,17],i%2?'#668c7f':'#458777')}
      WORK_SITES.forEach(([x,,z])=>a.add('pillar',[x,-1.2,z],[13,2.4,13],'#5a8e81'))
      for(let i=0;i<5;i++)a.ring([8,-.3,-7],18+i*4,i%2?'#4a9eac':'#75bfb3',undefined,false);break
    case 'Creator':
      for(let i=0;i<9;i++){const x=(i%3-1)*29,z=(Math.floor(i/3)-1)*28;deck(x,z,28,18,['#746086','#436b81','#a07c79'][i%3]);a.box([x,-4,z],[25,.8,17],'#403a61',[.1,.35*(i%2),.1])}
      a.beam([-58,-5,-15],[40,-5,-45],2.5,'#c1a582');a.beam([-40,-7,-45],[52,-7,15],2,'#7e91b9');break
    case 'Robotics':
      deck(0,0,38,28,'#56656c')
      WORK_SITES.forEach(([x,,z])=>{deck(x,z,24,23,'#566877');for(let i=0;i<6;i++)a.box([x-10+i*4,-2,z],[1,4,23],'#7e93a2')})
      for(const side of [-1,1]){a.beam([side*16,-2,55],[side*16,-2,-65],1.4,'#a48763');a.beam([side*19,-4,55],[side*19,-4,-65],.8,'#869ba5')}
      for(let i=0;i<12;i++)a.box([0,-4,-54+i*9],[37,.6,2],'#394d60');break
    case 'Community':
      a.add('orb',[0,-6,0],[65,2,54],'#234f60');island(0,0,18,'#998d7c')
      WORK_SITES.forEach(([x,,z],i)=>{a.add('hex',[x,-2,z],[17,4,17],i%2?'#608f82':'#708393');a.add('hex',[x,-.2,z],[16,.4,16],'#89a398')})
      for(let i=0;i<8;i++){const a0=i*Math.PI/4; a.add('orb',[Math.cos(a0)*21,-.7,Math.sin(a0)*21],[8,1.2,6],'#55786c')}break
  }
  if(city!=='Graveyard') {
    // The approach differs in cross section and material; fixed top keeps camera routes legible.
    const mat=city==='Legend'?'#a4a69a':city==='Health'||city==='Community'?'#799f99':city==='Creator'?'#9582a8':'#668093'
    a.box([0,-.15,33],[city==='Legend'?9:5,.35,42],mat)
    for(const side of [-1,1])a.beam([side*2.7,.1,12],[side*2.7,.1,54],.08,p.secondary,true)
  }
  for(const [x,,z] of WORK_SITES){
    const bend:Vec=[x*.5,-.12,z*.3]
    a.beam([0,-.12,0],bend,3,city==='Legend'?'#a2a89f':'#70828c');a.beam(bend,[x,-.12,z],3,city==='Legend'?'#a2a89f':'#70828c')
    a.beam([0,.08,0],[bend[0],.08,bend[2]],.08,p.secondary,true)
  }
}
const CLUSTERS:Record<CityId,[number,number,number][]>={
 Graveyard:[[-54,-14,5],[-35,-59,4],[33,-60,3],[59,-24,3]],IdeaHub:[[-51,-35,5],[10,-60,4],[53,-37,3]],
 Legend:[[-47,-40,4],[0,-68,3],[50,-40,4]],Space:[[-60,-32,3],[12,-75,2],[58,-40,2]],
 AI:[[-48,-38,6],[-8,-63,5],[48,-40,5]],Gaming:[[-57,-22,4],[-16,-60,5],[47,-43,3]],
 Education:[[-50,-35,4],[-8,-65,3],[47,-43,3]],Health:[[-47,-26,3],[0,-54,4],[47,-25,3]],
 Creator:[[-54,-30,3],[-17,-63,4],[49,-44,3]],Robotics:[[-55,-36,5],[0,-60,4],[54,-42,4]],Community:[[-51,-24,4],[0,-55,4],[49,-25,4]],
}
export function skylinePlan(city:CityId,low:boolean) {
  return CLUSTERS[city].flatMap(([x,z,count],cluster)=>Array.from({length:low?Math.max(2,count-1):count},(_,i)=>{
    const n=cluster*11+i,j=seeded(city,n+502),spread=city==='AI'?8:12
    return {x:x+(i-(count-1)/2)*spread,z:z+(seeded(city,n+604)-.5)*15,h:(city==='Community'?5:city==='Legend'?15:10)+j*(city==='Community'?6:21),w:3+seeded(city,n+902)*3,variant:n}
  }))
}
