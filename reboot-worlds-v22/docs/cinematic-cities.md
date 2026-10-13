# Cinematic cities

## Existing application

The newest checkout is `reboot-worlds-v22`. Entry: `src/main.tsx` → `App.tsx`; navigation is the Zustand `mode` in `stores/ui.ts`, not URL routing. Lockfile versions: React 18.3.1, Three 0.169.0, React Three Fiber 8.18.0, Drei 9.122.0. No rendering dependencies were added or replaced.

`AppShell.tsx` owns the sidebar/search/categories/achievements, top navigation, filters and Initialize. `CityVisualization.tsx` owns the original planet and project/statistics panels. Eight city components already existed, sharing `cities/cityKit.tsx`; the old city module recreated its canvas on selection and covered the entire intro with an opaque veil.

Initialize had no handler in the original application. The follow-up request now defines its behavior: the creation dialog saves through the existing project store, enters the selected city, and selects the resulting building. Signed-out visitors are directed to the existing authentication page.

## Reference compatibility (inspected 2026-10-10)

| Resource | License found | Stack | Use in this change |
| --- | --- | --- | --- |
| https://github.com/ryan-j-parker/r3f-portal | No license in repository metadata or root LICENSE | React 18, R3F 8.8.7, Three .145 | Studied time/color uniforms and luminous shader surface; original radial shader written locally, no code/assets copied |
| https://github.com/tiveor/city-simulator | MIT, Copyright 2026 tiveor | React 19, R3F 9, Three .183 | Deterministic layouts and skyline variation as design reference; retained local seeded generation and instancing |
| https://github.com/alwihar/cosmic-portfolio | No license in repository metadata or root LICENSE | React 19, R3F 9, Three .182, Rapier | Connected floating platforms and navigational landmarks as visual inspiration; no code/assets copied |
| https://github.com/pmndrs/react-three-fiber | MIT, Poimandres | Current main targets React 19 | Retained installed React-18-compatible R3F 8, using its existing Canvas/useFrame lifecycle |

Do not transplant these applications, upgrade to R3F 9 without React 19, or copy assets from the unlicensed references.

## Runtime

`CityWorldManager` owns one canvas across World, Worlds and destinations. Scenes load on demand. Store navigation follows idle → loading → departing → crossing → arriving → idle. Every async completion carries a journey ID; duplicates and stale completions are ignored. The destination scene replaces the source only under the crossing veil. Nominal animation time is 1.25s departure + .18s crossing + 1.2s arrival; initial chunk/shader compilation can extend loading/crossing. Escape/Cancel settles into the currently active world. Navigation to other modules invalidates the journey.

Reduced motion uses a short opacity transition and a stationary camera; idle rendering becomes demand-driven. Reduced effects caps DPR at 1, disables antialiasing and removes portal motes. Skyline buildings are instanced. Declarative geometry/material resources are owned by R3F and released when scenes unmount. WebGL failure retains city and project navigation in HTML.

## Local verification

Run `npm ci`, then `npm run build` from this directory. Normal development uses `npm run dev -- --host 0.0.0.0 --port 5173` with existing Firebase and Supabase environment variables.

The task sandbox has no provider configuration. Emulate v0.0.1 was inspected: it has no Firebase/Supabase services. Task-local read-only synthetic fixtures exercise the project read and selection flow only. Provider auth, the custom auth-callback edge function, and database writes are not verified by these fixtures.

## Files changed

- `App.tsx`, `main.tsx`: mount the shared world manager and honor system motion preferences.
- `components/shell/AppShell.tsx`, `stores/ui.ts`: route categories and top navigation through guarded travel, preserve search selection, and highlight cities.
- `modules/cityworld/CityWorldManager.tsx`, `CityWorldModule.tsx`: persistent canvas, lazy scenes, shared project/statistics HUD, error and WebGL fallbacks.
- `modules/cityworld/CityPortal.tsx`, `PortalTransition.tsx`, `WorldControls.tsx`, `hooks/useCityNavigation.ts`: shader/rings, camera choreography, keyboard/touch/mouse controls, async loading/cancellation.
- `modules/cityworld/cityRegistry.ts`, `cityScenes.ts`, `cities/*.tsx`: city metadata, palette/layout/camera configuration, lazy loader registry, shared architecture and resource cleanup.
- `modules/city/CityModule.tsx`, `CityVisualization.tsx`, `MiniatureWorlds.tsx`: export and reuse the existing planet, Worlds scene, project panel and statistics.
- `styles/globals.css`: HUD placement, responsive selectors, focus indicators and reduced-motion styles.
- `tests/city-navigation.test.mjs`: seven state tests covering state ordering, all city round trips, duplicate requests, cancellation, stale callbacks, World interruption destination resets and external-mode interruption metadata.
- `tests/city-layout.test.mjs`: two layout tests covering bounded unique centers and deterministic placement.
- `.gitignore`: exclude dependencies, build artifacts and local environment files.

## Initial portal verification results

