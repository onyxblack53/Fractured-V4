const IMAGE_W=1983,IMAGE_H=793;
export class CathedralInterior {
  constructor(world){
    this.world=world;
    this.ready=false;
    this.failed=false;
    this.image=new Image();
    this.image.onload=()=>{this.ready=this.image.naturalWidth>0};
    this.image.onerror=()=>{this.failed=true;console.error('[FRACTURED] Cathedral interior art failed to load')};
    this.image.src='./cathedral-interior-v59.png?v=59';
    this.scene=document.createElement('div');
    this.scene.id='cathedral-interior-scene';
    Object.assign(this.scene.style,{
      position:'absolute',left:'0',top:'0',zIndex:'0',display:'none',
      pointerEvents:'none',backgroundImage:'url(./cathedral-interior-v59.png?v=59)',
      backgroundRepeat:'no-repeat',backgroundSize:'100% 100%',willChange:'transform'
    });
    world.art.insertBefore(this.scene,world.art.querySelector('.world-grade'));
    this.active=false;
    this.resize();
  }
  resize(){
    const h=innerHeight*1.02;
    this.worldWidth=Math.max(innerWidth,h*IMAGE_W/IMAGE_H);
    this.scene.style.width=`${this.worldWidth}px`;
    this.scene.style.height=`${h}px`;
    this.scene.style.top=`${-innerHeight*.02}px`;
    if(this.active)this.world.worldWidth=this.worldWidth;
  }
  setActive(active){
    this.active=active;
    this.scene.style.display=active?'block':'none';
    this.world.track.style.display=active?'none':'';
    this.world.fx.style.display=active?'none':'';
    document.getElementById('stone-bridge').style.display=active?'none':'';
    if(active)this.world.worldWidth=this.worldWidth;
  }
  follow(){
    this.scene.style.transform=`translate3d(${-this.world.cameraX}px,0,0)`;
  }
}
