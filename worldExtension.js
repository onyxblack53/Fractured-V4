// FRACTURED V4 v19 — original supplied panorama, uncropped, proportionate, shorter world.
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

    // A separate transparent viewport canvas: the source panorama is never
    // rescaled, cropped, mirrored, or redrawn by the animation layer.
    this.fx = document.createElement('canvas');
    this.fx.id = 'fractured-atmosphere';
    this.fx.setAttribute('aria-hidden', 'true');
    Object.assign(this.fx.style, {
      position:'absolute', left:'0', top:'0', zIndex:'1',
      pointerEvents:'none', display:'block', background:'transparent'
    });
    this.art.insertBefore(this.fx, this.art.querySelector('.world-grade'));
    this.fxCtx = this.fx.getContext('2d', {alpha:true});
    this.lastFxTime = -Infinity;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.bridgeFace = document.querySelector('#stone-bridge .bridge-face');
    this.bridgeLip = document.querySelector('#stone-bridge .bridge-lip');
    // V19: use the supplied gothic bridge photograph as the physical ground.
    // The top of the image is the walking surface at 75.5% viewport height.
    // Only the bridge section is extracted; the existing panorama stays intact.
    if (this.bridgeFace) Object.assign(this.bridgeFace.style, {
      inset: '0',
      backgroundImage: 'url(./fractured_bridge_v19.webp?v=19)',
      backgroundSize: 'auto 100%',
      backgroundRepeat: 'repeat-x',
      backgroundPosition: '0 0',
      filter: 'none',
      imageRendering: 'auto'
    });
    if (this.bridgeLip) this.bridgeLip.style.display = 'none';
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
    this.fxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.fx.width = Math.max(1, Math.round(this.viewportWidth * this.fxDpr));
    this.fx.height = Math.max(1, Math.round(sceneHeight * this.fxDpr));
    this.fx.style.width = `${this.viewportWidth}px`;
    this.fx.style.height = `${sceneHeight}px`;
    this.fxCtx.setTransform(this.fxDpr,0,0,this.fxDpr,0,0);
    this.sceneHeight = sceneHeight;
    this.imageWidth = imageWidth;
    this.imageLeft = (this.worldWidth - imageWidth)/2;
    this.setCamera(this.cameraX);
    this.lastFxTime = -Infinity;
  }

  setCamera(x) {
    const dpr = Math.max(1, devicePixelRatio || 1);
    const limit = Math.max(0, this.worldWidth - this.viewportWidth);
    this.cameraX = Math.round(clamp(x, 0, limit) * dpr) / dpr;
    this.track.style.transform = `translate3d(${-this.cameraX}px,0,0)`;
    // Scroll the bridge texture with the world, not with the player's viewport.
    if (this.bridgeFace) this.bridgeFace.style.backgroundPosition = `${-this.cameraX}px 0`;
    return this.cameraX;
  }

  follow(player) {
    return this.setCamera(player.x - this.viewportWidth * .36);
  }
}


