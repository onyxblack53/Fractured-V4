# Goblin visibility fix — v35

The main branch loaded v33 enemy code, which requested a missing `goblin/` directory. The knight's restored images were already correct.

This change supplies 36 existing NPC animation images in `assets/goblin-v35/` and loads them exclusively from that directory. Player sprite files are untouched. The goblin starts within the initial phone viewport and keeps its independent AI and collision spacing. It waits for valid images before updating or drawing, so a missing asset cannot create an invisible attacker. A failed load displays a reload message. Reaction poses reuse the idle images; defeat uses a fade-out.

Entry and character-renderer cache versions advance to 35 to replace stale modules and knight images. Background, bridge, camera, controls, and player physics are unchanged.

Validation: `node --test tests/goblin.test.mjs` passes five regression tests covering actual image paths/dimensions, separate artwork, NPC movement and pause, spacing, sword damage, enemy attacks, unloaded enemies, and defeat. Original source frames are retained, including any pre-existing crop imperfections.

Browser verification remains outstanding: the available Playwright installation had no browser, and its browser download failed. This change has not been merged or deployed. Check a phone after previewing or deploying the branch: start Angel/Knight, confirm both characters appear, move/attack/block/jump, open the character menu, and verify the full sky and bridge are preserved.
