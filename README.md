# FRACTURED V4 — active renderer/idle fix v6

The live V4 `player.js` uses **angelKnightSpriteRenderer.js**, not `renderer.js` or `angelKnightRenderer.js`.

## Replace these files in the repository root

1. `angelKnightSpriteRenderer.js` — now loads `./idle_0.png` and other `./attackN_i.png` root images, instead of nonexistent `./angel_frames/...` folders; static idle uses one frame.
2. `main.js` — uses the matching `menus.js` module and keeps the existing menu UI and game loop.
3. `player.js` — change its existing `angelKnightSpriteRenderer.js?v=8` import to `?v=9` (the supplied `apply_to_v4.py` does this).
4. `index.html` — change `main.js?v=2` to `main.js?v=9` (also handled by the patch script).

`apply_to_v4.py` should be run in a checkout of Fractured-V4 **after** copying the supplied `main.js` and `angelKnightSpriteRenderer.js` into it. No new PNGs are necessary. Keep all PNGs in the repository root exactly as they are.

**Beta 1 stays unchanged.** This patch is not yet deployed or browser-tested. It does not edit the GitHub repository directly.
