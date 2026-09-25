FRACTURED V4 - Ground alignment v29

Upload the four files in this ZIP to the ROOT of your existing GitHub repository, replacing the four files with the same names. Commit them together. Do not delete or replace any other files or image assets.

Changes:
- index.html loads main.js?v=29.
- main.js loads player.js?v=29 and measures the real top edge of the existing scrolling bridge strip for collision groundY (including its -8px CSS offset).
- player.js loads angelKnightSpriteRenderer.js?v=29.
- renderer aligns the visible feet to that ground by accounting for the idle sprite's 41 transparent bottom rows, rather than stacking arbitrary 4px/8px offsets.
- Existing bridge, background, camera, HUD, controls, animation assets and combat logic are unchanged.

After commit, reload the game (if needed, close and reopen the Safari tab).