// FX positions are in ORIGINAL image coordinates (1536 × 512).
// Every glow, fog bank, cloud, and tree tracks the image as the camera moves.
const ART_W = 1536, ART_H = 512;
const cloudBands = [
  [85, 66, 230, 30, .018, .14],
  [370, 118, 245, 38, -.012, .11],
  [690, 72, 200, 29, .015, .10],
  [1290, 128, 245, 35, -.017, .10],
  [1000, 205, 210, 25, .012, .07]
];
const fogBanks = [
  [80, 390, 245, 25, .019, .18],
  [380, 365, 270, 33, -.014, .14],
  [760, 385, 230, 30, .016, .16],
  [1150, 375, 300, 34, -.018, .16],
  [1480, 407, 220, 24, .013, .17]
];
function glow(ctx,x,y,rx,ry,r,g,b,alpha) {
  if(rx <= 0 || ry <= 0) return;
  ctx.save(); ctx.translate(x,y); ctx.scale(rx,ry);
  const grad=ctx.createRadialGradient(0,0,0,0,0,1);
  grad.addColorStop(0,`rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(.36,`rgba(${r},${g},${b},${alpha*.37})`);
  grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
function fir(ctx,x,y,height,opacity) {
  ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle='#080911';
  ctx.fillRect(x-height*.035,y-height*.88,height*.07,height*.88);
  for(let i=0;i<5;i++){
    const level=i/5, w=height*(.22-.15*level);
    const top=y-height*(.95-.16*i);
    ctx.beginPath();ctx.moveTo(x,top-height*.20);
    ctx.lineTo(x-w,top+height*.22);
    ctx.lineTo(x+w,top+height*.22);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
WorldExtension.prototype.render=function(now){
  if (!this.fxCtx || !this.art || !document.getElementById('game-shell')?.classList.contains('active')) return;
  if (document.hidden) return;
  const still=this.reducedMotion.matches;
  if(now-this.lastFxTime < (still ? 500 : 33)) return; // max ~30 fps on mobile
  this.lastFxTime=now;
  const c=this.fxCtx, h=this.sceneHeight, w=this.viewportWidth;
  const scale=h/ART_H, t=still ? 0 : now*.001;
  const sx=x=>this.imageLeft+x*scale-this.cameraX;
  const sy=y=>y*scale;
  c.clearRect(0,0,w,h);

  // Cloud shadows: faint, translucent bands, NOT a second scaled photograph.
  // Motion is in image coordinates and never affects moon or castle geometry.
  for(const [x,y,rx,ry,speed,alpha] of cloudBands){
    const drift=Math.sin(t*.12+x)*9 + t*speed*8;
    const px=sx(x+drift), py=sy(y+Math.sin(t*.21+x)*2);
    if(px+rx*scale<0||px-rx*scale>w)continue;
    glow(c,px,py,rx*scale,ry*scale,35,19,48,alpha);
  }

  // Blood Moon: glow around its perimeter, no transforms applied to the moon.
  const moonPulse=still ? 1 : 1+.10*Math.sin(t*1.05);
  glow(c,sx(480),sy(112),82*scale,82*scale,239,37,50,.15*moonPulse);
  glow(c,sx(480),sy(112),53*scale,53*scale,255,57,46,.045*moonPulse);

  // Purple portal: atmospheric aura and a narrow, oscillating vertical beam.
  const portalPulse=still ? 1 : 1+.18*Math.sin(t*1.65);
  const portalX=sx(1047), portalY=sy(74);
  glow(c,portalX,portalY,83*scale,50*scale,165,71,245,.19*portalPulse);
  const beam=c.createLinearGradient(portalX-11*scale,0,portalX+11*scale,0);
  beam.addColorStop(0,'rgba(165,73,255,0)');
  beam.addColorStop(.5,`rgba(202,132,255,${.18*portalPulse})`);
  beam.addColorStop(1,'rgba(165,73,255,0)');
  c.fillStyle=beam;
  c.fillRect(portalX-11*scale,portalY,22*scale,Math.max(0,sy(255)-portalY));
  glow(c,portalX,sy(246),42*scale,18*scale,190,95,255,.11*portalPulse);

  // Lake/valley fog: slowly moving translucent banks over existing details.
  for(const [x,y,rx,ry,speed,alpha] of fogBanks){
    const drift=still ? 0 : Math.sin(t*.17+x)*15+t*speed*8;
    const px=sx(x+drift);
    if(px+rx*scale<0||px-rx*scale>w)continue;
    glow(c,px,sy(y),rx*scale,ry*scale,167,146,186,alpha);
  }

  // Foreground silhouettes move a little faster than the background.
  // Their bases stay near the bridge; nothing blocks the sky or landmark.
  const nearOffset=this.cameraX*.10;
  const trees=[[40,25],[125,31],[210,22],[335,28],[575,24],
               [790,30],[920,23],[1140,27],[1365,29],[1490,24]];
  for(const [x,size] of trees){
    const px=sx(x)-nearOffset;
    if(px < -size*scale || px>w+size*scale)continue;
    fir(c,px,h-1,size*scale,.27);
  }
  // Small broken masonry at ground level, behind the player and bridge.
  for(const [x,sz] of [[165,16],[650,12],[1240,18],[1440,13]]){
    const px=sx(x)-nearOffset;
    if(px<-30||px>w+30)continue;
    c.save();c.globalAlpha=.30;c.fillStyle='#090910';
    c.fillRect(px,h-sz*scale,sz*.45*scale,sz*scale);
    c.fillRect(px-sz*.13*scale,h-sz*1.08*scale,sz*.7*scale,sz*.18*scale);
    c.restore();
  }
};
