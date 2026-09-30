import {applyEnhancements,loadEnhancements} from "./enhancements-v74.js?v=74";
import {DemonicRogueRenderer} from "./demonicRogueRenderer-v75.js?v=75";
import { AngelKnightSpriteRenderer,SPRITE_ANIMS } from "./angelKnightSpriteRenderer-v75.js?v=75";

export class Player{
  constructor(x=300,y=500,build={}){
    this.origin=build.origin||'angelic-knight';
    this.x=x;
    this.y=y;
    this.groundY=y;
    this.obstacles=[];

    this.vx=0;
    this.vy=0;
    this.facing=1;

    this.speed=185;
    this.runSpeed=245;
    this.jumpPower=620;
    this.gravity=1750;

    this.onGround=true;
    this.dead=false;
    this.isBlocking=false;
    this.invulnerable=false;

    this.maxHp=100;
    this.hp=100;
    this.maxStamina=100;
    this.stamina=100;

    this.state="idle";
    this.comboStep=0;
    this.comboWindow=0;
    this.comboGrace=0;
    this.attackQueued=false;
    this.activeHitbox=null;
    this.abilityImpact=null;

    this.input={
      moveX:0,
      moveY:0,
      jump:false,
      attack:false,
      block:false,
      dodge:false,
      heal:false
    };

    this.renderer=build.origin==="demonic-rogue"?new DemonicRogueRenderer():new AngelKnightSpriteRenderer();
    if(this.origin==="demonic-rogue"){this.speed=195;this.runSpeed=255;}
    applyEnhancements(this,loadEnhancements(this.origin));
  }

  setState(next,force=false){
    if(this.state===next&&!force)return;
    this.activeHitbox=null;
    this.state=next;
    if(!next.startsWith('ability'))this.abilityImpact=null;
    this.renderer.setState(next,force);
  }

  handleAnimationEvent(name,frame){
    if(name==="iframeOn")this.invulnerable=true;
    if(name==="iframeOff")this.invulnerable=false;
    if(name==="heal")this.hp=Math.min(this.maxHp,this.hp+28);
    if(name==="hit")this.activeHitbox={...frame.hitbox,ttl:.09};
  }

  castAbility(index){
    if(this.origin!=='angelic-knight'||this.dead||!Number.isInteger(index)||index<0||index>2)return false;
    if(!this.onGround||!['idle','walk','run','block'].includes(this.state))return false;
    if(!this.renderer.images[`ability${index+1}`]?.every(img=>img.complete&&img.naturalWidth>0))return false;
    this.isBlocking=false;
    this.attackQueued=false;this.comboStep=0;this.comboGrace=0;
    for(const k of ['attack','jump','dodge','heal','block'])this.input[k]=false;
    this.vx=0;
    this.abilityImpact={index,triggered:false};
    this.setState(`ability${index+1}`,true);
    return true;
  }

  requestAttack(){
    if(this.dead||this.state.startsWith('ability')||this.stamina<8)return;

    if(this.state.startsWith("attack")){
      if(this.origin==='demonic-rogue'||this.comboWindow>0)this.attackQueued=true;
      return;
    }

    const followup=this.origin==='demonic-rogue'&&this.comboGrace>0&&this.comboStep>0&&this.comboStep<3;
    const step=followup?this.comboStep+1:1;
    this.stamina-=step===3?11:8;
    this.comboStep=step;
    this.comboWindow=.45;
    this.comboGrace=0;
    this.attackQueued=false;
    this.setState(`attack${step}`,true);
  }

  dodge(){
    if(this.dead||this.state.startsWith('ability')||this.stamina<20)return;
    this.stamina-=20;

    const dir=Math.abs(this.input.moveX)>.08?Math.sign(this.input.moveX):this.facing;
    this.facing=dir;
    this.vx=dir*470;
    this.setState("dodge",true);
  }

  heal(){
    if(this.dead||this.state.startsWith('ability')||this.hp>=this.maxHp||this.stamina<18)return;
    this.stamina-=18;
    this.setState("heal",true);
  }

