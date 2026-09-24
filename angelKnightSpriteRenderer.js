// FRACTURED V4 — active flat-file Angel Knight renderer, v9.
// Images live next to index.html: idle_0.png, attack1_2.png, etc.
// This is the renderer imported by player.js.
const ASSET_VERSION = '11';
const files = (prefix, count=4) => Array.from({length:count}, (_,i)=>`${prefix}_${i}.png`);
export const SPRITE_ANIMS = {
  idle:     {files:['idle_0.png'],fps:1,loop:true},
  walk:     {files:files('run'),fps:7,loop:true},
  run:      {files:files('run'),fps:10,loop:true},
  jump:     {files:files('jump'),fps:8,loop:false},
  fall:     {files:files('jump'),fps:7,loop:true},
  land:     {files:['idle_0.png'],fps:8,loop:false},
  block:    {files:files('block'),fps:7,loop:true},
  blockHit: {files:files('block'),fps:11,loop:false},
  dodge:    {files:files('dodge'),fps:13,loop:false},
  heal:     {files:files('idle'),fps:5,loop:false},
  hit:      {files:files('block'),fps:10,loop:false},
  death:    {files:files('block'),fps:4,loop:false},
  attack1:  {files:files('attack1'),fps:11,loop:false},
  attack2:  {files:files('attack2'),fps:12,loop:false},
  attack3:  {files:files('attack3'),fps:12,loop:false}
};
export class AngelKnightSpriteRenderer {
  constructor(){
    this.images = {};
    this.state = 'idle';
    this.frame = 0;
    this.time = 0;
    // Deduplicate identical image loads across states, while keeping a separate
    // frame array for every animation state.
    const imageCache = new Map();
    for (const [state, cfg] of Object.entries(SPRITE_ANIMS)) {
      this.images[state] = cfg.files.map(file => {
        if (!imageCache.has(file)) {
          const img = new Image();
          img.onerror = () => console.error(`[FRACTURED V4] Missing animation asset: ${file}`);
          img.src = `./${file}?v=${ASSET_VERSION}`;
          imageCache.set(file, img);
        }
        return imageCache.get(file);
      });
    }
  }
  setState(next, force=false){
    if (!SPRITE_ANIMS[next]) next = 'idle';
    if (!force && this.state === next) return;
    this.state = next;
    this.frame = 0;
    this.time = 0;
  }
  update(dt, eventHandler){
    const cfg = SPRITE_ANIMS[this.state] || SPRITE_ANIMS.idle;
    // With no input, always draw precisely one identical PNG; no frame cycling.
    if (this.state === 'idle') {
      this.frame = 0;
      this.time = 0;
      return null;
    }
    this.time += Math.max(0, dt || 0);
    const fd = 1 / cfg.fps;
    while (this.time >= fd) {
      this.time -= fd;
      this.frame++;
      if (this.frame >= cfg.files.length) {
        if (cfg.loop) this.frame = 0;
        else {
          this.frame = cfg.files.length - 1;
          this.time = 0;
          return 'finished';
        }
      }
      if (this.state==='attack1' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:34,y:-92,w:118,h:76,damage:20,knockback:220}});
      if (this.state==='attack2' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:28,y:-105,w:135,h:86,damage:25,knockback:260}});
      if (this.state==='attack3' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:24,y:-118,w:155,h:100,damage:36,knockback:330}});
      if (this.state==='dodge' && this.frame===1) eventHandler?.('iframeOn',{});
      if (this.state==='dodge' && this.frame===3) eventHandler?.('iframeOff',{});
      if (this.state==='heal' && this.frame===2) eventHandler?.('heal',{});
    }
    return null;
  }
  draw(ctx,x,groundY,facing=1,targetHeight=190){
    const frames = this.images[this.state] || this.images.idle;
    const img = frames[Math.min(this.frame,frames.length-1)];
    if (!img || !img.complete || !img.naturalWidth) return;
    // Preserve the previous V4 scale/placement behavior; only source paths change.
    const width=targetHeight, left=x-width/2, top=groundY-targetHeight;
    ctx.save();
    if (facing<0) { ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0); }
    ctx.drawImage(img,left,top,width,targetHeight);
    ctx.restore();
  }
}
