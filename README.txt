FRACTURED V4 — ANIMATED ATMOSPHERE v18

Built directly on the working V17 full-image background. No sprite, combat,
HUD, controls, player physics, or bridge changes.

Effects:
- subtle drifting translucent fog in the valley
- gentle cloud-shadow motion (does not slide or crop the actual sky image)
- circular Blood Moon glow pulse
- purple portal aura, shimmer, and vertical beam
- lightly parallaxed foreground firs and ruined stone silhouettes

The ORIGINAL V17 image remains one continuous 3:1 panorama; no tiling, mirroring,
cover-cropping, zooming, or reshaping. Full sky height remains visible. Landscape
is explored horizontally, as before. Animations are rendered separately at up to
30fps, capped 1.5x pixel density, and respect reduced-motion settings.

INSTALL:
1. Upload/replace main.js and worldExtension.js in the repo root.
2. Keep/upload fractured_world_v17.webp in the repo root.
3. Update the final script tag in index.html to:
   <script type="module" src="./main.js?v=18"></script>
4. Commit and reload GitHub Pages after it deploys.
5. Keep all other V17 files unchanged.

Rollback: restore V17 main.js and worldExtension.js and main.js?v=17.
