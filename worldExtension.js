// FRACTURED V4 v17 — original supplied panorama, uncropped, proportionate, shorter world.
// The source is 3:1. The entire image fits above the bridge; the camera scrolls
// across its natural width instead of stretching it to an arbitrary 10-screen map.
export const WORLD_SCREENS = 4; // nominal mobile length; actual width is responsive.
const ASPECT = 3;
const GROUND_RATIO = .755; // matches main.js and #stone-bridge in styles.css
const BACKGROUND_SRC = './fractured_world_v17.webp?v=17';
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export class WorldExtension {
  constructor() {
    this.viewportWidth = innerWidth;
    this.worldWidth = innerWidth;
    this.cameraX = 0;
    this.art = document.getElementById('world-art');
    this.background = document.getElementById('world-background');
    if (!this.art || !this.background) {
      throw new Error('FRACTURED: missing #world-art or #world-background');
    }

    const track = document.createElement('div');
    track.id = 'fractured-world-track';
    Object.assign(track.style, {
      position: 'absolute', left: '0', top: '0', zIndex: '0',
      overflow: 'hidden', pointerEvents: 'none', willChange: 'transform',
      background: '#100816'
    });
    this.background.parentNode.insertBefore(track, this.background);
    track.appendChild(this.background);
    this.track = track;

    this.background.src = BACKGROUND_SRC;
    this.background.alt = '';
    this.background.draggable = false;
    this.background.decoding = 'async';
    // Override v15's CSS cover + scale(1.01) so no rows are cropped.
    Object.assign(this.background.style, {
      position: 'absolute', inset: 'auto', top: '0', left: '0',
      display: 'block', maxWidth: 'none', objectFit: 'contain',
      objectPosition: 'left top', transform: 'none',
      imageRendering: 'auto', pointerEvents: 'none', userSelect: 'none'
    });

    this.bridgeFace = document.querySelector('#stone-bridge .bridge-face');
    this.bridgeLip = document.querySelector('#stone-bridge .bridge-lip');
    this.resize();
  }

  resize() {
    this.viewportWidth = innerWidth;
    const viewportHeight = this.art.getBoundingClientRect().height || innerHeight;
    const sceneHeight = viewportHeight * GROUND_RATIO;
    const imageWidth = sceneHeight * ASPECT;
    // No fabricated extra map: on phones the world is approximately 3–5 screens.
    // For wider desktop windows, center the entire image without stretching it.
    this.worldWidth = Math.max(this.viewportWidth, imageWidth);
    Object.assign(this.track.style, {
      width: `${this.worldWidth}px`, height: `${sceneHeight}px`
    });
    Object.assign(this.background.style, {
      width: `${imageWidth}px`, height: `${sceneHeight}px`,
      left: `${(this.worldWidth - imageWidth) / 2}px`
    });
    this.setCamera(this.cameraX);
  }

  setCamera(x) {
    const dpr = Math.max(1, devicePixelRatio || 1);
    const limit = Math.max(0, this.worldWidth - this.viewportWidth);
    this.cameraX = Math.round(clamp(x, 0, limit) * dpr) / dpr;
    this.track.style.transform = `translate3d(${-this.cameraX}px,0,0)`;
    if (this.bridgeFace) this.bridgeFace.style.backgroundPosition = `0 0, 0 0, ${-this.cameraX}px 0`;
    if (this.bridgeLip) this.bridgeLip.style.backgroundPositionX = `${-this.cameraX}px`;
    return this.cameraX;
  }

  follow(player) {
    return this.setCamera(player.x - this.viewportWidth * .36);
  }
}
