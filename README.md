# FRACTURED V4 — Background Clarity Fix v15

This update improves the background quality and corrects the moon distortion.

## What changed
- switched from the smaller panorama to the higher-resolution `blood_moon_over_the_gothic_valley.png`
- preserved the artwork aspect ratio using `object-fit: cover` instead of `fill`
- adjusted vertical framing so the scene sits naturally behind the bridge and UI
- kept the 10-screen scrolling world, player, HUD, controls, and combat unchanged

## Included
- `main.js`
- `worldExtension.js`
- `fractured_bloodmoon_panorama_hd.png`

## Install
1. Replace `main.js` and `worldExtension.js` in the repository root.
2. Add `fractured_bloodmoon_panorama_hd.png` to the repository root.
3. Update the last script tag in `index.html` to:
   `<script type="module" src="./main.js?v=15"></script>`
4. Commit, wait for GitHub Pages, and refresh.
