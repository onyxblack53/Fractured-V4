FRACTURED actual idle fix v5

Root cause found in the live GitHub code:
player.js imports angelKnightSpriteRenderer.js, not angelKnightRenderer.js.

Changes:
1. angelKnightSpriteRenderer.js idle animation now uses ONLY idle/0.png.
2. Renderer update() freezes frame/time entirely while state === "idle".
3. player.js snaps residual horizontal velocity below 0.5 to exactly 0.
4. Cache-busting updated:
   main.js -> player.js?v=7
   player.js -> angelKnightSpriteRenderer.js?v=8
   sprite PNG URLs -> ?v=8

Replace these three files in the active build:
- main.js
- player.js
- angelKnightSpriteRenderer.js

All other gameplay and attack state logic remains unchanged.
