// FRACTURED — Angel Knight Renderer
// Replacement renderer for 32 independent PNG frames.
//
// Main goals:
// 1. Load numbered PNGs safely.
// 2. Remove tiny isolated alpha fragments left by imperfect cutouts.
// 3. Normalize every frame around the visible character's foot/base anchor.
// 4. Keep idle/body-locked states visually planted.
// 5. Draw exactly ONE animation frame at a time.
//
// Usage example is at the bottom of this file.

import {
  ANGEL_KNIGHT_ANIMATIONS,
  ANGEL_KNIGHT_BASE_PATH,
  getAnimation,
  listAngelKnightFrames
} from "./angelKnightAnimations.js";

const DEFAULTS = {
  basePath: ANGEL_KNIGHT_BASE_PATH,

  // Screen-space character height. Width follows each cleaned frame's aspect ratio.
  drawHeight: 360,

  // Alpha preprocessing:
  alphaThreshold: 18,

  // Connected-component cleanup.
  // Very small disconnected islands are usually residue from neighboring cutouts.
  minComponentPixels: 22,

  // Components smaller than this fraction of the biggest component are removed
  // UNLESS they are close enough to the main body. This helps preserve swords,
  // wing tips and cloth while deleting tiny far-away debris.
  relativeComponentFloor: 0.0025,

  // Distance around the main component bounds in source pixels where smaller
  // components are allowed to survive.
  componentKeepPadding: 56,

  // Extra transparent padding retained around the cleaned art.
  cropPadding: 4,

  // When true, render diagnostics with drawDebug().
  debug: false
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load Angel Knight frame: ${src}`));
    img.src = src;
  });
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width | 0);
  canvas.height = Math.max(1, height | 0);
  return canvas;
}

function alphaBounds(data, width, height, threshold) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

function expandBounds(b, pad, width, height) {
  return {
    minX: Math.max(0, b.minX - pad),
    minY: Math.max(0, b.minY - pad),
    maxX: Math.min(width - 1, b.maxX + pad),
    maxY: Math.min(height - 1, b.maxY + pad)
  };
}

function boundsOverlapOrNear(a, b, padding) {
  return !(
    a.maxX + padding < b.minX ||
    b.maxX + padding < a.minX ||
    a.maxY + padding < b.minY ||
    b.maxY + padding < a.minY
  );
}

/*
  Finds opaque connected components using 8-way connectivity.

  Why:
  Bad PNG cutouts often contain a few disconnected pixels or a small fragment
  from the neighboring pose. Those fragments can look like "two frames
  overlapping" even though only one PNG is actually being drawn.
*/
function findComponents(imageData, threshold) {
  const { data, width, height } = imageData;
  const total = width * height;
  const visited = new Uint8Array(total);
  const components = [];

  const neighbors = [
    -1, 1, -width, width,
    -width - 1, -width + 1,
    width - 1, width + 1
  ];

  const opaque = (idx) => data[idx * 4 + 3] > threshold;

  for (let start = 0; start < total; start++) {
    if (visited[start] || !opaque(start)) continue;

    const stack = [start];
    visited[start] = 1;

    let count = 0;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    const pixels = [];

    while (stack.length) {
      const idx = stack.pop();
      const x = idx % width;
      const y = (idx / width) | 0;

      count++;
      pixels.push(idx);

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      for (const delta of neighbors) {
        const next = idx + delta;
        if (next < 0 || next >= total || visited[next]) continue;

        const nx = next % width;
        const ny = (next / width) | 0;

        // Prevent wrap-around across left/right edges.
        if (Math.abs(nx - x) > 1 || Math.abs(ny - y) > 1) continue;

        if (!opaque(next)) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    components.push({
      count,
      pixels,
      bounds: { minX, minY, maxX, maxY }
    });
  }

  components.sort((a, b) => b.count - a.count);
  return components;
}

function cleanAndCropImage(img, options) {
  const source = createCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sctx = source.getContext("2d", { willReadFrequently: true });
  sctx.clearRect(0, 0, source.width, source.height);
  sctx.drawImage(img, 0, 0);

  const imageData = sctx.getImageData(0, 0, source.width, source.height);
  const components = findComponents(imageData, options.alphaThreshold);

  if (!components.length) {
    return {
      canvas: source,
      anchorX: source.width / 2,
      anchorY: source.height,
      width: source.width,
      height: source.height,
      originalWidth: source.width,
      originalHeight: source.height,
      removedPixels: 0
    };
  }

  const main = components[0];
  const keep = [];
  let removedPixels = 0;

  for (const c of components) {
    const isLargeEnough =
      c.count >= options.minComponentPixels &&
      c.count >= main.count * options.relativeComponentFloor;

    const isNearMain = boundsOverlapOrNear(
      c.bounds,
      main.bounds,
      options.componentKeepPadding
    );

    if (c === main || isLargeEnough || isNearMain) {
      keep.push(c);
    } else {
      removedPixels += c.count;
      for (const idx of c.pixels) {
        imageData.data[idx * 4 + 3] = 0;
      }
    }
  }

  sctx.putImageData(imageData, 0, 0);

  const bounds = alphaBounds(
    imageData.data,
    source.width,
    source.height,
    options.alphaThreshold
  ) || main.bounds;

  const crop = expandBounds(
    bounds,
    options.cropPadding,
    source.width,
    source.height
  );

  const cropW = crop.maxX - crop.minX + 1;
  const cropH = crop.maxY - crop.minY + 1;

  const cleaned = createCanvas(cropW, cropH);
  const cctx = cleaned.getContext("2d");
  cctx.drawImage(
    source,
    crop.minX, crop.minY, cropW, cropH,
    0, 0, cropW, cropH
  );

  /*
    Stable anchor:
    - X = horizontal midpoint of the visible art near its base.
    - Y = bottom of visible alpha.

    Using the visible bottom edge prevents top/side canvas differences between
    PNGs from making the whole knight "boxer shuffle" during idle.
  */
  const anchorX = (bounds.minX + bounds.maxX) / 2 - crop.minX;
  const anchorY = bounds.maxY - crop.minY + 1;

  // Stable lower-body / foot anchor.
  // The old midpoint anchor included wings and large slash VFX, which made
  // the knight slide sideways when an idle wing changed shape.
  const visibleHeight = Math.max(1, bounds.maxY - bounds.minY + 1);
  const footBandTop = Math.max(bounds.minY, bounds.maxY - Math.round(visibleHeight * 0.12));
  const footXs = [];
  for (let y = footBandTop; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const a = imageData.data[(y * source.width + x) * 4 + 3];
      if (a > options.alphaThreshold) footXs.push(x);
    }
  }
  footXs.sort((a, b) => a - b);
  const footMedianX = footXs.length
    ? footXs[Math.floor(footXs.length / 2)]
    : (bounds.minX + bounds.maxX) / 2;
  const footAnchorX = footMedianX - crop.minX;
  const footAnchorY = anchorY;

  return {
    canvas: cleaned,
    anchorX,
    anchorY,
    footAnchorX,
    footAnchorY,
    width: cropW,
    height: cropH,
    originalWidth: source.width,
    originalHeight: source.height,
    removedPixels
  };
}

export class AngelKnightRenderer {
  constructor(options = {}) {
    this.options = { ...DEFAULTS, ...options };

    this.frames = new Map();
    this.loaded = false;
    this.loadErrors = [];

    this.animationName = "idle";
    this.animation = getAnimation("idle");
    this.frameIndex = 0;
    this.elapsed = 0;
    this.finished = false;

    this.flipX = false;

    // World/screen anchor where the knight's feet should stay planted.
    this.x = 0;
    this.y = 0;

    this.drawHeight = this.options.drawHeight;

    // Optional runtime offsets. Do not use these to create idle bobbing.
    this.offsetX = 0;
    this.offsetY = 0;

    // Smooth lock target used for body-locked animations such as idle/block.
    this.lockedX = null;
    this.lockedY = null;

    this.onAnimationFinished = null;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.lockedX == null) this.lockedX = x;
    if (this.lockedY == null) this.lockedY = y;
  }

  setScaleByHeight(height) {
    this.drawHeight = Math.max(1, height);
  }

  setFlipX(value) {
    this.flipX = !!value;
  }

  async loadAll() {
    this.frames.clear();
    this.loadErrors.length = 0;

    const ids = listAngelKnightFrames();

    await Promise.all(ids.map(async (id) => {
      const src = `${this.options.basePath}${id}.png`;

      try {
        const img = await loadImage(src);
        const prepared = cleanAndCropImage(img, this.options);
        this.frames.set(id, {
          id,
          src,
          ...prepared
        });
      } catch (error) {
        this.loadErrors.push({ id, src, error });
        console.error(error);
      }
    }));

    this.loaded = this.frames.size > 0;

    if (this.loadErrors.length) {
      console.warn(
        `[FRACTURED] Angel Knight loaded ${this.frames.size}/32 frames.`,
        this.loadErrors
      );
    } else {
      console.info("[FRACTURED] Angel Knight: all 32 frames loaded.");
    }

    return {
      loaded: this.frames.size,
      failed: this.loadErrors.length,
      errors: this.loadErrors
    };
  }

  setAnimation(name, restart = false) {
    if (!ANGEL_KNIGHT_ANIMATIONS[name]) name = "idle";

    if (!restart && name === this.animationName) return;

    this.animationName = name;
    this.animation = getAnimation(name);
    this.frameIndex = 0;
    this.elapsed = 0;
    this.finished = false;

    if (this.animation.lockBody) {
      this.lockedX = this.x;
      this.lockedY = this.y;
    } else {
      this.lockedX = null;
      this.lockedY = null;
    }
  }

  update(dtSeconds) {
    if (!this.loaded || !this.animation?.frames?.length) return;
    if (this.finished && this.animation.holdLastFrame) return;

    const frameDuration = 1 / Math.max(1, this.animation.fps || 1);
    this.elapsed += Math.max(0, dtSeconds || 0);

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex++;

      if (this.frameIndex >= this.animation.frames.length) {
        if (this.animation.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = this.animation.frames.length - 1;
          this.finished = true;

          const returnTo = this.animation.returnTo;
          const finishedName = this.animationName;

          if (typeof this.onAnimationFinished === "function") {
            this.onAnimationFinished(finishedName);
          }

          if (returnTo) {
            this.setAnimation(returnTo, true);
          }
          break;
        }
      }
    }
  }

  getCurrentFrameDefinition() {
    const frames = this.animation?.frames;
    if (!frames?.length) return null;
    return frames[Math.min(this.frameIndex, frames.length - 1)];
  }

  getCurrentPreparedFrame() {
    const def = this.getCurrentFrameDefinition();
    if (!def) return null;
    return this.frames.get(def.id) || null;
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    if (!ctx || !this.loaded) return;

    const def = this.getCurrentFrameDefinition();
    const frame = this.getCurrentPreparedFrame();
    if (!def || !frame) return;

    const bodyLocked = !!this.animation.lockBody;

    // During body-locked states, keep the feet at the exact same screen anchor.
    const worldX = bodyLocked && this.lockedX != null ? this.lockedX : this.x;
    const worldY = bodyLocked && this.lockedY != null ? this.lockedY : this.y;

    const scale = this.drawHeight / frame.height;
    const drawW = frame.width * scale;
    const drawH = frame.height * scale;

    // Body-locked animations (idle/block) use the lower-body anchor so wing
    // motion cannot pull the entire character left/right. Other animations
    // retain the normal visual-center anchor for broad action poses.
    const sourceAnchorX = bodyLocked && Number.isFinite(frame.footAnchorX)
      ? frame.footAnchorX
      : frame.anchorX;
    const sourceAnchorY = bodyLocked && Number.isFinite(frame.footAnchorY)
      ? frame.footAnchorY
      : frame.anchorY;
    const anchorX = sourceAnchorX * scale;
    const anchorY = sourceAnchorY * scale;

    const fx = (def.x || 0) + this.offsetX;
    const fy = (def.y || 0) + this.offsetY;

    const screenAnchorX = worldX - cameraX + fx;
    const screenAnchorY = worldY - cameraY + fy;

    ctx.save();

    if (!this.flipX) {
      const dx = screenAnchorX - anchorX;
      const dy = screenAnchorY - anchorY;
      ctx.drawImage(frame.canvas, dx, dy, drawW, drawH);
    } else {
      ctx.translate(screenAnchorX, 0);
      ctx.scale(-1, 1);

      const dx = -anchorX;
      const dy = screenAnchorY - anchorY;
      ctx.drawImage(frame.canvas, dx, dy, drawW, drawH);
    }

    ctx.restore();

    if (this.options.debug) {
      this.drawDebug(ctx, screenAnchorX, screenAnchorY, frame, scale);
    }
  }

  drawDebug(ctx, x, y, frame, scale) {
    ctx.save();
    ctx.lineWidth = 2;

    // Foot anchor cross.
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();

    const w = frame.width * scale;
    const h = frame.height * scale;
    const left = x - frame.anchorX * scale;
    const top = y - frame.anchorY * scale;

    ctx.strokeRect(left, top, w, h);

    ctx.font = "14px monospace";
    ctx.fillText(
      `${this.animationName} #${this.getCurrentFrameDefinition()?.id ?? "?"}`,
      left,
      top - 8
    );

    ctx.restore();
  }

  getDiagnostics() {
    return {
      loaded: this.frames.size,
      expected: 32,
      errors: [...this.loadErrors],
      animation: this.animationName,
      frameIndex: this.frameIndex,
      frameId: this.getCurrentFrameDefinition()?.id ?? null,
      cleanup: [...this.frames.values()].map(f => ({
        id: f.id,
        removedPixels: f.removedPixels,
        original: [f.originalWidth, f.originalHeight],
        cleaned: [f.width, f.height],
        anchor: [f.anchorX, f.anchorY]
      }))
    };
  }
}

/*
==============================================================
MINIMAL INTEGRATION EXAMPLE
==============================================================

import { AngelKnightRenderer } from "./angelKnightRenderer.js";

const knight = new AngelKnightRenderer({
  basePath: "assets/angel-knight/",
  drawHeight: 360,
  debug: false
});

await knight.loadAll();

knight.setPosition(player.x, player.y);
knight.setAnimation("idle");

let last = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Update the position BEFORE rendering.
  knight.setPosition(player.x, player.y);

  // Example state selection:
  if (player.attacking) knight.setAnimation("attack1");
  else if (player.blocking) knight.setAnimation("block");
  else if (!player.onGround && player.vy < 0) knight.setAnimation("jump");
  else if (!player.onGround && player.vy >= 0) knight.setAnimation("fall");
  else if (Math.abs(player.vx) > 0.1) knight.setAnimation("walk");
  else knight.setAnimation("idle");

  knight.setFlipX(player.facing === "left");

  knight.update(dt);

  // Draw your world/bridge/stone ground first.
  // Then draw the knight:
  knight.draw(ctx, camera.x, camera.y);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

==============================================================
*/