  jump(){
    if(this.dead||this.state.startsWith('ability')||!this.onGround)return;
    this.onGround=false;
    this.vy=-this.jumpPower;
    this.setState("jump",true);
  }

  update(dt){
    this.stamina=Math.min(this.maxStamina,this.stamina+17*dt);
    if(this.comboWindow>0)this.comboWindow-=dt;
    if(this.comboGrace>0){
      this.comboGrace=Math.max(0,this.comboGrace-dt);
      if(this.comboGrace===0)this.comboStep=0;
    }

    if(this.activeHitbox){
      this.activeHitbox.ttl-=dt;
      if(this.activeHitbox.ttl<=0)this.activeHitbox=null;
    }

    const result=this.renderer.update(dt,(name,frame)=>this.handleAnimationEvent(name,frame));
    if(this.origin==='angelic-knight'&&this.abilityImpact&&!this.abilityImpact.triggered&&this.renderer.frame>=2){
      this.abilityImpact.triggered=true;
      this.onAbilityImpact?.(this.abilityImpact.index);
    }

    if(this.dead)return;

    if(result==="finished"){
      if(this.state==="attack1"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=2;
        this.comboWindow=.42;
        this.comboGrace=0;
        this.stamina=Math.max(0,this.stamina-8);
        this.setState("attack2",true);
      }else if(this.state==="attack2"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=3;
        this.comboWindow=.40;
        this.comboGrace=0;
        this.stamina=Math.max(0,this.stamina-11);
        this.setState("attack3",true);
      }else if(this.state==="jump"){
        this.setState("fall",true);
      }else if(["attack1","attack2","attack3","ability1","ability2","ability3","dodge","heal","blockHit","hit","land"].includes(this.state)){
        const completed=this.state;
        this.attackQueued=false;
        if(this.origin==='demonic-rogue'&&(completed==='attack1'||completed==='attack2'))this.comboGrace=.75;
        else{this.comboStep=0;this.comboGrace=0;}
        this.invulnerable=false;
        this.setState("idle",true);
      }
    }

    if(this.input.attack){this.input.attack=false;this.requestAttack()}
    if(this.input.dodge){this.input.dodge=false;this.dodge()}
    if(this.input.heal){this.input.heal=false;this.heal()}
    if(this.input.jump){this.input.jump=false;this.jump()}

    this.isBlocking=!this.state.startsWith('ability')&&!!this.input.block&&this.onGround&&!this.state.startsWith("attack")&&this.state!=="dodge";

    if(this.isBlocking){
      if(this.state!=="block")this.setState("block");
    }else if(this.state==="block"){
      this.setState("idle");
    }

    const locked=["attack1","attack2","attack3","ability1","ability2","ability3","dodge","heal","blockHit","hit","death"].includes(this.state);
    const mx=Math.max(-1,Math.min(1,this.input.moveX));

    if(!locked&&!this.isBlocking){
      if(Math.abs(mx)>.08){
        this.facing=Math.sign(mx);
        // A thumb near the run threshold moves slightly on every frame.
        // Give only the Rogue a wider gap before switching poses.
        const running=this.origin==='demonic-rogue'
          ? Math.abs(mx)>(this.state==='run'?.70:.86)
          : Math.abs(mx)>.78;
        const topSpeed=running?this.runSpeed:this.speed;
        const desired=mx*topSpeed;
        this.vx+=(desired-this.vx)*Math.min(1,14*dt);

        if(this.onGround){
          this.setState(running?"run":"walk");
        }
      }else{
        this.vx+=(0-this.vx)*Math.min(1,18*dt);

        // Snap tiny residual velocity to zero so the world position cannot
        // drift by sub-pixels while standing still.
        if(Math.abs(this.vx)<0.5)this.vx=0;

        if(this.onGround&&!["land"].includes(this.state))this.setState("idle");
      }
    }else if(this.state!=="dodge"){
      this.vx*=Math.max(0,1-5*dt);
      if(Math.abs(this.vx)<0.5)this.vx=0;
    }

    const previousX=this.x;
    this.x+=this.vx*dt;
    const radius=this.renderHeight*.14;
    for(const obstacle of this.obstacles){
      // Solid side until the character's feet clear the climbable top.
      if(this.y<=this.groundY-obstacle.h+3)continue;
      if(this.x+radius<=obstacle.x||this.x-radius>=obstacle.x+obstacle.w)continue;
      const left=obstacle.x-radius,right=obstacle.x+obstacle.w+radius;
      this.x=previousX<=left?left:previousX>=right?right:
        Math.abs(previousX-left)<Math.abs(previousX-right)?left:right;
      this.vx=0;
    }

    // Walking off an obstacle begins a real fall; standing on it permits jumping.
    if(this.onGround&&this.y<this.groundY-2&&!this.obstacles.some(o=>
      this.x>=o.x&&this.x<=o.x+o.w&&Math.abs(this.y-(this.groundY-o.h))<3)){
      this.onGround=false;this.vy=0;
    }
    if(!this.onGround){
      const previousY=this.y;
      this.vy+=this.gravity*dt;
      this.y+=this.vy*dt;
      if(this.vy>60&&!this.state.startsWith("attack")&&this.state!=="dodge")this.setState("fall");
      if(this.vy>=0){
        for(const obstacle of this.obstacles){
          const top=this.groundY-obstacle.h;
          if(this.x>=obstacle.x&&this.x<=obstacle.x+obstacle.w&&previousY<=top+2&&this.y>=top){
            this.y=top;this.vy=0;this.onGround=true;
            if(!locked)this.setState("land",true);
            break;
          }
        }
      }
      if(!this.onGround&&this.y>=this.groundY){
        this.y=this.groundY;this.vy=0;this.onGround=true;
        if(!locked)this.setState("land",true);
      }
    }

    const margin=45;
    const maxX=Math.max(margin,(this.worldWidth || window.innerWidth)-margin);
    this.x=Math.max(margin,Math.min(maxX,this.x));
  }

