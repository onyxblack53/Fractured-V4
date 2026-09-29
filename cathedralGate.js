// Side-view cathedral wall at the end of the outdoor bridge.
export class CathedralGate {
  constructor(){
    this.image=new Image();
    this.image.src='./cathedral-edge-entrance-v58.png?v=59';
    this.image.onerror=()=>console.error('[FRACTURED] Cathedral entrance art failed to load');
    this.x=0;this.w=0;this.h=0;this.groundY=0;this.doorX=0;
  }
  resize(worldWidth,groundY,viewportHeight){
    this.h=Math.max(500,Math.min(720,viewportHeight*.76));
    this.w=this.h*887/1774;
    this.x=Math.max(0,worldWidth-this.w*.98);
    this.groundY=groundY;
    // The first buttress is at ~.58 width; the dark opening begins at ~.75.
    this.doorX=this.x+this.w*.78;
  }
  draw(ctx,cameraX,viewportWidth){
    if(!this.image.complete||!this.image.naturalWidth)return;
    if(this.x+this.w<cameraX||this.x>cameraX+viewportWidth)return;
    ctx.drawImage(this.image,this.x,this.groundY-this.h,this.w,this.h);
  }
  canEnter(player){
    return this.image.complete&&this.image.naturalWidth&&!player.dead&&player.onGround&&
      player.x>=this.doorX&&player.input.moveX>.08;
  }
}
