import {AngelKnightSpriteRenderer} from './angelKnightSpriteRenderer.js?v=37';
// Original canvas prototype; no knight PNGs are renamed or recolored.
export class DemonicRogueRenderer extends AngelKnightSpriteRenderer{
  draw(ctx,x,y,facing=1,height=190,onGround=true){
    ctx.save();ctx.translate(x,y);ctx.scale(facing*height/190,height/190);
    const moving=['walk','run','dodge'].includes(this.state),step=moving?Math.sin(this.frame*Math.PI/2)*9:0;
    const attacking=this.state.startsWith('attack'),strike=attacking&&this.frame===2;
    ctx.globalAlpha=this.state==='death'?Math.max(.15,1-this.frame/4):1;
    const shape=(points,fill,stroke='#663a50')=>{ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke()};
    if(onGround){ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,1,30,4,0,0,Math.PI*2);ctx.fill()}
    shape([[-17,-108],[-31,-34],[-8,-42],[18,-31],[23,-107]],'#160e20');
    shape([[-17,-60],[-19+step,-4],[-5+step,-3],[3,-59]],'#25202d');
    shape([[0,-59],[10-step,-3],[23-step,-3],[17,-61]],'#29202d');
    shape([[-20,-110],[-18,-65],[17,-62],[24,-110],[4,-124]],'#302332');
    shape([[-18,-119],[-19,-141],[-8,-154],[8,-155],[22,-138],[16,-118]],'#201421');
    shape([[-14,-147],[-27,-165],[-23,-141],[-14,-131]],'#6e374d');
    shape([[12,-149],[23,-165],[26,-140],[17,-132]],'#6e374d');
    ctx.strokeStyle='#fc577d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-136);ctx.lineTo(-2,-134);ctx.moveTo(5,-134);ctx.lineTo(11,-136);ctx.stroke();
    shape([[-19,-73],[18,-73],[18,-65],[-19,-65]],'#713547');
    const handX=strike?50:28,handY=strike?-81:-94;
    ctx.strokeStyle='#453047';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(15,-108);ctx.lineTo(handX,handY);ctx.stroke();
    shape([[handX-3,handY-3],[strike?89:44,strike?-84:-127],[handX+4,handY+4]],'#d6c4d1','#d58aa6');
    ctx.strokeStyle='#453047';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-17,-108);ctx.lineTo(-24,-81);ctx.stroke();
    shape([[-28,-82],[-37,-115],[-21,-80]],'#aa91b2','#d58aa6');
    if(strike){ctx.strokeStyle='#df648e99';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(22,-83,66,22,0,-.6,.8);ctx.stroke()}
    ctx.restore();
  }
}
