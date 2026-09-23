# FRACTURED — Option B Replacement

Replace your current files with:

- `angelKnightAnimations.js`
- `angelKnightRenderer.js`

## Important path setting

At the top of `angelKnightAnimations.js`:

```js
export const ANGEL_KNIGHT_BASE_PATH = "assets/angel-knight/";
```

If your numbered PNGs are beside `index.html`, change it to:

```js
export const ANGEL_KNIGHT_BASE_PATH = "./";
```

If they are in another folder, point it there.

## What this replacement fixes

1. Loads the 32 numbered PNGs directly.
2. Draws only one animation frame at a time.
3. Automatically removes tiny disconnected alpha fragments that commonly remain from neighboring cutouts.
4. Crops transparent dead space from each PNG.
5. Calculates a bottom-center visual anchor for every cleaned frame.
6. Keeps idle/block/heal body-locked to the exact same foot position.
7. Removes programmed idle bobbing entirely.
8. Supports horizontal flipping without shifting the player's anchor.
9. Includes diagnostics so bad frames can be identified quickly.

## If your frame order differs

Only edit the frame arrays in `angelKnightAnimations.js`.

The renderer itself should not need changes.

## Debug mode

Temporarily create the renderer with:

```js
const knight = new AngelKnightRenderer({
  basePath: "assets/angel-knight/",
  drawHeight: 360,
  debug: true
});
```

That draws the calculated anchor and frame bounds.

You can also run:

```js
console.table(knight.getDiagnostics().cleanup);
```

to see which PNGs had pixels automatically removed.
