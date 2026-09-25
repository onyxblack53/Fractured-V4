import { AngelKnightSpriteRenderer,SPRITE_ANIMS } from "./angelKnightSpriteRenderer.js?v=29";

export class Player{
  constructor(x=300,y=500){
    this.x=x;
    this.y=y;
    this.groundY=y;

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
    this.attackQueued=false;
    this.activeHitbox=null;

    this.input={
      moveX:0,
      moveY:0,
      jump:false,
      attack:false,
      block:false,
      dodge:false,
      heal:false
    };

    this.renderer=new AngelKnightSpriteRenderer();
  }

  setState(next,force=false){
    if(this.state===next&&!force)return;
    this.state=next;
    this.renderer.setState(next,force);
  }

  handleAnimationEvent(name,frame){
    if(name==="iframeOn")this.invulnerable=true;
    if(name==="iframeOff")this.invulnerable=false;
    if(name==="heal")this.hp=Math.min(this.maxHp,this.hp+28);
    if(name==="hit")this.activeHitbox={...frame.hitbox,ttl:.09};
  }

  requestAttack(){
    if(this.dead||this.stamina<8)return;

    if(this.state.startsWith("attack")){
      if(this.comboWindow>0)this.attackQueued=true;
      return;
    }

    this.stamina-=8;
    this.comboStep=1;
    this.comboWindow=.45;
    this.attackQueued=false;
    this.setState("attack1",true);
  }

  dodge(){
    if(this.dead||this.stamina<20)return;
    this.stamina-=20;

    const dir=Math.abs(this.input.moveX)>.08?Math.sign(this.input.moveX):this.facing;
    this.facing=dir;
    this.vx=dir*470;
    this.setState("dodge",true);
  }

  heal(){
    if(this.dead||this.hp>=this.maxHp||this.stamina<18)return;
    this.stamina-=18;
    this.setState("heal",true);
  }

  jump(){
    if(this.dead||!this.onGround)return;
    this.onGround=false;
    this.vy=-this.jumpPower;
    this.setState("jump",true);
  }

  update(dt){
    this.stamina=Math.min(this.maxStamina,this.stamina+17*dt);
    if(this.comboWindow>0)this.comboWindow-=dt;

    if(this.activeHitbox){
      this.activeHitbox.ttl-=dt;
      if(this.activeHitbox.ttl<=0)this.activeHitbox=null;
    }

    const result=this.renderer.update(dt,(name,frame)=>this.handleAnimationEvent(name,frame));

    if(this.dead)return;

    if(result==="finished"){
      if(this.state==="attack1"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=2;
        this.comboWindow=.42;
        this.stamina=Math.max(0,this.stamina-8);
        this.setState("attack2",true);
      }else if(this.state==="attack2"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=3;
        this.comboWindow=.40;
        this.stamina=Math.max(0,this.stamina-11);
        this.setState("attack3",true);
      }else if(this.state==="jump"){
        this.setState("fall",true);
      }else if(["attack1","attack2","attack3","dodge","heal","blockHit","hit","land"].includes(this.state)){
        this.attackQueued=false;
        this.comboStep=0;
        this.invulnerable=false;
        this.setState("idle",true);
      }
    }

    if(this.input.attack){this.input.attack=false;this.requestAttack()}
    if(this.input.dodge){this.input.dodge=false;this.dodge()}
    if(this.input.heal){this.input.heal=false;this.heal()}
    if(this.input.jump){this.input.jump=false;this.jump()}

    this.isBlocking=!!this.input.block&&this.onGround&&!this.state.startsWith("attack")&&this.state!=="dodge";

    if(this.isBlocking){
      if(this.state!=="block")this.setState("block");
    }else if(this.state==="block"){
      this.setState("idle");
    }

    const locked=["attack1","attack2","attack3","dodge","heal","blockHit","hit","death"].includes(this.state);
    const mx=Math.max(-1,Math.min(1,this.input.moveX));

    if(!locked&&!this.isBlocking){
      if(Math.abs(mx)>.08){
        this.facing=Math.sign(mx);
        const topSpeed=Math.abs(mx)>.78?this.runSpeed:this.speed;
        const desired=mx*topSpeed;
        this.vx+=(desired-this.vx)*Math.min(1,14*dt);

        if(this.onGround){
          this.setState(Math.abs(mx)>.78?"run":"walk");
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

    if(!this.onGround){
      this.vy+=this.gravity*dt;
      this.y+=this.vy*dt;

      if(this.vy>60&&!this.state.startsWith("attack")&&this.state!=="dodge"){
        this.setState("fall");
      }

      if(this.y>=this.groundY){
        this.y=this.groundY;
        this.vy=0;
        this.onGround=true;
        if(!locked)this.setState("land",true);
      }
    }

    this.x+=this.vx*dt;

    const margin=45;
    const maxX=Math.max(margin,(this.worldWidth || window.innerWidth)-margin);
    this.x=Math.max(margin,Math.min(maxX,this.x));
  }

  draw(ctx){
    const h=Math.max(145,Math.min(210,window.innerHeight*.17));
    this.renderer.draw(ctx,this.x,this.y,this.facing,h,this.onGround);
  }

  damage(amount,fromX=this.x){
    if(this.dead||this.invulnerable)return false;

    if(this.isBlocking){
      this.stamina=Math.max(0,this.stamina-12);
      this.setState("blockHit",true);
      return true;
    }

    this.hp=Math.max(0,this.hp-amount);
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
    if(!this.activeHitbox)return null;
    const h=this.activeHitbox;

    return{
      x:this.facing>0?this.x+h.x:this.x-h.x-h.w,
      y:this.y+h.y,
      w:h.w,
      h:h.h,
      damage:h.damage,
      knockback:h.knockback
    };
  }
}
