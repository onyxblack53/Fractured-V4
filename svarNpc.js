// World position is the feet pivot, shared by every animation frame.
export class SvarNpc {
  constructor(x,groundY){
    this.x=x;this.groundY=groundY;this.state='cower';this.frame=5;this.elapsed=0;this.loaded=false;
    this.images=[];
    this.ready=Promise.all(Array.from({length:6},(_,i)=>new Promise(resolve=>{
      const image=new Image();this.images[i]=image;
      image.onload=()=>resolve(image.naturalWidth>0);
      image.onerror=()=>resolve(false);
      image.src=`./svar-jester-v65-cower_${String(i).padStart(2,'0')}.png?v=66`;
    }))).then(results=>this.loaded=results.every(Boolean));
  }
  height(viewportHeight){return .75*Math.max(145,Math.min(205,viewportHeight*.19))}
  near(player,range=125){return !!player&&!player.dead&&player.onGround&&Math.abs(player.x-this.x)<=range&&Math.abs(player.y-this.groundY)<62}
  canTalk(player){return this.loaded&&this.state==='idle'&&this.near(player)}
  update(dt,player,paused=false){
    if(paused||!this.loaded)return;
    if(this.state==='cower'&&this.near(player,165)){this.state='standing';this.elapsed=0}
    if(this.state==='standing'){
      this.elapsed+=dt;
      while(this.elapsed>=.12&&this.frame>0){this.elapsed-=.12;this.frame--}
      if(this.frame===0){this.state='idle';this.elapsed=0}
    }
  }
  draw(ctx,cameraX,viewportWidth,viewportHeight){
    if(!this.loaded||this.x<cameraX-150||this.x>cameraX+viewportWidth+150)return;
    const size=this.height(viewportHeight)*512/400;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(this.x,this.groundY+1,18.75,3,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(this.images[this.frame],this.x-size/2,this.groundY-size*480/512,size,size);
    ctx.restore();
  }
}
