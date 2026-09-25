FRACTURED V4 Ground Alignment v30

Cause: the v29 ground measurement used the bridge tile child top (-8px), but #stone-bridge clips those 8px. Thus the knight stood above the actual visible stone.

Replace main.js and index.html in the repository root. Other files are unchanged. The new ground reference uses the visible bridge container top + 2px. Sprite padding compensation remains in the existing renderer.

GitHub write permission was denied, so upload these two files manually and commit.
