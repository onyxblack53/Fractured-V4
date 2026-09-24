# FRACTURED V4 — 10× Horizontal Map (v12)

This is a separate update based on the working V4 source. Beta 1 and all PNGs are unchanged.

## Replace/add in the repository ROOT
- Replace `main.js`
- Replace `player.js`
- Add `worldExtension.js`
- At the END of `index.html`, change only `./main.js?v=2` to `./main.js?v=12`.
  If yours already has another version, change just its version number to 12.

## Behavior
- Level width = 10 × the current viewport width.
- World-space player position is no longer clamped at the visible screen edge.
- Camera follows horizontally, constrained to the map ends.
- Ten alternating mirrored views of the current world image are laid out in one strip so tile edges match.
- Existing stone bridge stays at its exact original screen position; its texture scrolls.
- Canvas player drawing is camera-translated, but the HUD and buttons stay fixed.
- Existing idle sprite behavior, attacks, six repaired PNGs, menus, physics, and controls are untouched.
- No new artwork is claimed: this expands the existing scene by reusing it.

## Notes
This is a 10-screen-long exploration foundation rather than ten distinct handcrafted locations.
The scenery repeats mirrored; distinct backgrounds, enemies, landmarks and encounters can be added later.
Commit the three JS files and index.html version change together. Do not upload the ZIP as a repository file.
