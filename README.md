# Updated code + PNG swap package

This package replaces the 6 broken attack frames in code with the repaired PNGs.

## Replaced frames
- attack1_1.png -> repaired frontal slash frame
- attack1_2.png -> repaired frontal slash frame (second variant)
- attack2_1.png -> repaired horizontal ring slash
- attack2_2.png -> repaired horizontal ring slash (second variant)
- attack3_1.png -> repaired large grounded crescent slash
- attack3_2.png -> repaired airborne crescent slash

## Files to use
- `angelKnightAnimations.js`
- `angelKnightRenderer.js`
- `assets/angel-knight-fixed/*.png`

## Base path in code
The animation file expects the PNGs at:
`assets/angel-knight-fixed/`

## If you already use my earlier package
You can overwrite the old animation JS with this new one and swap the PNG folder to `assets/angel-knight-fixed/`.


## v3 idle stability fix
- Idle/body-locked states now anchor from the lower feet/body instead of the whole silhouette.
- This prevents changing wing shapes from shifting the entire knight.
- Added tiny per-idle-frame correction offsets after frame registration.
- The six repaired attack PNGs from v2 are unchanged.
