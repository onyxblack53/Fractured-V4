// FRACTURED V4 — one prototype goblin. No changes to player movement or bridge.
// All positions are WORLD coordinates. y and groundY are the bridge walking plane.
const ANIMS = {
  idle: [4,3,true], walk:[6,8,true], run:[8,12,true],
  attack1:[5,11,false], attack2:[3,9,false], block:[3,7,true],
  jump:[4,9,false], land:[3,10,false], hurt:[4,11,false], death:[5,7,false]
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// The two characters have separate bodies and sprite renderers. Their image
// rectangles are wider than their collision boxes, so prevent visual fusion.
const BODY_SPACING=138;
const ATTACK_RANGE=158;
const overlap=(a,b)=>a.x < b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
export class GoblinEnemy {
  constructor(x,groundY){
    this.x=x;this.y=groundY;this.groundY=groundY;this.homeX=x;
    this.vx=0;this.vy=0;this.facing=-1;this.hp=100;this.maxHp=100;
    this.state='idle';this.frame=0;this.elapsed=0;this.onGround=true;
    this.dead=false;this.attackCooldown=1.2;this.decision=1.1;this.jumpCooldown=3;
    this.attackConnected=false;this.lastPlayerHitbox=null;this.hitFlash=0;
    this.images={};
    for(const [name,[count]] of Object.entries(ANIMS)){
      this.images[name]=Array.from({length:count},(_,i)=>{
        const img=new Image();img.src=`./goblin/${name}_${i}.png?v=1`;
        img.onerror=()=>console.warn(`Missing goblin sprite: ${name}_${i}.png`);
        return img;
      });
    }
  }
  setState(state,force=false){
    if(!ANIMS[state])state='idle';
    if(!force&&state===this.state)return;
    this.state=state;this.frame=0;this.elapsed=0;
    if(state==='attack1'||state==='attack2')this.attackConnected=false;
  }
  get hurtbox(){return {x:this.x-29,y:this.y-77,w:58,h:75};}
  takeHit(player){
    // Each player hitbox object is generated once per swing by Player.handleAnimationEvent.
    const source=player.activeHitbox;
    if(!source||source===this.lastPlayerHitbox||this.dead)return;
    const hit=player.getWorldHitbox();
    if(!hit||!overlap(hit,this.hurtbox))return;
    this.lastPlayerHitbox=source;
    const blocking=this.state==='block' && (player.x-this.x)*this.facing>0;
    this.hp=Math.max(0,this.hp-Math.max(1,Math.round(hit.damage*(blocking?.25:1))));
    this.hitFlash=.13;
    if(this.hp===0){this.dead=true;this.vx=0;this.setState('death',true);}
    else if(!blocking){this.vx=player.facing*Math.min(100,hit.knockback*.25);this.setState('hurt',true);}
  }
  update(dt,player,worldWidth,paused=false){
    if(paused)return;
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);
    this.hitFlash=Math.max(0,this.hitFlash-dt);
    this.takeHit(player);
    const [count,fps,loop]=ANIMS[this.state];
    this.elapsed+=dt;
    while(this.elapsed>=1/fps){
      this.elapsed-=1/fps;this.frame++;
      if(this.frame>=count){
        if(loop)this.frame=0;
        else{
          this.frame=count-1;
          if(this.state==='death')return;
          if(this.state==='jump')this.setState('idle');
          else if(this.state==='land'||this.state==='hurt'||this.state.startsWith('attack'))this.setState('idle');
          break;
        }
      }
      if(this.state.startsWith('attack')&&this.frame===2&&!this.attackConnected){
        this.attackConnected=true;
        const reach=ATTACK_RANGE;
        const dx=player.x-this.x;
        if(!player.dead&&Math.abs(dx)<reach && Math.abs(player.y-this.y)<76 && dx*this.facing>0){
          player.damage(this.state==='attack2'?14:10,this.x);
        }
      }
    }
    if(this.dead)return;
    const dx=player.x-this.x, dist=Math.abs(dx);
    const busy=['attack1','attack2','hurt','land'].includes(this.state);
    const chasing=dist<330&&!player.dead;
    if(!busy){
      if(chasing){
        this.facing=dx>=0?1:-1;
        // Defensive block when a sword swing is approaching.
        if(dist<ATTACK_RANGE&&player.state.startsWith('attack')&&this.state!=='block'&&Math.random()<dt*2.8){
          this.setState('block');this.decision=.45;
        }
        if(this.state==='block'){
          this.vx=0;this.decision-=dt;
          if(this.decision<=0)this.setState('idle');
        }else if(dist<=ATTACK_RANGE&&this.onGround&&this.attackCooldown===0){
          this.vx=0;this.setState(Math.random()<.4?'attack2':'attack1',true);
          this.attackCooldown=1.5+Math.random()*.45;
        }else if(dist>BODY_SPACING+3){
          this.vx=this.facing*(dist>210?126:64);
          if(this.onGround)this.setState(dist>210?'run':'walk');
          if(dist>125&&this.jumpCooldown===0&&this.onGround&&Math.random()<dt*.38){
            this.onGround=false;this.vy=-400;this.jumpCooldown=4.5;
            this.setState('jump',true);
          }
        }else{this.vx=0;if(this.onGround)this.setState('idle');}
      }else{
        this.decision-=dt;
        if(this.decision<=0){this.decision=.9+Math.random()*1.5;this.vx=Math.random()<.4?0:(Math.random()<.5?-42:42);}
        if(Math.abs(this.x-this.homeX)>95)this.vx=Math.sign(this.homeX-this.x)*42;
        if(this.vx!==0)this.facing=Math.sign(this.vx);
        if(this.onGround)this.setState(this.vx?'walk':'idle');
      }
    }else this.vx*=Math.max(0,1-9*dt);
    this.x=clamp(this.x+this.vx*dt,50,Math.max(50,worldWidth-50));
    // Body collision is resolved in WORLD coordinates, after both actors
    // update. The player remains controlled only by Player/bindControls.
    // Move the NPC out of the player's visual body, never the knight sprite.
    if(!this.dead && !player.dead && Math.abs(this.x-player.x)<BODY_SPACING){
      const side=this.x>=player.x?1:-1;
      let desired=player.x+side*BODY_SPACING;
      if(desired<50 || desired>worldWidth-50)
        desired=player.x-side*BODY_SPACING;
      this.x=clamp(desired,50,Math.max(50,worldWidth-50));
      this.vx=0;
    }
    if(!this.onGround){
      this.vy+=1450*dt;this.y+=this.vy*dt;
      if(this.y>=this.groundY){this.y=this.groundY;this.vy=0;this.onGround=true;this.setState('land',true);}
    }else this.y=this.groundY;
  }
  draw(ctx){
    const imgs=this.images[this.state],img=imgs?.[Math.min(this.frame,imgs.length-1)];
    ctx.save();
    if(!this.dead){
      // Small health bar above the goblin's head, max 100 HP.
      const w=58,barY=this.y-117;
      ctx.fillStyle='rgba(9,5,11,.86)';ctx.fillRect(this.x-w/2-2,barY-2,w+4,10);
      ctx.fillStyle='#572126';ctx.fillRect(this.x-w/2,barY,w,6);
      ctx.fillStyle=this.hp>30?'#bd3d45':'#e77835';ctx.fillRect(this.x-w/2,barY,w*this.hp/this.maxHp,6);
      ctx.strokeStyle='rgba(255,221,184,.65)';ctx.lineWidth=.7;ctx.strokeRect(this.x-w/2,barY,w,6);
    }
    if(img?.complete&&img.naturalWidth){
      const height=106,width=height*260/220;
      if(this.facing<0){ctx.translate(this.x,0);ctx.scale(-1,1);ctx.translate(-this.x,0);}
      if(this.hitFlash>0)ctx.globalAlpha=.68;
      // Asset frames have a common baseline at 208/220; +6px seats feet on stone.
      ctx.drawImage(img,this.x-width/2,this.y-height+6,width,height);
    }
    ctx.restore();
  }
}
