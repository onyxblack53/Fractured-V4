const ROOT="./assets/angel_frames";
export const ANIMS={
  idle:{dir:"idle",frames:4,fps:5,loop:true},walk:{dir:"run",frames:4,fps:7,loop:true},run:{dir:"run",frames:4,fps:10,loop:true},
  jump:{dir:"jump",frames:4,fps:8,loop:false},fall:{dir:"jump",frames:4,fps:7,loop:true},land:{dir:"idle",frames:4,fps:8,loop:false},
  block:{dir:"block",frames:4,fps:7,loop:true},blockHit:{dir:"block",frames:4,fps:11,loop:false},dodge:{dir:"dodge",frames:4,fps:13,loop:false},
  heal:{dir:"idle",frames:4,fps:5,loop:false},hit:{dir:"block",frames:4,fps:10,loop:false},death:{dir:"block",frames:4,fps:4,loop:false},
  attack1:{dir:"attack1",frames:4,fps:11,loop:false},attack2:{dir:"attack2",frames:4,fps:12,loop:false},attack3:{dir:"attack3",frames:4,fps:12,loop:false}
};
const url=(dir,i)=>`${ROOT}/${dir}/${i}.png?v=1`;
export class AngelKnightRenderer{
  constructor(){this.images={};this.state="idle";this.frame=0;this.time=0;for(const [state,cfg] of Object.entries(ANIMS)){this.images[state]=[];for(let i=0;i<cfg.frames;i++){const img=new Image();img.src=url(cfg.dir,i);this.images[state].push(img)}}}
  setState(next,force=false){if(!ANIMS[next])next="idle";if(!force&&next===this.state)return;this.state=next;this.frame=0;this.time=0}
  update(dt,eventHandler){const cfg=ANIMS[this.state]||ANIMS.idle;this.time+=dt;const fd=1/cfg.fps;while(this.time>=fd){this.time-=fd;this.frame++;if(this.frame>=cfg.frames){if(cfg.loop)this.frame=0;else{this.frame=cfg.frames-1;return "finished"}}if(this.state==="attack1"&&this.frame===2)eventHandler?.("hit",{damage:20});if(this.state==="attack2"&&this.frame===2)eventHandler?.("hit",{damage:25});if(this.state==="attack3"&&this.frame===2)eventHandler?.("hit",{damage:36});if(this.state==="dodge"&&this.frame===1)eventHandler?.("iframeOn",{});if(this.state==="dodge"&&this.frame===3)eventHandler?.("iframeOff",{});if(this.state==="heal"&&this.frame===2)eventHandler?.("heal",{})}return null}
  draw(ctx,x,groundY,facing=1,size=190){const frames=this.images[this.state]||this.images.idle;const img=frames[Math.min(this.frame,frames.length-1)];if(!img?.complete||!img.naturalWidth)return;const drawX=x-size/2,drawY=groundY-size;ctx.save();if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0)}ctx.drawImage(img,drawX,drawY,size,size);ctx.restore()}
}
