# FRACTURED V4 — Blood Moon Background v14

This package swaps the game's current scenery to the new user-selected Blood Moon panorama while keeping the 10-screen-wide scrolling map.

## Included
- `main.js`
- `worldExtension.js`
- `fractured_bloodmoon_panorama.png`

## What changed
- The active game background is now forced to `fractured_bloodmoon_panorama.png`
- The map remains 10× wider than one screen
- The camera still follows the Angel Knight horizontally
- The bridge, player, controls, HUD, combat, and repaired attack PNGs are unchanged

## Install
1. In the Fractured-V4 repository root, replace `main.js` and `worldExtension.js` with the files in this package.
2. Add `fractured_bloodmoon_panorama.png` to the repository root.
3. Update the last script tag in `index.html` to:
   `<script type="module" src="./main.js?v=14"></script>`
4. Commit, wait for GitHub Pages to deploy, then refresh the site.

## Notes
This background is treated as the game's world backdrop image. If you later want the sky itself animated (drifting fog, pulsing moon glow, portal effects, parallax ruins, etc.), that can be added on top of this baseline.
