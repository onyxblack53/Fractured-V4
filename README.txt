FRACTURED — ANGEL KNIGHT ABILITY ASSETS

Three transparent four-frame sprite sheets, plus four individual PNG frames per ability.
Use abilities.json for ownership, slots, and gameplay metadata.
These are asset/config files, not an automatic patch for the game.
In the game's inventory and cast checks, require ownerClass === 'angel_knight'.
Do not register these abilities for demonic_rogue.

Animations are four-frame concept sprites. Equal-width individual crops are provided
for convenience; for effects extending across a frame boundary, use/rework the full
sheet and separate the effect into a VFX layer if needed.
