import { test,before,after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
let server,graph,memory,pose,CITIES,discovery,awards
before(async()=>{
  server=await createServer({server:{middlewareMode:true},appType:'custom'})
  discovery=await server.ssrLoadModule('/src/lib/projectDiscovery.ts')
  awards=await server.ssrLoadModule('/src/types/project.ts')
  graph=await server.ssrLoadModule('/src/modules/shared/projectGraph.ts')
  memory=await server.ssrLoadModule('/src/modules/echo/echoData.ts')
  ;({residentPose:pose}=await server.ssrLoadModule('/src/modules/cityworld/CityLife.tsx'))
  ;({CITIES}=await server.ssrLoadModule('/src/modules/cityworld/cityRegistry.ts'))
})
after(async()=>server?.close())
const p=(id,connections=[])=>({id,name:id,category:'AI',connections,stage:1,description:'Recorded text',failureReason:null})
test('recorded edges preserve one-way links regardless of order; omit invented and invalid links',()=>{
  const all=[p('a'),p('b',['a','a','b','missing']),p('c')]
  assert.deepEqual(graph.documentedEdges(all),[[0,1]])
  assert.deepEqual(graph.documentedEdges([...all].reverse()),[[1,2]])
  assert.deepEqual(graph.relatedProjects(all[0],all).map(p=>p.id),['b'])
})
test('isolated nodes stay outside connected category constellations',()=>{
  const {nodes,edges}=graph.layoutNetwork([p('a',['b']),p('b'),p('c')])
  assert.equal(edges.length,1)
  assert.ok(Math.hypot(nodes[2].position[0],nodes[2].position[2])>Math.hypot(nodes[0].position[0],nodes[0].position[2]))
})
test('Echo only reports documented content and explicit missing fields',()=>{
  const project=p('example')
  assert.equal(memory.memoryText(project,'overview'),'Recorded text')
  for(const field of ['failure','lessons','revival'])assert.match(memory.memoryText(project,field),/No .* recorded/)
  const documented={...project,failureReason:'Owner archived it.',lessonsLearned:'Test offline first.',revivalRequirements:'A new maintainer.'}
  assert.equal(memory.memoryText(documented,'failure'),documented.failureReason)
  assert.equal(memory.memoryText(documented,'lessons'),documented.lessonsLearned)
  assert.equal(memory.memoryText(documented,'revival'),documented.revivalRequirements)
})
test('every city has bounded NPC work-site routes and multiple behavior states',()=>{
  for(const city of Object.keys(CITIES)) {
    const states=new Set()
    for(let i=0;i<36;i++) for(let t=0;t<60;t+=.5) {
      const point=pose(i,t,city)
      assert.ok([point.x,point.y,point.z,point.angle].every(Number.isFinite))
      assert.ok(Math.abs(point.x)<45&&Math.abs(point.z)<45)
      states.add(point.state)
    }
    for(const state of ['walking','turning','working','interacting','inspecting','idle'])assert.ok(states.has(state),city+': '+state)
  }
})

test('Zero Hub leaves category intact and graduates at exactly 100 recorded views',()=>{
 for(const views of [0,1,99])assert.equal(discovery.isZeroProject({...p('a'),viewCount:views}),true)
 for(const views of [100,101])assert.equal(discovery.isZeroProject({...p('a'),viewCount:views}),false)
 assert.equal(discovery.isZeroProject({...p('draft'),temporary:true,viewCount:100}),true)
 assert.equal(discovery.recordedViews({...p('bad'),viewCount:NaN}),0)
})
test('dense city rendering is bounded while keeping selected records visible',()=>{
 const projects=Array.from({length:10000},(_,i)=>p(String(i)))
 const result=discovery.sceneBuildings(projects,'9999')
 assert.equal(result.length,120);assert.equal(result[119].id,'9999');assert.equal(new Set(result.map(p=>p.id)).size,120)
})
test('new badges require recorded views or documented history, never guest activity',()=>{
 const project={...p('a'),createdAt:'2026-10-13',status:'alive',followers:0,momentum:0,founder:'',viewCount:99}
 assert.ok(awards.computeAwards(project).some(a=>a.type==='firstlook'));assert.ok(!awards.computeAwards(project).some(a=>a.type==='discovered'))
 assert.ok(awards.computeAwards({...project,viewCount:100}).some(a=>a.type==='discovered'))
 assert.ok(awards.computeAwards({...project,failureReason:'Documented',lessonsLearned:'Recorded'}).some(a=>a.type==='historian'))
 assert.deepEqual(awards.computeAwards({...project,temporary:true,viewCount:100}),[])
})
