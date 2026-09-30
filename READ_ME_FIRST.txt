Angel ability loading repair v74

Your recording shows "casting is not connected yet", which identifies the missing cast connection branch in the old menu-era code. It is not a PNG decoding error. The v73 bundle registers that connection on player creation; an older or mixed deployed build is a likely cause. The live repository has not been inspected.

INSTALL
1. Extract this ZIP.
2. Upload ALL included HTML, JS, CSS and PNG files into the game folder that already contains index.html. Do not upload the enclosing ZIP/folder.
3. Replace index.html when asked. This is essential: it now loads main-abilities-v74.js, rather than main.js.
4. Wait for GitHub Pages deployment to complete, then refresh/reopen the game.

The code modules have new filenames to prevent cached modules from being mixed with old ones. Leave the old files in place; this index does not load those older versions. All 12 ability frames are included. Existing S’var, world, intro, renderer and other art files are still required.

The buttons call the real player cast method directly. Enhancement menus and Roman numeral labels remain. Four frames per ability, single impact, interruption protection, missing-image guard and rogue rejection passed local tests. If the exact old "casting is not connected yet" message appears again, the page is still using an older index/build.

Enemy effects need registered enemies; the current world has none.
