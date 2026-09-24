// FRACTURED V4 — Blood Moon panorama background (v14)
// Uses the user-selected wide panorama as the active game background
// while preserving the 10-screen horizontal world and camera.
export const WORLD_SCREENS = 10;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const BACKGROUND_SRC = './fractured_bloodmoon_panorama.png?v=14';

export class WorldExtension {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.worldWidth = this.viewportWidth * WORLD_SCREENS;
    this.cameraX = 0;
    const art = document.getElementById('world-art');
    const original = document.getElementById('world-background');
    if (!art || !original) throw new Error('FRACTURED: missing #world-art or #world-background');

    // Force the active background to the new Blood Moon panorama.
    original.src = BACKGROUND_SRC;
    original.alt = 'FRACTURED Blood Moon panorama';

    const track = document.createElement('div');
    track.id = 'fractured-world-track';
    Object.assign(track.style, {
      position: 'absolute', left: '0', top: '0', height: '100%',
      pointerEvents: 'none', zIndex: '0', willChange: 'transform',
      overflow: 'hidden'
    });
    original.parentNode.insertBefore(track, original);
    track.appendChild(original);
    Object.assign(original.style, {
      display: 'block', position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%', objectFit: 'fill', objectPosition: 'center',
      transform: 'none', maxWidth: 'none', pointerEvents: 'none'
    });

    this.track = track;
    this.background = original;
    this.bridgeFace = document.querySelector('#stone-bridge .bridge-face');
    this.bridgeLip = document.querySelector('#stone-bridge .bridge-lip');
    this.resize();
  }

  resize() {
    this.viewportWidth = window.innerWidth;
    this.worldWidth = this.viewportWidth * WORLD_SCREENS;
    this.track.style.width = `${this.worldWidth}px`;
    this.setCamera(this.cameraX);
  }

  setCamera(x) {
    this.cameraX = clamp(x, 0, Math.max(0, this.worldWidth - this.viewportWidth));
    this.track.style.transform = `translate3d(${-this.cameraX}px,0,0)`;
    if (this.bridgeFace) this.bridgeFace.style.backgroundPosition = `0 0, 0 0, ${-this.cameraX}px 0`;
    if (this.bridgeLip) this.bridgeLip.style.backgroundPositionX = `${-this.cameraX}px`;
    return this.cameraX;
  }

  follow(player) {
    return this.setCamera(player.x - this.viewportWidth * .36);
  }
}
