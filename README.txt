FRACTURED V4 — Gothic bridge ground v19

Upload the three files in this package to the ROOT of your Fractured-V4 GitHub repository:
  fractured_bridge_v19.webp (NEW)
  worldExtension.js (REPLACE)
  main.js (REPLACE)

Then in index.html change ONLY the final script tag from
  <script type="module" src="./main.js?v=2"></script>
to
  <script type="module" src="./main.js?v=19"></script>
This avoids a stale mobile browser cache.

What changed:
- Extracted the gothic bridge's stone walking surface, arch and pillars from the supplied photo.
- Replaced only the synthetic CSS bridge face at 75.5% screen height.
- Kept the player collision/feet at the existing ground ratio; no player or controls changes.
- Bridge texture scrolls with the camera; the existing original panoramic sky, moon, castle,
  atmospheric FX, sprite animations, menus, and controls are untouched.
- No original background or sprite asset needs deleting.

IMPORTANT: This is a repeated structural bridge section so it can cover the scrolling map.
The underlying source image is a portrait image, not a new hand-painted full-width bridge.
Repeating arches are intentional; the sky and distant landmarks are NOT mirrored/repeated.

Backup: keep your existing files before replacing them. Upload the image before the JS files.
