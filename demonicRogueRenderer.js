// Demonic Rogue animation frames. These filenames are unique in a flat upload.
const ART_VERSION='43';
const file=pose=>`./demonic-rogue-v43-${pose}.png?v=${ART_VERSION}`;
const ANIMS={
  idle:    {poses:['idle'],fps:1,loop:true},
  walk:    {poses:['walk','walk','walk','walk'],fps:7,loop:true},
  run:     {poses:['run','run','run','run'],fps:10,loop:true},
  jump:    {poses:['jump','jump','jump','jump'],fps:8,loop:false},
  fall:    {poses:['jump','jump','jump','jump'],fps:7,loop:true},
  land:    {poses:['walk'],fps:8,loop:false},
  block:   {poses:['block','block','block','block'],fps:7,loop:true},
  blockHit:{poses:['block','hurt','block','block'],fps:11,loop:false},
  dodge:   {poses:['walk','run','jump','run'],fps:13,loop:false},
  heal:    {poses:['idle','idle','idle','idle'],fps:5,loop:false},
  hit:     {poses:['hurt','hurt','hurt','walk'],fps:10,loop:false},
  death:   {poses:['hurt','death','death','death'],fps:4,loop:false},
  attack1: {poses:['idle','walk','attack1','walk'],fps:11,loop:false},
  attack2: {poses:['walk','block','attack2','walk'],fps:12,loop:false},
  attack3: {poses:['walk','jump','attack3','block'],fps:12,loop:false}
};
const HITS={
  attack1:{x:18,y:-95,w:72,h:55,damage:20,knockback:220},
  attack2:{x:12,y:-100,w:78,h:60,damage:25,knockback:260},
  attack3:{x:10,y:-150,w:70,h:135,damage:36,knockback:330}
};
export class DemonicRogueRenderer{
  constructor(){
    this.state='idle';this.frame=0;this.time=0;this.images={};
    for(const pose of new Set(Object.values(ANIMS).flatMap(a=>a.poses))){
      const image=new Image();
      image.onerror=()=>console.error(`[FRACTURED] Missing Demonic Rogue art: ${file(pose)}`);
      image.src=file(pose);this.images[pose]=image;
    }
  }
  setState(next,force=false){
    if(!ANIMS[next])next='idle';
    if(!force&&this.state===next)return;
    this.state=next;this.frame=0;this.time=0;
  }
  update(dt,eventHandler){
    const cfg=ANIMS[this.state];
    if(this.state==='idle'){this.frame=0;this.time=0;return null}
    this.time+=Math.max(0,dt||0);
    const frameDuration=1/cfg.fps;
    while(this.time>=frameDuration){
      this.time-=frameDuration;this.frame++;
      if(this.frame>=cfg.poses.length){
        if(cfg.loop)this.frame=0;
        else{this.frame=cfg.poses.length-1;this.time=0;return 'finished'}
      }
      if(this.frame===2&&HITS[this.state])eventHandler?.('hit',{hitbox:HITS[this.state]});
      if(this.state==='dodge'&&this.frame===1)eventHandler?.('iframeOn',{});
      if(this.state==='dodge'&&this.frame===3)eventHandler?.('iframeOff',{});
      if(this.state==='heal'&&this.frame===2)eventHandler?.('heal',{});
    }
    return null;
  }
  draw(ctx,x,y,facing=1,height=190,onGround=true){
    const cfg=ANIMS[this.state]||ANIMS.idle;
    const pose=cfg.poses[Math.min(this.frame,cfg.poses.length-1)];
    const image=this.images[pose];
    if(!image?.complete||!image.naturalWidth)return;
    const width=height*image.naturalWidth/image.naturalHeight;
    ctx.save();
    if(onGround){ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(x,y+1,31,4,0,0,Math.PI*2);ctx.fill()}
    if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0)}
    if(this.state==='death')ctx.globalAlpha=Math.max(.15,1-this.frame/4);
    else if(this.state==='dodge')ctx.globalAlpha=.8;
    // Smooth subpixel stride motion without swapping to a differently framed
    // illustration on each step. Keep the foot baseline fixed on the bridge.
    const moving=this.state==='walk'||this.state==='run';
    const phase=moving?(this.frame+this.time*cfg.fps)*Math.PI/2:0;
    const sway=moving?Math.sin(phase)*height*.006:0;
    const lift=moving?Math.abs(Math.sin(phase))*height*.004:0;
    ctx.drawImage(image,x-width/2+sway,y-height-lift,width,height);
    ctx.restore();
  }
}
