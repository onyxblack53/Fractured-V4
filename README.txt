FRACTURED — S’var cathedral guide and door dialogue v70

INSTALL
Upload the four code files (index.html, main.js, svarNpc.js, svarConversation.js) and all 12 included walk/jump PNGs to your game repository root. Replace matching filenames. Keep your existing cower PNGs, portrait, CSS, and the rest of the game. This patch builds on v66–v68 and includes the smaller S’var and permanent prompt dismissal.

BEHAVIOR
S’var remains cowering until approached. Talking alone does not start movement: choose I’m ready to go. He walks right, waits when more than 210 world pixels ahead, jumps onto each rubble platform, jumps down, and stops 38 pixels before the cathedral entry trigger. The player still walks through the door to enter. S’var stays outside. Dialogue and menus pause his movement. You can tap him again when he is standing nearby; the dismissed overhead icon stays hidden.

CHECKS
Local simulations passed at three viewport sizes: all three rubble landings, no feet passing through solids, dialogue trigger, pauses, waiting, final stop, and repeated interactions. JavaScript syntax checked. Live deployment has not been tested.

AT THE DOOR
A separate Tap on S’var prompt appears when he arrives and you are nearby. Tap to hear about his escape from the castle through the cathedral and the portal with demons crawling out. This second prompt is saved as dismissed independently of the first. You can still tap S’var himself again. Clearing browser site data resets prompt dismissal.

This download contains the complete guide update; you do not need a separate v69 patch.
