// FRACTURED Angel Knight frame renderer v8
const FRAME_ROOT="./angel_frames";

export const SPRITE_ANIMS={
  // IMPORTANT: true static idle.
  // The game was previously cycling 4 different full-body PNGs at 5 FPS,
  // which made the knight visibly shift even with zero input.
  idle:{dir:"idle",frames:1,fps:1,loop:true},

  walk:{dir:"run",frames:4,fps:7,loop:true},
  run:{dir:"run",frames:4,fps:10,loop:true},
  jump:{dir:"jump",frames:4,fps:8,loop:false},
  fall:{dir:"jump",frames:4,fps:7,loop:true},
  land:{dir:"idle",frames:4,fps:8,loop:false},
  block:{dir:"block",frames:4,fps:7,loop:true},
  blockHit:{dir:"block",frames:4,fps:11,loop:false},
  dodge:{dir:"dodge",frames:4,fps:13,loop:false},
  heal:{dir:"idle",frames:4,fps:5,loop:false},
  hit:{dir:"block",frames:4,fps:10,loop:false},
  death:{dir:"block",frames:4,fps:4,loop:false},
  attack1:{dir:"attack1",frames:4,fps:11,loop:false},
  attack2:{dir:"attack2",frames:4,fps:12,loop:false},
  attack3:{dir:"attack3",frames:4,fps:12,loop:false}
};

const frameUrl=(dir,i)=>`${FRAME_ROOT}/${dir}/${i}.png?v=8`;

export class AngelKnightSpriteRenderer{
  constructor(){
    this.images={};
    this.state="idle";
    this.frame=0;
    this.time=0;

    for(const [state,cfg] of Object.entries(SPRITE_ANIMS)){
      this.images[state]=[];
      for(let i=0;i<cfg.frames;i++){
        const img=new Image();
        img.src=frameUrl(cfg.dir,i);
        this.images[state].push(img);
      }
    }
  }

  setState(next,force=false){
    if(!SPRITE_ANIMS[next])next="idle";
    if(!force&&this.state===next)return;

    this.state=next;
    this.frame=0;
    this.time=0;
  }

  update(dt,eventHandler){
    const cfg=SPRITE_ANIMS[this.state]||SPRITE_ANIMS.idle;

    // Static idle: no frame timer advancement at all.
    if(this.state==="idle"){
      this.frame=0;
      this.time=0;
      return null;
    }

    this.time+=dt;
    const fd=1/cfg.fps;

    while(this.time>=fd){
      this.time-=fd;
      this.frame++;

      if(this.frame>=cfg.frames){
        if(cfg.loop){
          this.frame=0;
        }else{
          this.frame=cfg.frames-1;
          return "finished";
        }
      }

      if(this.state==="attack1"&&this.frame===2)
        eventHandler?.("hit",{hitbox:{x:34,y:-92,w:118,h:76,damage:20,knockback:220}});

      if(this.state==="attack2"&&this.frame===2)
        eventHandler?.("hit",{hitbox:{x:28,y:-105,w:135,h:86,damage:25,knockback:260}});

      if(this.state==="attack3"&&this.frame===2)
        eventHandler?.("hit",{hitbox:{x:24,y:-118,w:155,h:100,damage:36,knockback:330}});

      if(this.state==="dodge"&&this.frame===1)
        eventHandler?.("iframeOn",{});

      if(this.state==="dodge"&&this.frame===3)
        eventHandler?.("iframeOff",{});

      if(this.state==="heal"&&this.frame===2)
        eventHandler?.("heal",{});
    }

    return null;
  }

  draw(ctx,x,groundY,facing=1,targetHeight=190){
    const frames=this.images[this.state]||this.images.idle;
    const img=frames[Math.min(this.frame,frames.length-1)];

    if(!img||!img.complete||!img.naturalWidth)return;

    const targetWidth=targetHeight;
    const drawX=x-targetWidth/2;
    const drawY=groundY-targetHeight;

    ctx.save();

    if(facing<0){
      ctx.translate(x,0);
      ctx.scale(-1,1);
      ctx.translate(-x,0);
    }

    ctx.drawImage(img,drawX,drawY,targetWidth,targetHeight);
    ctx.restore();
  }
}
