FRACTURED V4 — START SCREEN FIX v7

The live index.html still loads ./main.js?v=2. Old cached versions may try to
import nonexistent ./menu.js and leave START unresponsive.

Replace these repository-root files:
- main.js
- player.js
- angelKnightSpriteRenderer.js

Then change index.html at the bottom to:
<script type="module" src="./main.js?v=11"></script>

Alternatively run PATCH_INDEX.py in a local checkout. That also adds a red
startup-error message box in case another problem appears.

Commit all four file changes together, wait for GitHub Pages, and reload.
All images, repaired attack assets and Beta 1 remain unchanged.
This ZIP does not modify GitHub directly.
