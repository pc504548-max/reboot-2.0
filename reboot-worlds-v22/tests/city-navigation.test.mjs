import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
let server, useUI, CITY_CATEGORIES
before(async () => {
  server = await createServer({server:{middlewareMode:true}, appType:'custom'})
  ;({useUI} = await server.ssrLoadModule('/src/stores/ui.ts'))
  ;({CITY_CATEGORIES} = await server.ssrLoadModule('/src/modules/cityworld/cityRegistry.ts'))
})
after(async () => { await server?.close() })
beforeEach(() => useUI.setState({mode:'city',cityCategory:null,destination:null,travelPhase:'idle',travelId:0,travelError:null,selectedProjectId:null,categoryFilter:null}))
test('all registered destinations complete and return through the same state machine', () => {
  for (const category of CITY_CATEGORIES) {
    useUI.getState().enterCity(category)
    let s = useUI.getState(), id = s.travelId
    assert.equal(s.cityCategory,null)
    assert.equal(s.categoryFilter,category)
    for (const phase of ['departing','crossing','arriving','idle']) useUI.getState().advanceTravel(id,phase)
    assert.equal(useUI.getState().cityCategory,category)
    useUI.getState().exitCity()
    id = useUI.getState().travelId
    for (const phase of ['departing','crossing','arriving','idle']) useUI.getState().advanceTravel(id,phase)
    assert.equal(useUI.getState().cityCategory,null)
    assert.equal(useUI.getState().mode,'city')
  }
})
test('duplicate requests, invalid categories and out-of-order completions are ignored', () => {
  useUI.getState().enterCity('Finance')
  assert.equal(useUI.getState().travelPhase,'idle')
  useUI.getState().enterCity('AI')
  const id=useUI.getState().travelId
  for(let i=0;i<20;i++) useUI.getState().enterCity('Gaming')
  useUI.getState().advanceTravel(id,'arriving')
  assert.equal(useUI.getState().travelPhase,'loading')
  assert.equal(useUI.getState().destination,'AI')
  assert.equal(useUI.getState().travelId,id)
})
test('cancellation invalidates async completions and restores the active category', () => {
  useUI.getState().enterCity('AI')
  const id=useUI.getState().travelId
  useUI.getState().cancelTravel()
  useUI.getState().advanceTravel(id,'departing')
  assert.equal(useUI.getState().travelPhase,'idle')
  assert.equal(useUI.getState().categoryFilter,null)
  useUI.getState().enterCity('Gaming')
  const next=useUI.getState().travelId
  useUI.getState().advanceTravel(next,'departing')
  useUI.getState().advanceTravel(next,'crossing')
  useUI.getState().cancelTravel()
  assert.equal(useUI.getState().cityCategory,'Gaming')
  assert.equal(useUI.getState().mode,'cityworld')
})
test('leaving for Echo invalidates the journey without a delayed redirect', () => {
  useUI.getState().enterCity('AI')
  const id=useUI.getState().travelId
  useUI.getState().setMode('echo')
  useUI.getState().advanceTravel(id,'departing')
  assert.equal(useUI.getState().mode,'echo')
  assert.equal(useUI.getState().travelPhase,'idle')
  assert.equal(useUI.getState().categoryFilter,null)
  assert.equal(useUI.getState().destination,null)
})
test('World cancels an active city journey and starts a guarded return', () => {
  useUI.setState({mode:'cityworld',cityCategory:'AI'})
  useUI.getState().enterCity('Gaming')
  const stale=useUI.getState().travelId
  useUI.getState().setMode('city')
  assert.equal(useUI.getState().destination,null)
  assert.equal(useUI.getState().travelPhase,'loading')
  useUI.getState().advanceTravel(stale,'departing')
  assert.equal(useUI.getState().travelPhase,'loading')
  const id=useUI.getState().travelId
  for(const phase of ['departing','crossing','arriving','idle'])useUI.getState().advanceTravel(id,phase)
  assert.equal(useUI.getState().mode,'city')
  assert.equal(useUI.getState().cityCategory,null)
})
test('World and Worlds reset stale destination metadata', () => {
  useUI.setState({mode:'cityworld',cityCategory:'Gaming',destination:'Gaming'})
  useUI.getState().setMode('echo')
  useUI.getState().setMode('city')
  assert.equal(useUI.getState().destination,null)
  useUI.getState().enterCity('Gaming')
  const stale=useUI.getState().travelId
  useUI.getState().setMode('worlds')
  useUI.getState().advanceTravel(stale,'departing')
  assert.equal(useUI.getState().destination,null)
  assert.equal(useUI.getState().cityCategory,null)
  assert.equal(useUI.getState().mode,'worlds')
  assert.equal(useUI.getState().travelPhase,'idle')
})

test('external modes restore active-city metadata at every interruption phase', () => {
  for (const mode of ['echo','network']) {
    for (const phase of ['loading','departing','crossing']) {
      useUI.setState({mode:'cityworld',cityCategory:'AI',categoryFilter:'AI',destination:'AI',travelPhase:'idle'})
      useUI.getState().enterCity('Gaming')
      const id=useUI.getState().travelId
      if (phase !== 'loading') useUI.getState().advanceTravel(id,'departing')
      if (phase === 'crossing') useUI.getState().advanceTravel(id,'crossing')
      const active=useUI.getState().cityCategory
      useUI.getState().setMode(mode)
      assert.equal(useUI.getState().categoryFilter,active)
      assert.equal(useUI.getState().destination,active)
      assert.equal(useUI.getState().mode,mode)
      assert.equal(useUI.getState().travelPhase,'idle')
    }
  }
})

test('separate planets and Zero Hub clear interrupted city metadata',()=>{
 for(const mode of ['graveyard','zero']){useUI.setState({mode:'cityworld',cityCategory:'AI',categoryFilter:'AI',destination:'AI',travelPhase:'departing'});useUI.getState().setMode(mode);assert.equal(useUI.getState().cityCategory,null);assert.equal(useUI.getState().destination,null);assert.equal(useUI.getState().travelPhase,'idle')}
})

test('Echo and Network retain the record being opened; new places clear it',()=>{
 for(const mode of ['echo','network']){useUI.setState({mode:'zero',travelPhase:'idle',selectedProjectId:'record'});useUI.getState().setMode(mode);assert.equal(useUI.getState().selectedProjectId,'record')}
 for(const mode of ['zero','beta','graveyard']){useUI.setState({mode:'echo',travelPhase:'idle',selectedProjectId:'record'});useUI.getState().setMode(mode);assert.equal(useUI.getState().selectedProjectId,null)}
})
