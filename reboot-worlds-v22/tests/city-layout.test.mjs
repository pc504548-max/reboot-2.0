import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
let server, makeTowerDNA, CITIES
before(async()=>{
  server=await createServer({server:{middlewareMode:true},appType:'custom'})
  ;({makeTowerDNA}=await server.ssrLoadModule('/src/modules/cityworld/cities/cityKit.tsx'))
  ;({CITIES}=await server.ssrLoadModule('/src/modules/cityworld/cityRegistry.ts'))
})
after(async()=>{await server?.close()})
test('growing project sets stay on the ground and inside the arrival fog range',()=>{
  for(const category of Object.keys(CITIES).filter(category => category !== 'AI')) {
    for(const total of [1,60,100,500]) {
      const positions=new Set()
      for(let index=0;index<total;index++) {
        const tower=makeTowerDNA({id:`fixture-${index}`,category,stage:3},index,total)
        assert.ok(tower.pos.every(Number.isFinite))
        assert.ok(Math.abs(tower.pos[0])+tower.width/2<160,category+' ground X')
        assert.ok(Math.abs(tower.pos[2])+tower.width/2<160,category+' ground Z')
        const camera=CITIES[category].overview
        const distance=Math.hypot(tower.pos[0]-camera[0],tower.height/2-camera[1],tower.pos[2]-camera[2])
        assert.ok(distance<CITIES[category].environment.fogFar-10,`${category} project ${index} hidden by fog`)
        positions.add(tower.pos.map(v=>v.toFixed(3)).join(','))
      }
      assert.equal(positions.size,total,category+' overlapping project centers')
    }
  }
})
test('project layout is deterministic across scene remounts',()=>{
  const project={id:'stable-project',category:'Creator',stage:4}
  assert.deepEqual(makeTowerDNA(project,70,100),makeTowerDNA(project,70,100))
})