  get renderHeight(){
    const height=Math.max(145,Math.min(210,window.innerHeight*.17));
    // Knight PNGs have about 20% transparent padding; Rogue PNGs fill the frame.
    return this.origin==='demonic-rogue'?height*.80:height;
  }

  get hurtbox(){
    const h=this.renderHeight;
    return {x:this.x-h*.14,y:this.y-h*.62,w:h*.28,h:h*.60};
  }

  draw(ctx){
    this.renderer.draw(ctx,this.x,this.y,this.facing,this.renderHeight,this.onGround);
  }

  damage(amount,fromX=this.x){
    if(this.dead||this.invulnerable)return false;

    if(this.isBlocking){
      this.stamina=Math.max(0,this.stamina-12);
      this.setState("blockHit",true);
      return true;
    }

    this.hp=Math.max(0,this.hp-amount*(1-this.damageResistance));
    this.facing=fromX<this.x?-1:1;

    if(this.hp<=0){
      this.dead=true;
      this.vx=0;
      this.setState("death",true);
    }else{
      this.setState("hit",true);
    }

    return true;
  }

  getWorldHitbox(){
    const contactFrame=this.origin==='demonic-rogue'
      ? (this.state==='attack3' ? [2,4].includes(this.renderer.frame) : this.renderer.frame===3)
      : this.renderer.frame===2;
    if(!this.activeHitbox||!this.state.startsWith("attack")||!contactFrame)return null;
    const h=this.activeHitbox;
    // Weapon bounds use the same scale as the visible sprite.
    const scale=this.renderHeight/190;

    return{
      x:this.facing>0?this.x+h.x*scale:this.x-(h.x+h.w)*scale,
      y:this.y+h.y*scale,
      w:h.w*scale,
      h:h.h*scale,
      damage:h.damage*this.damageMultiplier,
      knockback:h.knockback
    };
  }
}
