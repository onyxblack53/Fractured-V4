// Foreground props share the player's world coordinates and bridge baseline.
const load=name=>{
  const image=new Image();
  image.src=name==='rubble'?'./world-ruin-v53-rubble.png?v=54':'./world-ruin-v51-arch.png?v=54';
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
    // One continuous stepped mound. Each rise is below a normal jump apex.
    const rubbleHeight=Math.max(125,Math.min(155,viewportHeight*.18));
    const rubbleWidth=Math.max(230,Math.min(320,viewportWidth*.72));
    const archHeight=Math.max(240,Math.min(360,viewportHeight*.32));
    const first=Math.max(viewportWidth+140,worldWidth*.35);
    const span=Math.max(0,worldWidth-first-130);
    const props=[];
    props.push({kind:'rubble',x:first+span*.34,w:rubbleWidth,h:rubbleHeight,groundY,solid:true});
    props.push({kind:'arch',x:first+span*.78,w:archHeight*.96,h:archHeight,groundY,solid:false});
    this.props=props.sort((a,b)=>a.x-b.x);
    // Three landable rises match the visible stones: loose rocks, middle ledge,
    // then the top slab. Keep their heights below the player's jump reach.
    this.solids=props.filter(p=>p.solid).flatMap(p=>[
      {x:p.x+p.w*.08,w:p.w*.26,h:p.h*.17},
      {x:p.x+p.w*.34,w:p.w*.36,h:p.h*.48},
      {x:p.x+p.w*.70,w:p.w*.29,h:p.h*.79}
    ]);
  }
  draw(ctx,cameraX,viewportWidth){
    for(const prop of this.props){
      if(prop.x+prop.w<cameraX-20||prop.x>cameraX+viewportWidth+20)continue;
      const image=this.images[prop.kind];
      if(!image.complete||!image.naturalWidth)continue;
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,.38)';
      ctx.beginPath();ctx.ellipse(prop.x+prop.w/2,prop.groundY+1,prop.w*.45,4,0,0,Math.PI*2);ctx.fill();
      if(prop.kind==='rubble'){
        // Crop transparent margins at draw time; preserve the original PNG bytes.
        ctx.drawImage(image,15,20,1875,739,prop.x,prop.groundY-prop.h,prop.w,prop.h);
      }else ctx.drawImage(image,prop.x,prop.groundY-prop.h,prop.w,prop.h);
      ctx.restore();
    }
  }
}
