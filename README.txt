FRACTURED — S’var animated encounter v66

Extract this ZIP and upload its game files to the repository root, replacing files of the same name. This is a patch for your existing cathedral build (v59 or later), not a standalone game. Keep the existing player, world, cathedral, controls, and other assets.

S’var spawns 240 world pixels ahead of the player, cowering. Within 165 pixels he plays the six-frame stand-up sequence. Once standing and within 125 pixels, tap him or the Tap on S’var prompt to open his dialogue. Dialogue pauses gameplay. He stays standing after the first approach. Only the cower-to-stand frames are needed for this stationary encounter.

The goblin import, spawn, update, and rendering are absent from main.js. No goblin PNGs are included. To remove the old files physically from GitHub, delete the paths in REMOVE_OLD_GOBLIN_FILES.txt; uploading replacements cannot perform deletions.

Validation: JavaScript syntax checks and local mocked animation, pause, range, feet-pivot, dialogue, and completion tests passed. Not tested in the live deployed browser.
