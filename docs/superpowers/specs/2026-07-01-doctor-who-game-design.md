# Doctor Who: Echoes of Time — Design Doc

**Date:** 2026-07-01 · **Status:** Approved-by-default (autonomous session; user gave full spec in request)
**Requirements from user:** Open-world exploration with a companion · NPC dialogue and logic · TARDIS travel · fight historic Doctor Who enemies · visually stunning, as realistic as possible — explicitly no "blob"/"sausage" characters.

## Approaches considered

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Three.js WebGL, single HTML file, all-procedural assets** | Runs by double-clicking; testable in this session; matches user's existing HTML/JS game projects; PBR + bloom + fog + night lighting gives a high visual ceiling with zero downloaded assets | Characters are stylized-realistic (detailed articulated humans), not photoreal mocap | ✅ **Chosen** |
| B. Unreal/Unity project | True AAA ceiling | Engines not installed; multi-GB setup; cannot be compiled or tested in this environment; user would see nothing today | ❌ |
| C. Babylon.js | Comparable to A | Weaker post-processing addon story; less familiarity | ❌ |

**Realism strategy (the "no sausages" contract):** 18-joint articulated humanoids at correct 7.5-head proportions — separate thighs/shins/feet, upper arms/forearms/hands with thumbs, real faces (whites + iris + pupil eyes, brows, nose, lips, ears, multiple hair styles, glasses/hats), layered clothing (coats with moving tails, collars, ties). Procedural walk/run/idle/talk animation with counter-swing, knee flexion, torso bob. Environmental realism carried by lighting: ACES filmic tonemapping, PCF soft shadows, per-zone fog and color scripts, UnrealBloomPass, emissive windows/lamps, rain/dust/star particles, wet-street speculars.

## Structure

- **Player:** The Doctor (third-person, long brown coat, sonic screwdriver). Health = regeneration energy; "death" = regeneration flash + respawn.
- **Companion:** Riley Vance (original character, 2020s Londoner) — follow AI, zone banter, quest reactions, enemy warnings ("Don't blink!").
- **TARDIS:** parked in every zone; walk in → full console room (hex console, animated time rotor, roundel walls). Console opens destination UI; lever + vortex transition.
- **Zones (5):** London 1963 night/rain (Autons in shop windows) · TARDIS interior (hub) · Skaro (Dalek patrols, petrified forest, city gate) · Moonbase 2070 (Cybermen marching, Earth in the sky, low gravity) · Wester Drumlins graveyard at dusk (Weeping Angels, quantum-locked: they only move when unobserved).
- **Enemies:** Daleks (patrol/alert/beam attacks, dome tracks player), Cybermen (relentless march, melee zap), Weeping Angels (frustum+LOS observation mechanic, teleport-touch), Autons (mannequins activate from shop windows, hand-guns).
- **Combat:** sonic screwdriver held-beam overloads enemies (no guns — it's the Doctor). Angels are immune; you must watch them.
- **Quests:** one per zone → 4 Time Fragments → finale at console. Branching NPC dialogue trees with flags/conditions/actions; NPC logic: wander/converse/flee states.
- **Systems:** synthesized WebAudio (sonic whine, Dalek zap + speech-synthesis "EXTERMINATE", TARDIS materialization, angel sting, footsteps, per-zone ambience), minimap, objective ribbon, localStorage save, quality settings.

## Technical

- Single deliverable `index.html` (built by concatenating `src/` parts) + README. Three.js 0.170 via jsdelivr importmap (internet needed on first load; run from `file://` or any static server).
- Source split: head.html, 00_core, 01_audio, 02_materials, 03_characters, 04_enemies, 05_props, 06_zones, 07_dialogue, 08_ui, 09_player, 10_game, tail.html → `build.ps1` concatenates.
- Per-zone analytic ground height + AABB/circle colliders; one shadow-casting directional light per zone; instanced/merged static geometry; scenes persist for instant travel.
- Debug API (`window.DW`) for automated screenshot verification via local server + preview browser.
- IP note: personal, non-commercial fan tribute; Doctor Who © BBC. Companion is an original character.
