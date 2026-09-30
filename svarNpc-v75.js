import {assets} from './loadingManager-v75.js?v=75';
// Sprite feet share a fixed pivot; route elevations use the same solids as the player.
export class SvarNpc {
  constructor(x,groundY){
    Object.assign(this,{x,groundY,state:'cower',frame:5,elapsed:0,loaded:false,
      elevation:0,guiding:false,arrived:false,facing:-1,route:[],leg:null,step:0,settle:0,animation:'cower'});
    this.images={cower:[],walk:[],jump:[]};
    for(const action of Object.keys(this.images))for(let i=0;i<6;i++)this.images[action][i]=assets.image(`./svar-jester-v65-${action}_${String(i).padStart(2,'0')}.png?v=69`);
    this.ready=assets.waitAll(Object.values(this.images)).then(failed=>this.loaded=failed.length===0);
  }
  get y(){return this.groundY-this.elevation}
  height(h){return .75*Math.max(145,Math.min(205,h*.19))}
  near(p,range=125){return !!p&&!p.dead&&p.onGround&&Math.abs(p.x-this.x)<=range&&Math.abs(p.y-this.y)<62}
  canTalk(p){return this.loaded&&this.state==='idle'&&this.near(p)}
  configureRoute(solids,doorX,groundY){
    this.groundY=groundY;this.doorX=doorX;this.leg=null;this.step=0;
    const stones=solids.slice().sort((a,b)=>a.x-b.x);
    this.elevation=Math.max(0,...stones.filter(s=>this.x>=s.x&&this.x<=s.x+s.w).map(s=>s.h));
    const route=[];
    for(let i=0;i<stones.length;i++){
      const s=stones[i],prev=stones[i-1],next=stones[i+1];
      if(!prev||s.x>prev.x+prev.w+2)route.push({x:s.x-24,h:0,jump:false});
      route.push({x:s.x+s.w*.5,h:s.h,jump:true});
      if(!next||next.x>s.x+s.w+2)route.push({x:s.x+s.w+35,h:0,jump:true});
    }
    route.push({x:doorX-38,h:0,jump:false});
    this.route=route.filter(p=>p.x>this.x+.5);
    if(this.arrived){this.x=doorX-38;this.elevation=0;this.route=[]}
  }
  startGuide(){
    if(this.guiding||this.arrived)return;
    this.guiding=true;this.state='idle';this.animation='cower';this.frame=0;this.facing=1;
  }
  update(dt,player,paused=false){
    if(paused||!this.loaded)return;
    if(this.guiding){this.updateGuide(dt,player);return}
    if(this.state==='cower'&&this.near(player,165)){this.state='standing';this.elapsed=0}
    if(this.state==='standing'){
      this.elapsed+=dt;
      while(this.elapsed>=.12&&this.frame>0){this.elapsed-=.12;this.frame--}
      if(this.frame===0){this.state='idle';this.elapsed=0}
    }
  }
  idle(){this.state='idle';this.animation='cower';this.frame=0;this.elapsed=0}
  updateGuide(dt,player){
    if(this.leg){
      const l=this.leg;l.time=Math.min(l.duration,l.time+dt);
      const t=l.time/l.duration;
      this.x=l.x+(l.target.x-l.x)*t;
      this.elevation=l.h+(l.target.h-l.h)*t+4*l.arc*t*(1-t);
      this.state='jump';this.animation='jump';this.frame=Math.min(5,Math.floor(t*6));
      if(t>=1){this.x=l.target.x;this.elevation=l.target.h;this.leg=null;this.step++;this.settle=.16;this.idle()}
      return;
    }
    if(this.settle>0){this.settle=Math.max(0,this.settle-dt);return}
    if(!player||player.dead||this.x-player.x>210){this.idle();this.facing=-1;return}
    const target=this.route[this.step];
    if(!target){this.guiding=false;this.arrived=true;this.idle();this.facing=-1;return}
    this.facing=1;
    if(target.jump){
      this.leg={x:this.x,h:this.elevation,target,time:0,duration:Math.max(.6,Math.abs(target.x-this.x)/125),arc:Math.max(40,Math.abs(target.h-this.elevation)+30)};
      this.state='jump';this.animation='jump';this.frame=0;return;
    }
    const speed=player.x>this.x?155:110;
    this.x=Math.min(target.x,this.x+speed*dt);
    this.state='walk';this.animation='walk';this.elapsed+=dt;this.frame=Math.floor(this.elapsed/.11)%6;
    if(this.x>=target.x){this.elevation=target.h;this.step++}
  }
  draw(ctx,cameraX,viewportWidth,viewportHeight){
    if(!this.loaded||this.x<cameraX-150||this.x>cameraX+viewportWidth+150)return;
    const size=this.height(viewportHeight)*512/400;
    ctx.save();ctx.translate(this.x,this.y);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,1,18.75,3,0,0,Math.PI*2);ctx.fill();
    // Source frames face left; mirror them when leading right.
    if(this.facing===1)ctx.scale(-1,1);
    ctx.drawImage(this.images[this.animation][this.frame],-size/2,-size*480/512,size,size);ctx.restore();
  }
}
