FRACTURED V4 — FULL IMAGE BACKGROUND FIX v17

Uses your exact latest panorama (1536 x 512 JPEG, 3:1). The included WebP is
an enhanced 3x raster of that same image, not replacement artwork. Source JPEG
is included as a backup. Upscaling reduces display softness but cannot create
fine detail that is not present in the source JPEG.

FIXES
- Full vertical composition displayed above the bridge: all sky and landscape
  image rows are included; no object-fit:cover or extra zoom.
- The moon and castle keep their proportions (fixed 3:1 aspect ratio).
- Shortens the map to the artwork's actual width (responsive ~3–5 screens on
  tall phones), eliminating empty filler, mirrored repeats and forced 10x zoom.
- Single continuous image avoids seams and overlapping tiles.
- Camera movement snaps to physical pixels to reduce subpixel blur.
- Existing player, sprites, combat, HUD, bridge and controls remain unchanged.

INSTALL IN THE ROOT OF YOUR Fractured-V4 REPOSITORY
1. Upload/replace main.js and worldExtension.js.
2. Upload fractured_world_v17.webp.
3. At the bottom of index.html set:
   <script type="module" src="./main.js?v=17"></script>
4. Commit and hard refresh GitHub Pages after deployment.
5. Keep all your existing sprites, player.js, controls.js and styles.css.
   The old v15/v16 background images can remain unused or be removed later.

NOTE: On a narrow portrait phone the whole 3:1 image cannot fit across the
screen at once without large empty bands. Its full HEIGHT is visible at once,
while the camera scrolls horizontally across the full WIDTH of the image.
The bridge and game UI still overlay their normal foreground regions.
