// Shared sprite cache and a bounded loading queue. No global Image monkey-patching.
export class LoadingManager {
  constructor(limit=4,timeout=20000){this.limit=limit;this.timeout=timeout;this.cache=new Map();this.records=new WeakMap();this.queue=[];this.active=0}
  image(url){
    if(this.cache.has(url))return this.cache.get(url).image;
    const image=new Image();image.decoding='async';
    const record={image,url,failed:false};record.ready=new Promise(resolve=>record.resolve=resolve);
    this.cache.set(url,record);this.records.set(image,record);this.queue.push(record);this.pump();return image;
  }
  pump(){while(this.active<this.limit&&this.queue.length){const r=this.queue.shift();this.active++;
    let settled=false;
    const done=ok=>{if(settled)return;settled=true;clearTimeout(timer);r.image.onload=null;r.image.onerror=null;r.failed=!ok;r.resolve(ok);this.active--;this.pump()};
    const timer=setTimeout(()=>done(false),this.timeout);
    r.image.onload=async()=>{try{await r.image.decode?.();done(r.image.naturalWidth>0)}catch{done(false)}};
    r.image.onerror=()=>done(false);r.image.src=r.url;
  }}
  wait(image){
    if(this.records.has(image))return this.records.get(image).ready;
    return new Promise(resolve=>{
      let finished=false;
      const done=ok=>{if(finished)return;finished=true;clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);resolve(ok)};
      const loaded=async()=>{try{await image.decode?.();done(image.naturalWidth>0)}catch{done(false)}};
      const failed=()=>done(false),timer=setTimeout(failed,this.timeout);
      image.addEventListener('load',loaded);image.addEventListener('error',failed);
      if(image.complete){if(image.naturalWidth>0)loaded();else if(image.src)failed()}
    });
  }
  async waitAll(images,onProgress=()=>{}){
    const unique=[...new Set(images.flat(Infinity).filter(Boolean))];let done=0;onProgress(0,unique.length);
    const result=await Promise.all(unique.map(async image=>{const ok=await this.wait(image);onProgress(++done,unique.length);return {image,ok}}));
    return result.filter(r=>!r.ok).map(r=>this.records.get(r.image)?.url||r.image.src||'Unknown image');
  }
  resetFailures(){for(const [url,r] of this.cache)if(r.failed)this.cache.delete(url)}
}
export const assets=new LoadingManager();
