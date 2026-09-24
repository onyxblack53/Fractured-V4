# FRACTURED — Idle Static Fix v4

This version fixes the remaining standing-still movement seen in the latest recording.

## Change
Idle no longer cycles through four separate full-body PNGs.

When the player is not moving, the renderer now holds:
- `idle_0.png`

This guarantees that the knight's body, feet, shield, sword, halo, and wings do not shift while no controls are pressed.

## Unchanged
- Run
- Jump
- Dodge
- Block
- Attack 1
- Attack 2
- Attack 3
- All six previously repaired attack PNGs

This is built on top of the prior idle-stability package.
