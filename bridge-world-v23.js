// Bridge strip spans the same world coordinates as the player and scenery.
// The previous pseudo-element inherited a viewport-positioned background and
// did not provide a reliably world-sized layer on iOS Safari.
const bridge = document.getElementById('stone-bridge');
if (bridge) {
  const strip = document.createElement('div');
  strip.id = 'fractured-bridge-world-v23';
  strip.setAttribute('aria-hidden','true');
  bridge.appendChild(strip);
  let oldWidth = -1, oldX = NaN;
  function sync() {
    const map = window.FRACTURED_MAP;
    const width = Math.max(bridge.clientWidth, Number(map?.worldWidth) || bridge.clientWidth);
    const x = Number(map?.cameraX) || 0;
    if (width !== oldWidth) { strip.style.width = `${width}px`; oldWidth = width; }
    if (x !== oldX) { strip.style.transform = `translate3d(${-x}px,0,0)`; oldX = x; }
    requestAnimationFrame(sync);
  }
  requestAnimationFrame(sync);
}
