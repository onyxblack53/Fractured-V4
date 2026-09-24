// FRACTURED V4 — ten-screen horizontal world. No sprite or gameplay edits.
export const WORLD_SCREENS = 10;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export class WorldExtension {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.worldWidth = this.viewportWidth * WORLD_SCREENS;
    this.cameraX = 0;
    const art = document.getElementById('world-art');
    const original = document.getElementById('world-background');
    const track = document.createElement('div');
    track.id = 'fractured-world-track';
    Object.assign(track.style, {position:'absolute', left:'0', top:'0', width:'100%', height:'100%', pointerEvents:'none', zIndex:'0', willChange:'transform'});
    this.tiles=[];
    // Mirroring alternating tiles ensures the touching boundaries show matching pixels.
    for(let i=0;i<WORLD_SCREENS;i++) {
      const tile=document.createElement('img');
      tile.src=original.getAttribute('src');
      tile.alt=''; tile.draggable=false;
      Object.assign(tile.style,{position:'absolute',top:'0',height:'100%',width:'100%',objectFit:'cover',objectPosition:'center',left:'0',transform:i%2?'scaleX(-1)':'none',pointerEvents:'none'});
      track.appendChild(tile);
      this.tiles.push(tile);
    }
    art.insertBefore(track,original);
    original.style.display='none';
    this.track=track;
    this.bridgeFace=document.querySelector('#stone-bridge .bridge-face');
    this.bridgeLip=document.querySelector('#stone-bridge .bridge-lip');
    this.resize();
  }
  resize() {
    this.viewportWidth=window.innerWidth;
    this.worldWidth=this.viewportWidth*WORLD_SCREENS;
    for(let i=0;i<this.tiles.length;i++) {
      this.tiles[i].style.left=`${i*this.viewportWidth}px`;
      this.tiles[i].style.width=`${this.viewportWidth}px`;
    }
    this.track.style.width=`${this.worldWidth}px`;
    this.setCamera(this.cameraX);
  }
  setCamera(x) {
    this.cameraX=clamp(x,0,Math.max(0,this.worldWidth-this.viewportWidth));
    this.track.style.transform=`translate3d(${-this.cameraX}px,0,0)`;
    // The bridge's stone pattern scrolls without moving the ground or UI.
    if(this.bridgeFace) this.bridgeFace.style.backgroundPosition=`0 0, 0 0, ${-this.cameraX}px 0`;
    if(this.bridgeLip) this.bridgeLip.style.backgroundPositionX=`${-this.cameraX}px`;
    return this.cameraX;
  }
  follow(player) {
    // Start following after the knight advances past the original spawn position.
    return this.setCamera(player.x-this.viewportWidth*.36);
  }
}
