// FRACTURED V4 — visual-only bridge alignment patch.
// Load as a module after main.js. Does not alter collision, physics, or bridge assets.
import { AngelKnightSpriteRenderer } from './angelKnightSpriteRenderer.js?v=11';
const BOOT_ALIGNMENT_PX = 9;
AngelKnightSpriteRenderer.prototype.draw = function(ctx,x,groundY,facing=1,targetHeight=190){
  const frames=this.images[this.state] || this.images.idle;
  const img=frames[Math.min(this.frame,frames.length-1)];
  if(!img || !img.complete || !img.naturalWidth)return;
  const width=targetHeight, left=x-width/2, top=groundY-targetHeight+BOOT_ALIGNMENT_PX;
  ctx.save();
  if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0);}
  ctx.drawImage(img,left,top,width,targetHeight);
  ctx.restore();
};
