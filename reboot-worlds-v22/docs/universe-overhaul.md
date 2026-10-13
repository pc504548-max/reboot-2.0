# Reboot universe implementation

## Scope and integration

The active application is **reboot-worlds-v22**. Earlier version directories remain untouched.
The existing React 18 / React Three Fiber 8 / Three .169 stack, Zustand project store,
lazy destination registry, shared world canvas, portal state machine, World Hub,
project details, initialization dialog, badges and Return to World Hub remain in use.
No rendering dependency or external model was added.

Audit found 11 registered destinations: AI, Gaming, Education, Health, Creator
(Creative), IdeaHub (Revival), Graveyard, Legend (Success), Space, Robotics and
Community. Echo and Network are separate application modes. The separate legacy
Graveyard *project archive* tab is retained as well as the Graveyard destination.

## Scene structure

- environment/ScenePrimitives.tsx: instance batches by primitive/material, instance
  colors, bounds and shared motion/effects context.
- environment/CityEnvironment.tsx: terrain, approach bridge, branching paths,
  four work sites, city-specific background architecture and foreground equipment.
- environment/Landmarks.tsx: all 11 main landmarks, mechanical and restoration
  motion, botanical structures and geometric intelligence core.
- environment/BlackHole.tsx: actual 3D void, layered bent-light ring silhouette
  and curved infall. Geometric approximation, not a relativistic lensing shader.
- environment/CityActivity.tsx: data cargo, repair components, arena sequences,
  floating books, garden water, workshop parts and exploratory craft.
- CityLife.tsx: 36 fictional inhabitants (14 in Graveyard); 16/6 with reduced
  effects. Up to 12 actively follow lanes; others work or gather. Distance and
  quality throttle matrix updates; system reduced motion freezes animation.
- cities/DistrictScene.tsx: shared infrastructure plus live project buildings.
  Existing destination modules remain lazy entry points into upgraded scenes.
- environment/cityDesign.ts and ViewpointCamera.tsx: stories and entrance, path,
  landmark, skyline and activity views. User orbit cancels a viewpoint movement;
  travel continues through the existing manager.

The main footprint is approximately 160 scene units across. At roughly four
metres per scene unit this is a compact 640 m composition, not a measured walking
simulation. NPCs use separate lanes around work sites, without a navigation mesh
or physics engine. Background geometry is instanced and culled in batches rather
than individual distance-based LOD models. No audio system was present; no audio
assets were added.

## Destinations

| Destination | Main landmark | Architecture and activity |
| --- | --- | --- |
| Graveyard | Forgotten Archive | Torn vault, exposed frames, fractured land, frozen cranes, keepers and black hole |
| Revival | Second Chance Engine | Old foundations, scaffolds, new structural plates and cargo repair cycle |
| Success | Legacy Spire | Open tapering monument, suspended terraces, gold lighting and garden stewards |
| AI | Intelligence Core | Machine towers, spherical chamber, neural core and data couriers |
| Gaming | Infinite Arcade | Strategy, fantasy and racing decks; scripted arena lights |
| Education | Knowledge Tree | Branching sculpture, layered libraries, study terraces and floating books |
| Health | Regeneration Garden | Conservatory, organic buildings, canopy and suspended water |
| Creative | Imagination Engine | Asymmetric studios, rearranging fragments and workshop sprites |
| Space | Cosmic Observatory | Orbital rings, asteroid platforms, telescope, solar wings and slow craft |
| Robotics | Forge Core | Machinery, industrial frames, assembly arms, conveyors and inspection crews |
| Community | Common Ground | Open mixed-roof pavilion, neighborhood islands, gardens and gatherings |

## Data honesty

Only CityTower maps actual project stage/status to a building. Environmental
repairs, NPCs, arena lights and monuments are fictional scenery and do not
indicate user activity, achievements, medical treatment or platform statistics.

Echo's prior generated financial numbers, inferred launch/funding histories,
AI scores and diagnoses were removed. The Memory Core uses actual title,
category, description, status, founder, update date and abandonment reason.
Optional lessons_learned and revival_requirements are read when returned by the
provider. Missing fields explicitly say they are not recorded. The 20261013000000 migration adds these optional columns; the creation dialog
lets builders record them. See accounts-and-guests.md for the follow-up deployment requirements.

Network deduplicates documented edges, accepts either endpoint's link, and ignores
missing IDs/self-links. Category placement is visual organization, not a relation.
Founder markers are per-record attributions: the schema has no stable creator
identity or membership table, so matching display names are not merged into
presumed identities. Community projects use clusters. Empty constellations and
memory fragments are labeled placeholders.

Search, filtering, node selection, related-record navigation and full project
details use real IDs. The app has no URL router for project pages; Network opens
the existing detail view rather than fabricating a permalink.

## Running and validation

From this directory:

    npm ci
    npm run dev -- --host 0.0.0.0 --port 5173
    npm run build
    node --test --test-concurrency=1 tests/*.test.mjs

Firebase/Supabase variables are required for live data/authentication.
The task preview uses ignored local configuration and VITE_LOCAL_PREVIEW=true
to skip remote reads and real sign-in while supporting temporary guest projects. Emulate v0.0.1 has no Firebase/Supabase service.
Live authentication and persistence require a configured provider environment.

Four added tests cover one-way/duplicate/dangling edges, isolated record
placement, truthful missing fields and bounded NPC states. Existing navigation,
layout and creation tests remain. Browser verification captures five views per
destination in shared Chromium. See the task validation record and generated
report for observed results; screenshots alone are not performance measurements.
