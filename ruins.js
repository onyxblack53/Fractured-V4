// Foreground props share the player's world coordinates and bridge baseline.
const load=name=>{
  const image=new Image();
  image.src=`./world-ruin-v51-${name}.png?v=51`;
  image.onerror=()=>console.error(`[FRACTURED] Missing ruin art: ${name}`);
  return image;
};

export class Ruins{
  constructor(){
    this.images={rubble:load('rubble'),arch:load('arch')};
    this.props=[];
    this.solids=[];
  }
  resize(worldWidth,viewportWidth,groundY,viewportHeight){
    const rubbleHeight=Math.max(30,Math.min(43,viewportHeight*.046));
    const rubbleWidth=rubbleHeight*2;
    const archHeight=Math.max(85,Math.min(125,viewportHeight*.13));
    const first=Math.max(viewportWidth+140,worldWidth*.35);
    const fractions=[0,.28,.58,1];
    const span=Math.max(0,worldWidth-first-130);
    const props=[];
    for(let i=0;i<fractions.length;i++){
      const x=first+span*fractions[i];
      props.push({kind:'rubble',x,w:rubbleWidth,h:rubbleHeight,groundY,solid:true});
    }
    for(const fraction of [.45,.78]){
      const x=first+span*fraction;
      props.push({kind:'arch',x,w:archHeight*.96,h:archHeight,groundY,solid:false});
    }
    this.props=props.sort((a,b)=>a.x-b.x);
    // The collision box follows the dense center of the loose stones.
    this.solids=props.filter(p=>p.solid).map(p=>({x:p.x+4,w:p.w-8,h:p.h*.76}));
  }
  draw(ctx,cameraX,viewportWidth){
    for(const prop of this.props){
      if(prop.x+prop.w<cameraX-20||prop.x>cameraX+viewportWidth+20)continue;
      const image=this.images[prop.kind];
      if(!image.complete||!image.naturalWidth)continue;
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,.38)';
      ctx.beginPath();ctx.ellipse(prop.x+prop.w/2,prop.groundY+1,prop.w*.45,4,0,0,Math.PI*2);ctx.fill();
      ctx.drawImage(image,prop.x,prop.groundY-prop.h,prop.w,prop.h);
      ctx.restore();
    }
  }
}
