FRACTURED — Character enhancements and ability slots v71

INSTALL
Upload all seven game files from this ZIP to the repository root, replacing matching filenames: index.html, main.js, player.js, menus.js, enhancements.js, abilityLoadout.js, enhancements.css. No new PNGs are needed. Keep all existing character renderers, PNGs, S’var files, cathedral files, and other game dependencies. Based on the v70 guide build and player v54.

CHARACTER TAB
Both characters have five circular enhancement slots above the preview: Power, Ward, Vitality, Endurance, Haste. Each opens a compact filtered picker with two starter enhancements. Equip or remove one per slot. Actual damage, resistance, maximum health/stamina, and movement bonuses are connected to Player. Equipping does not refill health/stamina. Character appearance stays the same.

Three circular ability slots sit directly beneath the character preview. Select or swap abilities through the compact picker. Angel abilities are Celestial Light, Halo Bolt, and Wing Burst, taken from the supplied angel ability configuration. These cannot be equipped by the demonic rogue; its ability inventory is empty pending its own abilities. Selected names and cooldown durations feed the gameplay buttons. Loadouts save separately by character in this browser. Clearing site data resets them.

ABILITY CASTING STATUS
The separately supplied Fractured_Angel_Knight_Abilities.zip is artwork/config only; it does not contain executable casting code. This patch adds ability inventory and selection, not those combat effects or animations. Buttons report that casting is not connected and do not spend a cooldown until a cast handler exists. Future casting integrates through window.FRACTURED.castAbility(abilityId, player), returning false to decline a cast.

VALIDATION
JavaScript syntax, DOM wiring, menu interaction mocks, filtered inventories, swaps, class restrictions, storage, repeated equipping, stat removal, and real Player damage/resistance hooks passed local checks. Not visually tested in the live mobile browser.
