FRACTURED — Merged angel ability repair v73

INSTALL
Extract this ZIP and upload ALL files except this README to the GitHub game repository root (the same folder as index.html). Replace matching filenames. Do not put them inside an extra folder. Keep the remaining existing game files. This patch combines the v71 character menu, v72 Roman labels, and the other chat’s ability integration. No earlier ability ZIP needs to be uploaded again.

CAUSE
The first angel ZIP was art/config only. The later integrated ZIP added player.castAbility and renderer states, but the character-menu patch used a different window.FRACTURED.castAbility contract and replaced the player with a version without ability states. Mixing those patches disconnects the button-to-player-to-renderer chain. The PNG files themselves are valid.

REPAIR
The main module now connects selected ability IDs to the actual player cast method, applies effects on the impact frame, and imports the ability-enabled renderer. All 12 individual transparent PNGs are included at exactly the root paths the renderer loads. Cache versions are updated. Input cannot interrupt an active cast. All frames must be loaded before a cast begins. Both enhancements and Roman numeral labels are preserved. Angel-only ownership remains enforced.

EFFECTS
Celestial Light: nearby enemy stun flag for 3.5s within 100 world pixels (the integration’s approximation of 10 feet). Halo Bolt: 24 damage to one enemy in the forward corridor. Wing Burst: 18 damage and knockback. Damage enhancements apply. The current main.js does not spawn enemies; effects use window.FRACTURED.enemies when an enemy system is added. That system must consume stunRemaining and velocity for stun/knockback movement.

CHECKS
All 12 PNGs decoded and inspected; each cast played four frames in local simulations; one impact per cast, input locks, missing-image guard, and rogue rejection passed. These are local checks, not a live-site verification.