- Verified Hub → AI → Hub before enabling the other seven loaders.
- All eight sidebar round trips passed in the shared browser, preserving the same canvas. Distinct city architecture was inspected in screenshots.
- Actual project-building clicks passed for all eight cities (Graveyard framing was adjusted and rechecked). HTML project selection and cross-city search also passed.
- Worlds → Gaming, World interruption, Escape cancellation, repeated requests, keyboard orbit and the original Network/Graveyard/Echo navigation passed.
- Reduced-motion tests observed stationary camera positions within departure and arrival phases. Touch navigation, project selection and return passed at 390×844 with no document overflow.
- Missing WebGL retained functional city/project navigation. Forced context loss during crossing cleared the glow and recovered to the project index.
- A deliberately aborted city-module request canceled safely; the explicit Reload control recovered the failed import. Browsers can cache failed module imports, so retry may require reload.
- Production TypeScript/Vite build passed. All nine tests passed: seven navigation-state tests and two layout tests. Normal browser checks captured no console/page errors; fault injection deliberately produced a failed network request.

Limitations: browser data was synthetic. Live Firebase authentication, Supabase writes and the auth-callback edge function were not tested. The cloud browser uses CPU SwiftShader: sampled full city journeys took about 4.3–5.3 seconds including scene preparation, despite ~2.6 seconds of configured flight animation. Desktop GPU frame rate and the end-to-end 2–3 second target need hardware verification. With one project per city, observed city rendering was 28–74 draw calls; large production datasets were not profiled.

Additional verification: HUD text and panel surfaces now capture clicks and wheel input; a long synthetic project description was touch-scrolled at 390px width without moving the camera. Spiral and grid layouts are bounded to the district; layout tests verify unique finite positions within ground/fog bounds for 1, 60, 100 and 500 projects, plus deterministic remounts. Run `node --test --test-concurrency=1 tests/city-*.test.mjs` to avoid competing Vite test WebSocket ports. Large-count GPU performance remains unprofiled.

Initial portal review history: findings were fixed across successive reviews: disabled-button cursor scope, World interruption, filtered statistics, stale destination metadata, external-mode interruption filters, panel pointer events unbounded spiral layouts, customization availability and test documentation. Customization is offered only in World Hub, where building meshes apply it. One intermediate attempt was interrupted and discarded. Six completed review passes reported nine minor findings in total, all resolved. The final pass reported zero findings.


## Living cities and creation follow-up

- `CityLife.tsx` adds inner and outer illuminated roads, an approach avenue, sidewalks, lamps, transit shelters, terraces, instanced residents and transit pods. NPCs follow local walking loops; they are ambient residents, not conversational agents. Reduced motion freezes their animation; reduced effects lowers their count. Graveyard stays sparsely populated.
- `cities/cityKit.tsx` now adds instanced window bands and roof structures to ambient buildings; AI reuses this shared skyline. The approach avenue is reserved from ambient tower placement.
- `WorldDialog.tsx`, `projects/CreateProjectDialog.tsx`, `BadgeGallery.tsx`, `AppShell.tsx` and styles add accessible native dialogs for creation and the badge collection. Escape in a dialog does not trigger world navigation. Native close events during a pending save reopen the dialog; failed saves retain the draft.
- `PlanetWorld.tsx` recreates the hub particle geometry when project count changes, avoiding unsupported GPU buffer resizing.
- Successful creation clears filters, enters the project's city and selects its building. Stage 1 is the starting size. Failed saves keep the form and do not add a building. The existing store writes the authenticated Firebase owner ID required by the existing Supabase RLS policy, with a 20-second request timeout.
- The gallery shows the existing eight project badges, earned counts and unlock descriptions across the world; it does not present global awards as personal account achievements. A named new project earns Founder automatically from the existing badge rules.
- `tests/project-creation.test.mjs` tests the store with mocked provider boundaries: guest rejection, owner field, successful insertion, Founder award, duplicate returned row, rejection/retry and network exceptions. Run `node --test --test-concurrency=1 tests/*.test.mjs` (13 tests across three files).

Live authentication and database persistence still require configured Firebase/Supabase services. Synthetic browser responses verify the UI/API boundary only. No replacement local database or authentication bypass is part of the application.

Follow-up verification: production build and all 13 tests passed. All eight city round trips and project-building clicks passed with no captured console errors. Mocked API browser checks exercised failed saves, retries, duplicate-submit protection, owner field, newly rendered/selected buildings from the hub and within a city, and the Founder badge. NPC animation, reduced-motion freeze, effects switching, and 390px touch/dialog/keyboard/focus behavior passed. Browser validation also found and fixed hub particle-buffer resizing and dialog focus restoration; review found and fixed overlapping mobile action buttons. Live provider persistence and ordinary desktop GPU performance remain unverified.


## Space, Robotics and Community

These sidebar categories originally only set filters and had no scene loaders. They now have dedicated lazy scenes and registry entries, bringing the destination count to 11. Space has a launch tower, landing pads and orbiting satellites; Robotics has an animated assembly arm and conveyor facilities; Community has a tiered forum pavilion, residential terraces and gardens. All reuse project towers, streets and residents through the existing manager. Their palette/layout/camera configurations are in `cityRegistry.ts`; `DistrictScene.tsx` shares infrastructure. The registry also supplies project-creation options and the Worlds destination selector. The Space and Robotics landmark animations respect reduced motion.

The scene loader map now statically satisfies every registered CityId. Navigation and bounded-layout regressions enumerate the registry, so new destinations enter coverage automatically. The other eight scenes and project data APIs are unchanged by this extension.
