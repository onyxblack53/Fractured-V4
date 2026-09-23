// FRACTURED — flat-file Angel Knight animation renderer
// All 32 animation PNGs live beside index.html. No folders are required.

export const FRAME_FILES = {
  idle:    ["idle_0.png","idle_1.png","idle_2.png","idle_3.png"],
  walk:    ["run_0.png","run_1.png","run_2.png","run_3.png"],
  run:     ["run_0.png","run_1.png","run_2.png","run_3.png"],
  jump:    ["jump_0.png","jump_1.png","jump_2.png","jump_3.png"],
  fall:    ["jump_0.png","jump_1.png","jump_2.png","jump_3.png"],
  land:    ["idle_0.png","idle_1.png","idle_2.png","idle_3.png"],
  block:   ["block_0.png","block_1.png","block_2.png","block_3.png"],
  blockHit:["block_0.png","block_1.png","block_2.png","block_3.png"],
  dodge:   ["dodge_0.png","dodge_1.png","dodge_2.png","dodge_3.png"],
  heal:    ["idle_0.png","idle_1.png","idle_2.png","idle_3.png"],
  hit:     ["block_0.png","block_1.png","block_2.png","block_3.png"],
  death:   ["block_0.png","block_1.png","block_2.png","block_3.png"],
  attack1: ["attack1_0.png","attack1_1.png","attack1_2.png","attack1_3.png"],
  attack2: ["attack2_0.png","attack2_1.png","attack2_2.png","attack2_3.png"],
  attack3: ["attack3_0.png","attack3_1.png","attack3_2.png","attack3_3.png"]
};

export const ANIMS = {
  idle:{fps:5,loop:true}, walk:{fps:7,loop:true}, run:{fps:10,loop:true},
  jump:{fps:8,loop:false}, fall:{fps:7,loop:true}, land:{fps:8,loop:false},
  block:{fps:7,loop:true}, blockHit:{fps:11,loop:false}, dodge:{fps:13,loop:false},
  heal:{fps:5,loop:false}, hit:{fps:10,loop:false}, death:{fps:4,loop:false},
  attack1:{fps:11,loop:false}, attack2:{fps:12,loop:false}, attack3:{fps:12,loop:false}
};

export class AngelKnightRenderer {
  constructor(){
    this.images={};
    this.state="idle";
    this.frame=0;
    this.time=0;

    for(const [state,files] of Object.entries(FRAME_FILES)){
      this.images[state]=files.map(file=>{
        const img=new Image();
        img.src=`./${file}?v=2`;
        return img;
      });
    }
  }

  setState(next,force=false){
    if(!ANIMS[next]) next="idle";
    if(!force && next===this.state) return;
    this.state=next;
    this.frame=0;
    this.time=0;
  }

  update(dt,eventHandler){
    const cfg=ANIMS[this.state]||ANIMS.idle;
    const frames=this.images[this.state]||this.images.idle;
    this.time+=dt;
    const frameDuration=1/cfg.fps;

    while(this.time>=frameDuration){
      this.time-=frameDuration;
      this.frame++;

      if(this.frame>=frames.length){
        if(cfg.loop) this.frame=0;
        else {
          this.frame=frames.length-1;
          return "finished";
        }
      }

      if(this.state==="attack1"&&this.frame===2) eventHandler?.("hit",{damage:20});
      if(this.state==="attack2"&&this.frame===2) eventHandler?.("hit",{damage:25});
      if(this.state==="attack3"&&this.frame===2) eventHandler?.("hit",{damage:36});
      if(this.state==="dodge"&&this.frame===1) eventHandler?.("iframeOn",{});
      if(this.state==="dodge"&&this.frame===3) eventHandler?.("iframeOff",{});
      if(this.state==="heal"&&this.frame===2) eventHandler?.("heal",{});
    }
    return null;
  }

  draw(ctx,x,groundY,facing=1,size=190){
    const frames=this.images[this.state]||this.images.idle;
    const img=frames[Math.min(this.frame,frames.length-1)];
    if(!img?.complete||!img.naturalWidth) return;

    const aspect=img.naturalWidth/img.naturalHeight;
    const drawH=size;
    const drawW=size*aspect;
    const drawX=x-drawW/2;
    const drawY=groundY-drawH;

    ctx.save();
    if(facing<0){
      ctx.translate(x,0);
      ctx.scale(-1,1);
      ctx.translate(-x,0);
    }
    ctx.drawImage(img,drawX,drawY,drawW,drawH);
    ctx.restore();
  }
}
