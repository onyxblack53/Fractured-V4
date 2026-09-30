// Generated from the 20 checked game modules.
(()=>{'use strict';
const m1=(()=>{
// Shared sprite cache and a bounded loading queue. No global Image monkey-patching.
class LoadingManager {
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
const assets=new LoadingManager();

return {LoadingManager,assets};
})();
const m2=(()=>{
// Angel-only skills. Keep the two playable origins' skill registries separate.
const ANGEL_ORIGIN='angelic-knight';
const ANGEL_ABILITIES=Object.freeze([
  {id:'celestial_light',name:'Celestial Light',icon:'celestial_light_frame_01.png',cooldown:4,
    description:'Blinding light: stuns enemies within 10 ft for 3.5 seconds.'},
  {id:'halo_bolt',name:'Halo Bolt',icon:'halo_bolt_frame_01.png',cooldown:6,
    description:'Yellow-white holy bolt that deals electric damage.'},
  {id:'wing_burst',name:'Wing Burst',icon:'wing_burst_frame_01.png',cooldown:8,
    description:'Wing-driven air blast that damages and knocks enemies back.'}
]);
// Existing Rogue placeholders remain independent and do not use the angel image paths.
const ROGUE_ABILITIES=Object.freeze([
  {id:'rogue_slot_1',name:'Radiant Burst',icon:null,cooldown:4,description:'Rogue skill placeholder.'},
  {id:'rogue_slot_2',name:'Aegis of Heaven',icon:null,cooldown:6,description:'Rogue skill placeholder.'},
  {id:'rogue_slot_3',name:'Falling Star',icon:null,cooldown:8,description:'Rogue skill placeholder.'}
]);
function getAbilities(origin){return origin===ANGEL_ORIGIN?ANGEL_ABILITIES:ROGUE_ABILITIES;}
function useAngelAbility(player,index,enemies=[]){
  if(!player||player.origin!==ANGEL_ORIGIN||!Number.isInteger(index)||index<0||index>=ANGEL_ABILITIES.length)return false;
  const enemyList=Array.isArray(enemies)?enemies:[];
  const targets=enemyList.filter(enemy=>enemy&&!enemy.dead&&Number.isFinite(enemy.x));
  if(index===0){ // Approx. 10ft in the game's world coordinates (10px per foot).
    for(const enemy of targets){
      if(Math.abs(enemy.x-player.x)<=100&&Math.abs((enemy.y??player.y)-player.y)<105){
        enemy.stunRemaining=Math.max(enemy.stunRemaining||0,3.5);
      }
    }
  }else if(index===1){
    for(const enemy of targets){
      const dx=(enemy.x-player.x)*player.facing;
      if(dx>0&&dx<=430&&Math.abs((enemy.y??player.y)-player.y)<75){
        enemy.hp=Math.max(0,(enemy.hp??100)-24*(player.damageMultiplier||1));
        enemy.hitFlash=.18;
        if(enemy.hp===0)enemy.dead=true;
        break; // single target projectile
      }
    }
  }else{
    for(const enemy of targets){
      const dx=(enemy.x-player.x)*player.facing;
      if(dx>=-25&&dx<=155&&Math.abs((enemy.y??player.y)-player.y)<115){
        enemy.hp=Math.max(0,(enemy.hp??100)-18*(player.damageMultiplier||1));
        enemy.vx=player.facing*290;
        enemy.hitFlash=.18;
        if(enemy.hp===0)enemy.dead=true;
      }
    }
  }
  return true;
}

return {ANGEL_ORIGIN,ANGEL_ABILITIES,ROGUE_ABILITIES,getAbilities,useAngelAbility};
})();
const m3=(()=>{
// World-space effects: no extra PNG downloads and no hostile NPC spawning.
class AngelAbilityEffects {
  constructor(){this.effects=[];this.status=new Map();}
  targets(enemies){return (Array.isArray(enemies)?enemies:[]).filter(e=>e&&!e.dead&&!e.friendly&&e!==globalThis.FRACTURED?.svar&&Number.isFinite(e.x));}
  damage(e,n,p){if(typeof e.damage==='function')e.damage(n,p.x);else if(Number.isFinite(e.hp)){e.hp=Math.max(0,e.hp-n);if(e.hp===0)e.dead=true;}e.hitFlash=.18;}
  cast(p,index,enemies=[]){
    if(p?.origin!=='angelic-knight'||![0,1,2].includes(index))return false;
    const f=p.facing<0?-1:1,h=p.renderHeight||p.height||170;
    this.effects.push({index,x:p.x,y:p.y-h*.5,feet:p.y,f,age:0,life:index===0?.8:index===1?.9:.65,p,hit:new Set()});
    if(index===0)for(const e of this.targets(enemies))if(Math.abs(e.x-p.x)<=100&&Math.abs((e.y??p.y)-p.y)<105){
      let s=this.status.get(e);
      if(!s){s={remaining:0,update:e.update,hadUpdate:Object.hasOwn(e,'update')};this.status.set(e,s);if(typeof e.update==='function')e.update=function(...args){if(this.stunRemaining>0)return;return s.update.apply(this,args);};}
      s.remaining=3.5;e.stunRemaining=3.5;e.stunned=true;e.vx=0;
    }
    return true;
  }
  release(e,s){if(typeof s.update==='function'){if(s.hadUpdate)e.update=s.update;else delete e.update;}e.stunRemaining=0;e.stunned=false;}
  clear(){for(const [e,s] of this.status)this.release(e,s);this.status.clear();this.effects=[];}
  update(dt,enemies=[],width=Infinity){
    for(const [e,s] of this.status){s.remaining=Math.max(0,s.remaining-dt);e.stunRemaining=s.remaining;e.vx=0;if(!s.remaining||e.dead){this.release(e,s);this.status.delete(e);}}
    for(const a of this.effects){
      const old=a.x;a.age+=dt;
      if(a.index===0)continue;
      a.x+=a.f*(a.index===1?520:350)*dt;
      for(const e of this.targets(enemies)){
        const feet=e.y??a.feet,eh=e.renderHeight||e.height||100;
        const vertical=a.y>=feet-eh-12&&a.y<=feet+12;
        if(!vertical||a.hit.has(e)||e.x<Math.min(old,a.x)-22||e.x>Math.max(old,a.x)+22)continue;
        a.hit.add(e);this.damage(e,(a.index===1?24:18)*(a.p.damageMultiplier||1),a.p);
        if(a.index===1){a.age=a.life;break;}
        // Apply displacement directly, not just a velocity an enemy might ignore.
        if(!e.dead){e.x=Math.max(0,Math.min(width,e.x+a.f*85));e.vx=a.f*290;}
      }
    }
    this.effects=this.effects.filter(a=>a.age<a.life);
  }
  draw(ctx){
    ctx.save();
    for(const a of this.effects){
      const t=a.age/a.life;ctx.globalAlpha=(1-t)*.85;
      if(a.index===0){
        const r=25+100*Math.min(1,t*2),g=ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,r);
        g.addColorStop(0,'rgba(255,255,235,.85)');g.addColorStop(.35,'rgba(255,228,130,.4)');g.addColorStop(1,'rgba(255,236,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(a.x,a.y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#fff3ba';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y,r*.85,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<12;i++){const angle=i*Math.PI/6;ctx.beginPath();ctx.moveTo(a.x+Math.cos(angle)*r*.55,a.y+Math.sin(angle)*r*.55);ctx.lineTo(a.x+Math.cos(angle)*r,a.y+Math.sin(angle)*r);ctx.stroke();}
      }else if(a.index===1){
        ctx.strokeStyle='#ffe477';ctx.shadowColor='#fff3ac';ctx.shadowBlur=18;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(a.x-a.f*65,a.y);ctx.lineTo(a.x-a.f*42,a.y-6);ctx.lineTo(a.x-a.f*25,a.y+5);ctx.lineTo(a.x,a.y);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
      }else{
        ctx.strokeStyle='#d4f5ff';ctx.lineWidth=3;
        for(let i=0;i<5;i++){const y=a.y+(i-2)*14;ctx.beginPath();ctx.moveTo(a.x-a.f*(65+i*5),y);ctx.quadraticCurveTo(a.x-a.f*15,y-12,a.x+a.f*18,y);ctx.stroke();}
        ctx.beginPath();ctx.ellipse(a.x,a.y,16,44,0,-Math.PI/2,Math.PI/2);ctx.stroke();
      }
    }
    ctx.globalAlpha=.8;ctx.strokeStyle='#ffe5a0';ctx.lineWidth=2;
    for(const [e] of this.status){ctx.beginPath();ctx.ellipse(e.x,(e.y||0)-(e.renderHeight||e.height||100)-8,15,5,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
}

return {AngelAbilityEffects};
})();
const m4=(()=>{
const ANGEL_ABILITIES=[
 {id:'celestial_light',name:'Celestial Light',icon:'☀',cooldown:4,text:'Blinding light · 3.5-second stun within 10 ft.'},
 {id:'halo_bolt',name:'Halo Bolt',icon:'ϟ',cooldown:6,text:'A yellow-white holy lightning projectile.'},
 {id:'wing_burst',name:'Wing Burst',icon:'≋',cooldown:8,text:'A damaging gust with knockback.'}
];
function abilityCatalog(origin){return origin==='angelic-knight'?ANGEL_ABILITIES:[]}
function cleanAbilities(origin,value){const catalog=abilityCatalog(origin),seen=new Set();return Array.from({length:3},(_,i)=>{const id=Array.isArray(value)?value[i]:catalog[i]?.id;if(!catalog.some(a=>a.id===id)||seen.has(id))return null;seen.add(id);return id})}
function loadAbilities(origin){try{const saved=localStorage.getItem('fractured.abilities.v1.'+origin);return cleanAbilities(origin,saved?JSON.parse(saved):undefined)}catch{return cleanAbilities(origin,undefined)}}
function saveAbilities(origin,ids){try{localStorage.setItem('fractured.abilities.v1.'+origin,JSON.stringify(cleanAbilities(origin,ids)))}catch{}}
function assignAbility(origin,ids,index,id){const result=cleanAbilities(origin,ids);if(index<0||index>2)return result;if(id!==null&&!abilityCatalog(origin).some(a=>a.id===id))return result;const other=id===null?-1:result.indexOf(id);if(other>=0&&other!==index)result[other]=result[index];result[index]=id;return result}

return {ANGEL_ABILITIES,abilityCatalog,cleanAbilities,loadAbilities,saveAbilities,assignAbility};
})();
const m5=(()=>{
// Independent timers advance with unpaused game time.
class AbilityCooldowns {
  constructor(durations=[4,6,8]){this.durations=[...durations];this.remaining=durations.map(()=>0);}
  use(index){
    if(!Number.isInteger(index)||index<0||index>=this.remaining.length||this.remaining[index]>0)return false;
    this.remaining[index]=this.durations[index];return true;
  }
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.remaining=this.remaining.map(value=>Math.max(0,value-dt));
  }
}

return {AbilityCooldowns};
})();
const m7=(()=>{
const INTRO_SCENES=[
  {
    "title": "Aradavia",
    "text": "Aradavia was a prosperous nation, where advanced magic and technology flourished together.",
    "art": "./aradavia-intro-v40-01.png",
    "position": "50% 35%",
    "effect": "gold",
    "motion": "push",
    "duration": 7.5
  },
  {
    "title": "The Council of Thirteen",
    "text": "Thirteen scholars governed the nation. Powerful arcane wielders, they guided Aradavia through its golden age.",
    "art": "./aradavia-intro-v40-02.png",
    "position": "50% 35%",
    "effect": "blue",
    "motion": "pull",
    "duration": 7.5
  },
  {
    "title": "Beneath the earth",
    "text": "Deep beneath the earth, the council discovered a hidden power: the Black Gem.",
    "art": "./aradavia-intro-v40-03.png",
    "position": "50% 35%",
    "effect": "void",
    "motion": "push",
    "duration": 7.5
  },
  {
    "title": "The oath",
    "text": "The thirteen swore to seal it away. But one among them believed its power could carry Aradavia further into the golden age.",
    "art": "./aradavia-intro-v40-04.png",
    "position": "50% 35%",
    "effect": "blue",
    "motion": "push",
    "duration": 8.833333333333332
  },
  {
    "title": "The sealing",
    "text": "Together, the council began a ritual to seal the Black Gem within the void. During the ritual, the thirteenth scholar tethered its darkness to himself.",
    "art": "./aradavia-intro-v40-05.png",
    "position": "50% 35%",
    "effect": "void",
    "motion": "push",
    "duration": 9.833333333333334
  },
  {
    "title": "A new host",
    "text": "The gem was sealed. But before it vanished into the void, the darkness had found a new host.",
    "art": "./aradavia-intro-v40-06.png",
    "position": "50% 35%",
    "effect": "void",
    "motion": "push",
    "duration": 7.5
  },
  {
    "title": "The descent",
    "text": "Under its influence, the scholar began to lose his mind. He turned upon his fellow scholars, killing them and draining their power into his own.",
    "art": "./aradavia-intro-v40-07.png",
    "position": "50% 35%",
    "effect": "void",
    "motion": "push",
    "duration": 9.833333333333334
  },
  {
    "title": "The forgotten curse",
    "text": "Then the darkness showed him a ritual: a dark, forgotten curse, powerful enough to plunge the world into an age of darkness.",
    "art": "./aradavia-intro-v40-08.png",
    "position": "50% 35%",
    "effect": "void",
    "motion": "push",
    "duration": 8.833333333333332
  },
  {
    "title": "The Fracture",
    "text": "As the scholar performed the ritual, the earth and sky cracked open. Other worlds spilled through the fractures.",
    "art": "./aradavia-intro-v40-09.png",
    "position": "50% 35%",
    "effect": "fracture",
    "motion": "pull",
    "duration": 7.5
  },
  {
    "title": "Hell unleashed",
    "text": "Through the broken earth and sky came nightmarish creatures of hell, unleashed upon Aradavia.",
    "art": "./aradavia-intro-v40-10.png",
    "position": "50% 35%",
    "effect": "fire",
    "motion": "pull",
    "duration": 7.5
  }
];
const ORIGIN_SCENES={
  'angelic-knight':[
    {title:'The heavens cracked',text:"As the worlds ruptured, the heavens cracked. From Heaven's gates fell a knight, sent to restore order to Aradavia.",art:'./aradavia-branch-v50-angel-fall.png',position:'50% 42%',effect:'gold',motion:'push',duration:8},
    {title:'A knight’s vow',text:'Amid the ruins, the Angelic Knight raised sword and shield. Beneath the Blood Moon, the path to the abandoned cathedral called.',art:'./aradavia-branch-v50-angel-vow.png',position:'50% 40%',effect:'gold',motion:'pull',duration:8}
  ],
  'demonic-rogue':[
    {title:'Hell ripped open',text:'As Hell ripped open, one who refused its demonic reign climbed through the breach to Earth, leaving its armies behind.',art:'./aradavia-branch-v50-rogue-ascent.png',position:'50% 46%',effect:'fire',motion:'push',duration:8},
    {title:'Against the darkness',text:'On Aradavia’s broken ground, the Demonic Rogue chose to side with the light and vanquish the darkness. Its trail led toward the abandoned cathedral.',art:'./aradavia-branch-v50-rogue-vow.png',position:'50% 42%',effect:'void',motion:'pull',duration:8}
  ]
};
class CinematicIntro{
  constructor(onComplete){
    this.onComplete=onComplete;this.active=false;this.elapsed=0;this.index=0;this.scenes=INTRO_SCENES;this.chapter='PROLOGUE';
    this.screen=document.getElementById('intro-screen');
    document.getElementById('intro-skip').onclick=()=>this.finish();
    document.getElementById('intro-next').onclick=()=>this.next();
    document.getElementById('intro-pause').onclick=()=>{this.paused=!this.paused;document.getElementById('intro-pause').textContent=this.paused?'RESUME':'PAUSE'};
    document.addEventListener('visibilitychange',()=>{this.last=performance.now()});
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  start(scenes=INTRO_SCENES,onComplete=this.onComplete,chapter='PROLOGUE'){
    if(this.active)return;
    this.scenes=scenes;this.completion=onComplete;this.chapter=chapter;
    document.querySelectorAll('.flow-screen').forEach(s=>s.classList.remove('active'));
    this.screen.classList.add('active');this.active=true;this.paused=false;this.index=0;this.last=performance.now();
    document.getElementById('intro-pause').textContent='PAUSE';this.showScene();
    document.getElementById('intro-next').focus();
    const tick=now=>{
      if(!this.active)return;
      const dt=Math.min((now-this.last)/1000,.1);this.last=now;
      if(!this.paused&&!document.hidden&&!this.reduced){this.elapsed+=dt;if(this.elapsed>=this.scenes[this.index].duration)this.next()}
      this.screen.classList.toggle('paused',this.paused||document.hidden);
      document.getElementById('intro-progress').style.width=`${Math.min(100,this.elapsed/this.scenes[this.index].duration*100)}%`;
      if(this.active)this.raf=requestAnimationFrame(tick);
    };this.raf=requestAnimationFrame(tick);
  }
  showScene(){
    this.elapsed=0;const scene=this.scenes[this.index];
    this.screen.dataset.effect=scene.effect;
    const old=this.screen.querySelector('.intro-shot');
    if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),1100)}
    const shot=document.createElement('div');shot.className='intro-shot';shot.dataset.motion=scene.motion;shot.dataset.fullFrame=String(this.index===1);shot.style.animationDuration=`${scene.duration+1}s`;
    const next=this.scenes[this.index+1];if(next){const preload=new Image();preload.src=next.art;}
    shot.style.backgroundImage=`url("${scene.art}")`;shot.style.backgroundPosition=scene.position;
    this.screen.prepend(shot);
    document.getElementById('intro-chapter').textContent=`${this.chapter} · ${String(this.index+1).padStart(2,'0')} / ${String(this.scenes.length).padStart(2,'0')}`;
    document.getElementById('intro-title').textContent=scene.title;
    document.getElementById('intro-story').textContent=scene.text;
    document.getElementById('intro-next').textContent=this.index===this.scenes.length-1?(this.scenes===INTRO_SCENES?'CHOOSE YOUR CHARACTER':'ENTER WORLD'):'CONTINUE';
  }
  next(){if(!this.active)return;if(this.index>=this.scenes.length-1)this.finish();else{this.index++;this.showScene()}}
  finish(){if(!this.active)return;this.active=false;cancelAnimationFrame(this.raf);this.screen.classList.remove('active');this.screen.querySelectorAll('.intro-shot').forEach(s=>s.remove());this.completion()}
}

return {INTRO_SCENES,ORIGIN_SCENES,CinematicIntro};
})();
const m6=(()=>{
const {CinematicIntro,ORIGIN_SCENES}=m7;
const ORIGINS=[
  {id:'angelic-knight',name:'Angelic Knight',race:'Angel',className:'Knight',glyph:'✦',description:'A celestial guardian. Stand your ground with sword and shield.'},
  {id:'demonic-rogue',name:'Demonic Rogue',race:'Demon',className:'Rogue',glyph:'☽',description:'A swift fighter of the abyss. Close the distance with paired blades.'}
];
class CharacterCreator{
  constructor(onComplete){
    this.onComplete=onComplete;this.selected=null;
    this.intro=new CinematicIntro(()=>this.show('race-screen'));
    const grid=document.getElementById('origin-grid');
    grid.innerHTML=ORIGINS.map(o=>`<button class="origin-card ${o.id}" data-origin="${o.id}" aria-pressed="false"><span class="origin-emblem">${o.glyph}</span><span class="origin-name">${o.name}</span><span class="origin-description">${o.description}</span></button>`).join('');
    document.getElementById('start-btn').onclick=()=>this.intro.start();
    document.getElementById('replay-intro').onclick=()=>this.intro.start();
    document.getElementById('flow-back-start').onclick=()=>this.show('start-screen');
    grid.onclick=e=>{
      const button=e.target.closest('[data-origin]');if(!button)return;
      this.selected=ORIGINS.find(o=>o.id===button.dataset.origin);
      grid.querySelectorAll('button').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
      document.getElementById('origin-enter').disabled=false;
      document.getElementById('origin-summary').textContent=this.selected.name;
    };
    document.getElementById('origin-enter').onclick=()=>{
      if(!this.selected)return;
      const o=this.selected;
      this.intro.start(ORIGIN_SCENES[o.id],()=>onComplete({origin:o.id,displayName:o.name,races:[o.race],className:o.className}),o.name.toUpperCase());
    };
  }
  show(id){document.querySelectorAll('.flow-screen').forEach(s=>s.classList.remove('active'));const screen=document.getElementById(id);screen.classList.add('active');screen.querySelector('button')?.focus()}
}

return {ORIGINS,CharacterCreator};
})();
const m9=(()=>{
const SLOTS=[
 {id:'power',name:'Power',icon:'✦',items:[{id:'keen',name:'Keen Sigil',text:'+10% damage',bonus:{damage:.10}},{id:'ember',name:'Ember Sigil',text:'+6% damage · +5 stamina',bonus:{damage:.06,stamina:5}}]},
 {id:'ward',name:'Ward',icon:'⬡',items:[{id:'iron',name:'Iron Ward',text:'10% damage resistance',bonus:{resist:.10}},{id:'shelter',name:'Shelter Ward',text:'6% resistance · +5 health',bonus:{resist:.06,hp:5}}]},
 {id:'vitality',name:'Vitality',icon:'♥',items:[{id:'heart',name:'Heart Shard',text:'+20 maximum health',bonus:{hp:20}},{id:'root',name:'Root Shard',text:'+10 health · 4% resistance',bonus:{hp:10,resist:.04}}]},
 {id:'endurance',name:'Endurance',icon:'◈',items:[{id:'well',name:'Deep Well',text:'+20 maximum stamina',bonus:{stamina:20}},{id:'breath',name:'Wind Breath',text:'+10 stamina · +4% movement',bonus:{stamina:10,speed:.04}}]},
 {id:'haste',name:'Haste',icon:'➤',items:[{id:'stride',name:'Swift Stride',text:'+8% movement speed',bonus:{speed:.08}},{id:'hunter',name:'Hunter’s Step',text:'+4% movement · +4% damage',bonus:{speed:.04,damage:.04}}]}
];
const baseStats=new WeakMap();
function cleanLoadout(raw){
 const result={};for(const slot of SLOTS)if(slot.items.some(i=>i.id===raw?.[slot.id]))result[slot.id]=raw[slot.id];return result;
}
function loadEnhancements(origin){try{return cleanLoadout(JSON.parse(localStorage.getItem('fractured.enhancements.v1.'+origin)||'{}'))}catch{return {}}}
function saveEnhancements(origin,loadout){try{localStorage.setItem('fractured.enhancements.v1.'+origin,JSON.stringify(cleanLoadout(loadout)))}catch{}}
function bonuses(loadout){
 const b={damage:0,resist:0,hp:0,stamina:0,speed:0};
 for(const slot of SLOTS){const item=slot.items.find(i=>i.id===loadout?.[slot.id]);if(item)for(const [k,v] of Object.entries(item.bonus))b[k]+=v;}
 return b;
}
function applyEnhancements(player,loadout){
 if(!player)return;
 if(!baseStats.has(player))baseStats.set(player,{hp:player.maxHp,stamina:player.maxStamina,speed:player.speed,run:player.runSpeed});
 const base=baseStats.get(player),b=bonuses(loadout);
 player.maxHp=base.hp+b.hp;player.maxStamina=base.stamina+b.stamina;
 player.hp=Math.min(player.hp,player.maxHp);player.stamina=Math.min(player.stamina,player.maxStamina);
 player.speed=base.speed*(1+b.speed);player.runSpeed=base.run*(1+b.speed);
 player.damageMultiplier=1+b.damage;player.damageResistance=b.resist;
}

return {SLOTS,cleanLoadout,loadEnhancements,saveEnhancements,bonuses,applyEnhancements};
})();
const m10=(()=>{
const {assets}=m1;
// Demonic Rogue animation frames. These filenames are unique in a flat upload.
const ART_VERSION='49';
const file=pose=>pose==='attack3-mid'
  ?`./demonic-rogue-v49-attack3-mid-fixed.png?v=${ART_VERSION}`
  :`./demonic-rogue-v${pose.endsWith('-mid')?'48':pose==='attack3-rise'?'47':pose.startsWith('attack2-')||pose.startsWith('attack3-')?'46':['run-stride-a','run-stride-b','attack-windup','attack-follow'].includes(pose)?'45':'43'}-${pose}.png?v=${ART_VERSION}`;
const ANIMS={
  idle:    {poses:['idle'],fps:1,loop:true},
  walk:    {poses:['walk','walk','walk','walk'],fps:7,loop:true},
  run:     {poses:['run','run-stride-a','run','run-stride-b'],fps:11,loop:true},
  jump:    {poses:['jump','jump','jump','jump'],fps:8,loop:false},
  fall:    {poses:['jump','jump','jump','jump'],fps:7,loop:true},
  land:    {poses:['walk'],fps:8,loop:false},
  block:   {poses:['block','block','block','block'],fps:7,loop:true},
  blockHit:{poses:['block','hurt','block','block'],fps:11,loop:false},
  dodge:   {poses:['walk','run','jump','run'],fps:13,loop:false},
  heal:    {poses:['idle','idle','idle','idle'],fps:5,loop:false},
  hit:     {poses:['hurt','hurt','hurt','walk'],fps:10,loop:false},
  death:   {poses:['hurt','death','death','death'],fps:4,loop:false},
  attack1: {poses:['idle','attack-windup','attack1-mid','attack1','attack-follow','idle'],fps:13,loop:false},
  attack2: {poses:['idle','attack2-ready','attack2-mid','attack2-low','attack2-low','idle'],fps:14,loop:false},
  attack3: {poses:['idle','attack3-ready','attack3-down','attack3-mid','attack3-rise','attack-follow','idle'],fps:14,loop:false}
};
const HITS={
  attack1:{x:18,y:-95,w:72,h:55,damage:20,knockback:220},
  attack2:{x:12,y:-82,w:82,h:48,damage:25,knockback:260},
  attack3:{x:8,y:-95,w:63,h:82,damage:36,knockback:330}
};
const RISING_HIT={x:18,y:-132,w:68,h:82,damage:18,knockback:180};
class DemonicRogueRenderer{
  constructor(){
    this.state='idle';this.frame=0;this.time=0;this.images={};
    for(const pose of new Set(Object.values(ANIMS).flatMap(a=>a.poses))){
      this.images[pose]=assets.image(file(pose));
    }
  }
  setState(next,force=false){
    if(!ANIMS[next])next='idle';
    if(!force&&this.state===next)return;
    this.state=next;this.frame=0;this.time=0;
  }
  update(dt,eventHandler){
    const cfg=ANIMS[this.state];
    if(this.state==='idle'){this.frame=0;this.time=0;return null}
    this.time+=Math.max(0,dt||0);
    const frameDuration=1/cfg.fps;
    while(this.time>=frameDuration){
      this.time-=frameDuration;this.frame++;
      if(this.frame>=cfg.poses.length){
        if(cfg.loop)this.frame=0;
        else{this.frame=cfg.poses.length-1;this.time=0;return 'finished'}
      }
      if(this.frame===(this.state==='attack3'?2:3)&&HITS[this.state])eventHandler?.('hit',{hitbox:HITS[this.state]});
      if(this.state==='attack3'&&this.frame===4)eventHandler?.('hit',{hitbox:RISING_HIT});
      if(this.state==='dodge'&&this.frame===1)eventHandler?.('iframeOn',{});
      if(this.state==='dodge'&&this.frame===3)eventHandler?.('iframeOff',{});
      if(this.state==='heal'&&this.frame===2)eventHandler?.('heal',{});
    }
    return null;
  }
  draw(ctx,x,y,facing=1,height=190,onGround=true){
    const cfg=ANIMS[this.state]||ANIMS.idle;
    const pose=cfg.poses[Math.min(this.frame,cfg.poses.length-1)];
    const image=this.images[pose];
    if(!image?.complete||!image.naturalWidth)return;
    const width=height*image.naturalWidth/image.naturalHeight;
    ctx.save();
    if(onGround){ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(x,y+1,31,4,0,0,Math.PI*2);ctx.fill()}
    if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0)}
    if(this.state==='death')ctx.globalAlpha=Math.max(.15,1-this.frame/4);
    else if(this.state==='dodge')ctx.globalAlpha=.8;
    // Smooth subpixel stride motion without swapping to a differently framed
    // illustration on each step. Keep the foot baseline fixed on the bridge.
    const moving=this.state==='walk';
    const phase=moving?(this.frame+this.time*cfg.fps)*Math.PI/2:0;
    const sway=moving?Math.sin(phase)*height*.006:0;
    const lift=moving?Math.abs(Math.sin(phase))*height*.004:0;
    ctx.drawImage(image,x-width/2+sway,y-height-lift,width,height);
    ctx.restore();
  }
}

return {DemonicRogueRenderer};
})();
const m11=(()=>{
const {assets}=m1;
// FRACTURED V4 — active flat-file Angel Knight renderer, v31.
// Visual-only boot alignment; does not change physics or collision groundY.
const ASSET_VERSION = '73';
// idle_0.png is 900px tall; its last 41 rows are transparent.
const SPRITE_SOURCE_HEIGHT = 900;
const FOOT_TRANSPARENT_SOURCE_PX = 41;
// The existing transparent-padding correction still left a visible gap on the
// mobile bridge. This is a SCREEN/CANVAS pixel inset, applied only to artwork.
// Do not move groundY or the collision plane to compensate for sprite pixels.
const BOOT_CONTACT_INSET_PX = 10;
const files = (prefix, count=4) => Array.from({length:count}, (_,i)=>`${prefix}_${i}.png`);
const SPRITE_ANIMS = {
  idle:     {files:['idle_0.png'],fps:1,loop:true},
  walk:     {files:files('run'),fps:7,loop:true},
  run:      {files:files('run'),fps:10,loop:true},
  jump:     {files:files('jump'),fps:8,loop:false},
  fall:     {files:files('jump'),fps:7,loop:true},
  land:     {files:['idle_0.png'],fps:8,loop:false},
  block:    {files:files('block'),fps:7,loop:true},
  blockHit: {files:files('block'),fps:11,loop:false},
  dodge:    {files:files('dodge'),fps:13,loop:false},
  heal:     {files:files('idle'),fps:5,loop:false},
  hit:      {files:files('block'),fps:10,loop:false},
  death:    {files:files('block'),fps:4,loop:false},
  attack1:  {files:files('attack1'),fps:11,loop:false},
  attack2:  {files:files('attack2'),fps:12,loop:false},
  attack3:  {files:files('attack3'),fps:12,loop:false},
  ability1: {files:Array.from({length:4},(_,i)=>`celestial_light_frame_0${i+1}.png`),fps:9,loop:false},
  ability2: {files:Array.from({length:4},(_,i)=>`halo_bolt_frame_0${i+1}.png`),fps:10,loop:false,durations:[.20,.25,1.25,.20]},
  ability3: {files:Array.from({length:4},(_,i)=>`wing_burst_frame_0${i+1}.png`),fps:9,loop:false}
};
class AngelKnightSpriteRenderer {
  constructor(){
    this.images = {};
    this.state = 'idle';
    this.frame = 0;
    this.time = 0;
    const imageCache = new Map();
    for (const [state, cfg] of Object.entries(SPRITE_ANIMS)) {
      this.images[state] = cfg.files.map(file => {
        if (!imageCache.has(file)) {
          const img = assets.image(`./${file}?v=${ASSET_VERSION}`);
          imageCache.set(file, img);
        }
        return imageCache.get(file);
      });
    }
  }
  setState(next, force=false){
    if (!SPRITE_ANIMS[next]) next = 'idle';
    if (!force && this.state === next) return;
    this.state = next;
    this.frame = 0;
    this.time = 0;
  }
  update(dt, eventHandler){
    const cfg = SPRITE_ANIMS[this.state] || SPRITE_ANIMS.idle;
    if (this.state === 'idle') {
      this.frame = 0;
      this.time = 0;
      return null;
    }
    this.time += Math.max(0, dt || 0);
    const frameDuration=()=>cfg.durations?.[this.frame] ?? 1/cfg.fps;
    while (this.time >= frameDuration()) {
      this.time -= frameDuration();
      this.frame++;
      if (this.frame >= cfg.files.length) {
        if (cfg.loop) this.frame = 0;
        else {
          this.frame = cfg.files.length - 1;
          this.time = 0;
          return 'finished';
        }
      }
      if (this.state==='attack1' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:18,y:-95,w:72,h:55,damage:20,knockback:220}});
      if (this.state==='attack2' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:12,y:-100,w:78,h:60,damage:25,knockback:260}});
      if (this.state==='attack3' && this.frame===2)
        eventHandler?.('hit',{hitbox:{x:10,y:-150,w:70,h:135,damage:36,knockback:330}});
      if (this.state==='dodge' && this.frame===1) eventHandler?.('iframeOn',{});
      if (this.state==='dodge' && this.frame===3) eventHandler?.('iframeOff',{});
      if (this.state==='heal' && this.frame===2) eventHandler?.('heal',{});
    }
    return null;
  }
  draw(ctx,x,groundY,facing=1,targetHeight=190,onGround=true){
    const frames = this.images[this.state] || this.images.idle;
    const img = frames[Math.min(this.frame,frames.length-1)];
    if (!img || !img.complete || !img.naturalWidth) return;
    // Ability frames are individually cut out and have varying image dimensions.
    // Anchor the knight's body instead of stretching the image to a square,
    // otherwise the knight shrinks and drifts as the VFX expands.
    const isAbility=/^ability[123]$/.test(this.state);
    if(this.state==='ability2'){
      // Halo-to-boot landmarks exclude the raised hand, beam, and stray glow.
      // Normal idle art occupies 720 of its 900 source pixels and ends at groundY+10.
      const poses=[
        {head:170,feet:550,x:222},
        {head:104,feet:477,x:238},
        {head:150,feet:518,x:222},
        {head:36,feet:424,x:240}
      ];
      const pose=poses[Math.min(this.frame,3)];
      const scale=targetHeight*.8/(pose.feet-pose.head);
      ctx.save();
      if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0);}
      ctx.drawImage(img,x-pose.x*scale,groundY+BOOT_CONTACT_INSET_PX-pose.feet*scale,img.naturalWidth*scale,img.naturalHeight*scale);
      ctx.restore();return;
    }
    if(isAbility){
      const anchors={
        ability1:[.51,.49,.40,.55],
        ability2:[.46,.47,.29,.53],
        ability3:[.54,.51,.44,.52]
      };
      const ratio=targetHeight/680;
      const width=img.naturalWidth*ratio,height=img.naturalHeight*ratio;
      const anchorX=anchors[this.state][Math.min(this.frame,3)]*width;
      ctx.save();
      if(facing<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0);}
      ctx.drawImage(img,x-anchorX,groundY-height+8,width,height);
      ctx.restore();
      return;
    }
    const width=targetHeight, left=x-width/2;
    const footPadding=targetHeight*FOOT_TRANSPARENT_SOURCE_PX/SPRITE_SOURCE_HEIGHT;
    // One visual offset for all states, including airborne frames: no physics,
    // jump-arc, hitbox, camera, bridge, or input changes.
    const top=groundY-targetHeight+footPadding+BOOT_CONTACT_INSET_PX;
    ctx.save();
    if (onGround) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse(x, groundY + 1, 37, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (facing<0) { ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0); }
    ctx.drawImage(img,left,top,width,targetHeight);
    ctx.restore();
  }
}

return {SPRITE_ANIMS,AngelKnightSpriteRenderer};
})();
const m8=(()=>{
const {applyEnhancements,loadEnhancements}=m9;
const {DemonicRogueRenderer}=m10;
const { AngelKnightSpriteRenderer,SPRITE_ANIMS }=m11;

class Player{
  constructor(x=300,y=500,build={}){
    this.origin=build.origin||'angelic-knight';
    this.x=x;
    this.y=y;
    this.groundY=y;
    this.obstacles=[];

    this.vx=0;
    this.vy=0;
    this.facing=1;

    this.speed=185;
    this.runSpeed=245;
    this.jumpPower=620;
    this.gravity=1750;

    this.onGround=true;
    this.dead=false;
    this.isBlocking=false;
    this.invulnerable=false;

    this.maxHp=100;
    this.hp=100;
    this.maxStamina=100;
    this.stamina=100;

    this.state="idle";
    this.comboStep=0;
    this.comboWindow=0;
    this.comboGrace=0;
    this.attackQueued=false;
    this.activeHitbox=null;
    this.abilityImpact=null;

    this.input={
      moveX:0,
      moveY:0,
      jump:false,
      attack:false,
      block:false,
      dodge:false,
      heal:false
    };

    this.renderer=build.origin==="demonic-rogue"?new DemonicRogueRenderer():new AngelKnightSpriteRenderer();
    if(this.origin==="demonic-rogue"){this.speed=195;this.runSpeed=255;}
    applyEnhancements(this,loadEnhancements(this.origin));
  }

  setState(next,force=false){
    if(this.state===next&&!force)return;
    this.activeHitbox=null;
    this.state=next;
    if(!next.startsWith('ability'))this.abilityImpact=null;
    this.renderer.setState(next,force);
  }

  handleAnimationEvent(name,frame){
    if(name==="iframeOn")this.invulnerable=true;
    if(name==="iframeOff")this.invulnerable=false;
    if(name==="heal")this.hp=Math.min(this.maxHp,this.hp+28);
    if(name==="hit")this.activeHitbox={...frame.hitbox,ttl:.09};
  }

  castAbility(index){
    if(this.origin!=='angelic-knight'||this.dead||!Number.isInteger(index)||index<0||index>2)return false;
    if(!this.onGround||!['idle','walk','run','block'].includes(this.state))return false;
    if(!this.renderer.images[`ability${index+1}`]?.every(img=>img.complete&&img.naturalWidth>0))return false;
    this.isBlocking=false;
    this.attackQueued=false;this.comboStep=0;this.comboGrace=0;
    for(const k of ['attack','jump','dodge','heal','block'])this.input[k]=false;
    this.vx=0;
    this.abilityImpact={index,triggered:false};
    this.setState(`ability${index+1}`,true);
    return true;
  }

  requestAttack(){
    if(this.dead||this.state.startsWith('ability')||this.stamina<8)return;

    if(this.state.startsWith("attack")){
      if(this.origin==='demonic-rogue'||this.comboWindow>0)this.attackQueued=true;
      return;
    }

    const followup=this.origin==='demonic-rogue'&&this.comboGrace>0&&this.comboStep>0&&this.comboStep<3;
    const step=followup?this.comboStep+1:1;
    this.stamina-=step===3?11:8;
    this.comboStep=step;
    this.comboWindow=.45;
    this.comboGrace=0;
    this.attackQueued=false;
    this.setState(`attack${step}`,true);
  }

  dodge(){
    if(this.dead||this.state.startsWith('ability')||this.stamina<20)return;
    this.stamina-=20;

    const dir=Math.abs(this.input.moveX)>.08?Math.sign(this.input.moveX):this.facing;
    this.facing=dir;
    this.vx=dir*470;
    this.setState("dodge",true);
  }

  heal(){
    if(this.dead||this.state.startsWith('ability')||this.hp>=this.maxHp||this.stamina<18)return;
    this.stamina-=18;
    this.setState("heal",true);
  }

  jump(){
    if(this.dead||this.state.startsWith('ability')||!this.onGround)return;
    this.onGround=false;
    this.vy=-this.jumpPower;
    this.setState("jump",true);
  }

  update(dt){
    this.stamina=Math.min(this.maxStamina,this.stamina+17*dt);
    if(this.comboWindow>0)this.comboWindow-=dt;
    if(this.comboGrace>0){
      this.comboGrace=Math.max(0,this.comboGrace-dt);
      if(this.comboGrace===0)this.comboStep=0;
    }

    if(this.activeHitbox){
      this.activeHitbox.ttl-=dt;
      if(this.activeHitbox.ttl<=0)this.activeHitbox=null;
    }

    const result=this.renderer.update(dt,(name,frame)=>this.handleAnimationEvent(name,frame));
    if(this.origin==='angelic-knight'&&this.abilityImpact&&!this.abilityImpact.triggered&&this.renderer.frame>=2){
      this.abilityImpact.triggered=true;
      this.onAbilityImpact?.(this.abilityImpact.index);
    }

    if(this.dead)return;

    if(result==="finished"){
      if(this.state==="attack1"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=2;
        this.comboWindow=.42;
        this.comboGrace=0;
        this.stamina=Math.max(0,this.stamina-8);
        this.setState("attack2",true);
      }else if(this.state==="attack2"&&this.attackQueued){
        this.attackQueued=false;
        this.comboStep=3;
        this.comboWindow=.40;
        this.comboGrace=0;
        this.stamina=Math.max(0,this.stamina-11);
        this.setState("attack3",true);
      }else if(this.state==="jump"){
        this.setState("fall",true);
      }else if(["attack1","attack2","attack3","ability1","ability2","ability3","dodge","heal","blockHit","hit","land"].includes(this.state)){
        const completed=this.state;
        this.attackQueued=false;
        if(this.origin==='demonic-rogue'&&(completed==='attack1'||completed==='attack2'))this.comboGrace=.75;
        else{this.comboStep=0;this.comboGrace=0;}
        this.invulnerable=false;
        this.setState("idle",true);
      }
    }

    if(this.input.attack){this.input.attack=false;this.requestAttack()}
    if(this.input.dodge){this.input.dodge=false;this.dodge()}
    if(this.input.heal){this.input.heal=false;this.heal()}
    if(this.input.jump){this.input.jump=false;this.jump()}

    this.isBlocking=!this.state.startsWith('ability')&&!!this.input.block&&this.onGround&&!this.state.startsWith("attack")&&this.state!=="dodge";

    if(this.isBlocking){
      if(this.state!=="block")this.setState("block");
    }else if(this.state==="block"){
      this.setState("idle");
    }

    const locked=["attack1","attack2","attack3","ability1","ability2","ability3","dodge","heal","blockHit","hit","death"].includes(this.state);
    const mx=Math.max(-1,Math.min(1,this.input.moveX));

    if(!locked&&!this.isBlocking){
      if(Math.abs(mx)>.08){
        this.facing=Math.sign(mx);
        // A thumb near the run threshold moves slightly on every frame.
        // Give only the Rogue a wider gap before switching poses.
        const running=this.origin==='demonic-rogue'
          ? Math.abs(mx)>(this.state==='run'?.70:.86)
          : Math.abs(mx)>.78;
        const topSpeed=running?this.runSpeed:this.speed;
        const desired=mx*topSpeed;
        this.vx+=(desired-this.vx)*Math.min(1,14*dt);

        if(this.onGround){
          this.setState(running?"run":"walk");
        }
      }else{
        this.vx+=(0-this.vx)*Math.min(1,18*dt);

        // Snap tiny residual velocity to zero so the world position cannot
        // drift by sub-pixels while standing still.
        if(Math.abs(this.vx)<0.5)this.vx=0;

        if(this.onGround&&!["land"].includes(this.state))this.setState("idle");
      }
    }else if(this.state!=="dodge"){
      this.vx*=Math.max(0,1-5*dt);
      if(Math.abs(this.vx)<0.5)this.vx=0;
    }

    const previousX=this.x;
    this.x+=this.vx*dt;
    const radius=this.renderHeight*.14;
    for(const obstacle of this.obstacles){
      // Solid side until the character's feet clear the climbable top.
      if(this.y<=this.groundY-obstacle.h+3)continue;
      if(this.x+radius<=obstacle.x||this.x-radius>=obstacle.x+obstacle.w)continue;
      const left=obstacle.x-radius,right=obstacle.x+obstacle.w+radius;
      this.x=previousX<=left?left:previousX>=right?right:
        Math.abs(previousX-left)<Math.abs(previousX-right)?left:right;
      this.vx=0;
    }

    // Walking off an obstacle begins a real fall; standing on it permits jumping.
    if(this.onGround&&this.y<this.groundY-2&&!this.obstacles.some(o=>
      this.x>=o.x&&this.x<=o.x+o.w&&Math.abs(this.y-(this.groundY-o.h))<3)){
      this.onGround=false;this.vy=0;
    }
    if(!this.onGround){
      const previousY=this.y;
      this.vy+=this.gravity*dt;
      this.y+=this.vy*dt;
      if(this.vy>60&&!this.state.startsWith("attack")&&this.state!=="dodge")this.setState("fall");
      if(this.vy>=0){
        for(const obstacle of this.obstacles){
          const top=this.groundY-obstacle.h;
          if(this.x>=obstacle.x&&this.x<=obstacle.x+obstacle.w&&previousY<=top+2&&this.y>=top){
            this.y=top;this.vy=0;this.onGround=true;
            if(!locked)this.setState("land",true);
            break;
          }
        }
      }
      if(!this.onGround&&this.y>=this.groundY){
        this.y=this.groundY;this.vy=0;this.onGround=true;
        if(!locked)this.setState("land",true);
      }
    }

    const margin=45;
    const maxX=Math.max(margin,(this.worldWidth || window.innerWidth)-margin);
    this.x=Math.max(margin,Math.min(maxX,this.x));
  }

  get renderHeight(){
    const height=Math.max(145,Math.min(210,window.innerHeight*.17));
    // Knight PNGs have about 20% transparent padding; Rogue PNGs fill the frame.
    return this.origin==='demonic-rogue'?height*.80:height;
  }

  get hurtbox(){
    const h=this.renderHeight;
    return {x:this.x-h*.14,y:this.y-h*.62,w:h*.28,h:h*.60};
  }

  draw(ctx){
    this.renderer.draw(ctx,this.x,this.y,this.facing,this.renderHeight,this.onGround);
  }

  damage(amount,fromX=this.x){
    if(this.dead||this.invulnerable)return false;

    if(this.isBlocking){
      this.stamina=Math.max(0,this.stamina-12);
      this.setState("blockHit",true);
      return true;
    }

    this.hp=Math.max(0,this.hp-amount*(1-this.damageResistance));
    this.facing=fromX<this.x?-1:1;

    if(this.hp<=0){
      this.dead=true;
      this.vx=0;
      this.setState("death",true);
    }else{
      this.setState("hit",true);
    }

    return true;
  }

  getWorldHitbox(){
    const contactFrame=this.origin==='demonic-rogue'
      ? (this.state==='attack3' ? [2,4].includes(this.renderer.frame) : this.renderer.frame===3)
      : this.renderer.frame===2;
    if(!this.activeHitbox||!this.state.startsWith("attack")||!contactFrame)return null;
    const h=this.activeHitbox;
    // Weapon bounds use the same scale as the visible sprite.
    const scale=this.renderHeight/190;

    return{
      x:this.facing>0?this.x+h.x*scale:this.x-(h.x+h.w)*scale,
      y:this.y+h.y*scale,
      w:h.w*scale,
      h:h.h*scale,
      damage:h.damage*this.damageMultiplier,
      knockback:h.knockback
    };
  }
}

return {Player};
})();
const m12=(()=>{
// Foreground props share the player's world coordinates and bridge baseline.
const load=name=>{
  const image=new Image();
  image.src=name==='rubble'?'./world-ruin-v53-rubble.png?v=54':'./world-ruin-v51-arch.png?v=54';
  image.onerror=()=>console.error(`[FRACTURED] Missing ruin art: ${name}`);
  return image;
};

class Ruins{
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
    // Leave the final stretch clear for the cathedral's walk-in opening.
    props.push({kind:'arch',x:first+span*.62,w:archHeight*.96,h:archHeight,groundY,solid:false});
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

return {Ruins};
})();
const m13=(()=>{
const {assets}=m1;
// Sprite feet share a fixed pivot; route elevations use the same solids as the player.
class SvarNpc {
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

return {SvarNpc};
})();
const m14=(()=>{
const NODES={
  cathedral: {
    speech:"The beasts are just ahead. I barely escaped the castle through this cathedral. There’s a portal further inside, and those demons are crawling their way out. This is as far as I go. Be ready before you step through that door.",
    choices:[['What did you see at the portal?','portal'],['How did you escape?','escape'],['I’ll take it from here.','leave']]
  },
  portal: {
    speech:"A tear in the world. Those clawed beasts were dragging themselves through it, one after another. The portal is still open. Whatever you hear beyond this door, keep your weapons ready.",
    choices:[['Tell me about your escape.','escape'],['Back','greeting'],['I’ll take it from here.','leave']]
  },
  escape: {
    speech:"I fled the castle through the cathedral. I could hear their claws on the stone behind me. I barely made it outside. I won’t go back in, but you know the way now.",
    choices:[['Tell me about the portal.','portal'],['Back','greeting'],['I’ll take it from here.','leave']]
  },
  greeting: {
    speech:"Well, another soul on Aradavia's broken road. The sky has been tearing since the Thirteenth Scholar's ritual. I am S’var. Come closer; I can tell you what happened and how to cross these ruins.",
    choices:[['What happened to Aradavia?','history'],['Who are you?','identity'],['Show me how to survive.','tutorial'],['I’m ready to go.','leave']]
  },
  history: {
    speech:"Aradavia was a golden nation of magic and machines, governed by thirteen arcane scholars. Deep beneath the earth, they found the Black Gem. They swore to seal it in the void. One of them wanted its power for himself.",
    choices:[['What did he do?','fall'],['How do I cross the ruins?','tutorial'],['Back','greeting']]
  },
  fall: {
    speech:"During the sealing, the Thirteenth Scholar tethered the darkness to himself. The gem vanished, but its darkness remained. He slew the other scholars, stole their power, and cast a forgotten curse. The earth and sky cracked; creatures poured through. The cathedral ahead may still hold a trace of the seal.",
    choices:[['Why was I drawn here?','origin'],['How do I reach the cathedral?','tutorial'],['I’m ready to go.','leave']]
  },
  identity: {
    speech:"S’var. I was the Council's fool. They seldom listened to a jester, which may be why I am still here to tell you what they did.",
    choices:[['Tell me about the Black Gem.','history'],['Teach me the path.','tutorial'],['Back','greeting']]
  },
  origin: {
    speech:null,
    choices:[['Show me the way.','tutorial'],['I’m ready to go.','leave'],['Back','greeting']]
  },
  tutorial: {
    speech:"Use the left pad to move. Jump onto the broken stones to climb over them. ATK strikes, BLK guards, and DODGE gets you clear. HEAL costs stamina. Your three abilities sit in slots I, II, and III; each needs a few seconds to recharge. Follow the path to the cathedral door.",
    choices:[['What happened to Aradavia?','history'],['I’m ready to go.','leave'],['Back','greeting']]
  }
};

class SvarConversation {
  constructor(onLeave) {
    this.root=document.getElementById('svar-dialogue');
    this.speech=document.getElementById('svar-speech');
    this.choices=document.getElementById('svar-choices');
    this.prompt=document.getElementById('svar-prompt');
    this.target=document.getElementById('svar-target');
    this.canInteract=false;
    this.promptDismissed=false;
    this.doorPromptDismissed=false;
    this.atDoor=false;
    try{this.doorPromptDismissed=localStorage.getItem('fractured.svar.doorPromptDismissed')==='1'}catch{}
    try{this.promptDismissed=localStorage.getItem('fractured.svar.promptDismissed')==='1'}catch{}
    this.onLeave=onLeave;
    this.opened=false;
    this.finished=false;
    this.origin='angelic-knight';
    this.root.querySelector('#svar-close').addEventListener('click',()=>this.close(false));
    const interact=()=>{if(this.canInteract)this.open(this.origin)};
    this.prompt.addEventListener('click',interact);
    this.target.addEventListener('click',interact);
    this.root.addEventListener('keydown',e=>{if(e.key==='Escape')this.close(false)});
  }
  open(origin) {
    if(this.opened)return;
    this.origin=origin;
    this.opened=true;
    if(this.atDoor)this.doorPromptDismissed=true;else this.promptDismissed=true;
    const key=this.atDoor?'fractured.svar.doorPromptDismissed':'fractured.svar.promptDismissed';
    try{localStorage.setItem(key,'1')}catch{}
    this.prompt.hidden=true;
    this.target.hidden=true;
    this.canInteract=false;
    this.root.hidden=false;
    this.root.setAttribute('aria-hidden','false');
    this.show('greeting');
    this.root.querySelector('#svar-close').focus();
  }
  show(id) {
    if(id==='leave'){this.close(true);return}
    if(id==='greeting'&&this.atDoor)id='cathedral';
    const node=NODES[id];
    this.speech.textContent=id==='origin'
      ? this.origin==='demonic-rogue'
        ? "You crawled out of Hell and turned against its reign. That choice may be the light Aradavia needs. Reach the cathedral and learn what remains of the seal."
        : "You fell through the broken heavens to restore order. Reach the cathedral and learn what remains of the seal."
      :node.speech;
    this.choices.replaceChildren();
    for(const [label,next] of node.choices){
      const button=document.createElement('button');
      button.type='button';button.textContent=label;
      button.addEventListener('click',()=>this.show(next));
      this.choices.appendChild(button);
    }
  }
  close(finished) {
    if(!this.opened)return;
    this.opened=false;
    this.finished ||= finished;
    this.root.hidden=true;
    this.root.setAttribute('aria-hidden','true');
    this.onLeave?.(this.finished);
  }
  updatePrompt(npc,player,cameraX,scene,blocked,viewportHeight) {
    if(!this.opened)this.atDoor=!!npc?.arrived;
    const show=!!(scene==='bridge'&&!blocked&&!this.opened&&npc?.canTalk(player));
    this.canInteract=show;
    this.prompt.hidden=!show||(this.atDoor?this.doorPromptDismissed:this.promptDismissed);
    this.target.hidden=!show;
    if(show){
      const x=npc.x-cameraX,h=npc.height(viewportHeight);
      this.prompt.style.left=`${Math.max(76,Math.min(innerWidth-76,x))}px`;
      this.prompt.style.top=`${Math.max(12,npc.y-h-44)}px`;
      Object.assign(this.target.style,{left:`${x-48}px`,top:`${npc.y-h}px`,width:'96px',height:`${h}px`});
    }
  }
}

return {SvarConversation};
})();
const m15=(()=>{
// Side-view cathedral wall at the end of the outdoor bridge.
class CathedralGate {
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

return {CathedralGate};
})();
const m16=(()=>{
const IMAGE_W=1983,IMAGE_H=793;
class CathedralInterior {
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

return {CathedralInterior};
})();
const m17=(()=>{
function bindControls(player){
  const $=id=>document.getElementById(id),pad=$("move-pad"),knob=$("move-knob");let padPointer=null;
  const updatePad=e=>{const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.32,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max}knob.style.transform=`translate(${dx}px,${dy}px)`;player.input.moveX=Math.max(-1,Math.min(1,dx/max));player.input.moveY=Math.max(-1,Math.min(1,dy/max))};
  pad.onpointerdown=e=>{padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);updatePad(e)};pad.onpointermove=e=>{if(e.pointerId===padPointer)updatePad(e)};const endPad=e=>{if(e.pointerId!==padPointer)return;padPointer=null;knob.style.transform="translate(0,0)";player.input.moveX=0;player.input.moveY=0};pad.onpointerup=endPad;pad.onpointercancel=endPad;
  const pulse=(id,key)=>{const b=$(id);b.onpointerdown=e=>{e.preventDefault();b.classList.add("pressed");player.input[key]=true};b.onpointerup=()=>b.classList.remove("pressed");b.onpointercancel=()=>b.classList.remove("pressed")};pulse("jump-btn","jump");pulse("attack-btn","attack");pulse("dodge-btn","dodge");pulse("heal-btn","heal");
  const block=$("block-btn");block.onpointerdown=e=>{e.preventDefault();block.classList.add("pressed");player.input.block=true};const off=()=>{block.classList.remove("pressed");player.input.block=false};block.onpointerup=off;block.onpointercancel=off;
  const down=new Set();addEventListener("keydown",e=>{if(down.has(e.code))return;down.add(e.code);if(["KeyA","ArrowLeft"].includes(e.code))player.input.moveX=-1;if(["KeyD","ArrowRight"].includes(e.code))player.input.moveX=1;if(e.code==="Space")player.input.jump=true;if(e.code==="KeyJ")player.input.attack=true;if(e.code==="KeyK")player.input.dodge=true;if(e.code==="KeyH")player.input.heal=true;if(e.code==="KeyL")player.input.block=true});addEventListener("keyup",e=>{down.delete(e.code);if(["KeyA","ArrowLeft"].includes(e.code)&&player.input.moveX<0)player.input.moveX=0;if(["KeyD","ArrowRight"].includes(e.code)&&player.input.moveX>0)player.input.moveX=0;if(e.code==="KeyL")player.input.block=false});
}

return {bindControls};
})();
const m18=(()=>{
const {SLOTS,loadEnhancements,saveEnhancements,applyEnhancements,bonuses}=m9;
const {abilityCatalog,loadAbilities,saveAbilities,assignAbility}=m4;
function initMenus(getBuild){
 const $=id=>document.getElementById(id),menu=$('rpgMenu'),picker=$('enh-picker');
 let origin='angelic-knight',loadout={},abilities=[],selection=null,returnFocus=null,previewRenderer=null,previewOwner=null,last=0,lastPreview=0;
 const player=()=>window.FRACTURED?.player;
 function clearInput(){const p=player();if(p){p.vx=0;for(const k in p.input)p.input[k]=typeof p.input[k]==='boolean'?false:0}}
 function button(label,cls,click){const b=document.createElement('button');b.type='button';b.className=cls;b.onclick=click;b.textContent=label;return b}
 function slotButton(icon,name,sub,click){const wrap=document.createElement('div');wrap.className='enh-slot-wrap';const b=button(icon,'enh-circle',()=>{returnFocus=b;click()});b.setAttribute('aria-label',name+': '+sub);b.title=name+': '+sub;const title=document.createElement('b');title.textContent=name;const small=document.createElement('small');small.textContent=sub;wrap.append(b,title,small);return wrap}
 function refresh(){
  origin=getBuild()?.origin||player()?.origin||'angelic-knight';loadout=loadEnhancements(origin);abilities=loadAbilities(origin);
  $('bloodlineText').textContent=origin==='demonic-rogue'?'Demonic Rogue':'Angelic Knight';$('bloodlineTier').textContent='LEVEL 1';
  $('enhancement-slots').replaceChildren(...SLOTS.map(s=>{const item=s.items.find(i=>i.id===loadout[s.id]);return slotButton(s.icon,s.name,item?.name||'Empty',()=>openPicker('enhancement',s.id))}));
  const catalog=abilityCatalog(origin);
  $('character-abilities').replaceChildren(...abilities.map((id,i)=>{const a=catalog.find(a=>a.id===id);return slotButton(a?.icon||'+',['I','II','III'][i],a?.name||'Empty',()=>openPicker('ability',i))}));
  const b=bonuses(loadout),p=player();
  $('statColumns').replaceChildren(...[[p?.maxHp||100,'HEALTH'],[p?.maxStamina||100,'STAMINA'],['+'+Math.round(b.damage*100)+'%','DAMAGE'],[Math.round(b.resist*100)+'%','RESISTANCE'],['+'+Math.round(b.speed*100)+'%','MOVEMENT']].map(([v,n])=>{const d=document.createElement('div');d.className='enh-stat';const strong=document.createElement('b');strong.textContent=v;const span=document.createElement('span');span.textContent=n;d.append(strong,span);return d}));
  const inv=$('enh-inventory');inv.replaceChildren(...SLOTS.map(s=>button(s.icon+' '+s.name+' · '+s.items.length+' enhancements','enh-category',()=>openPicker('enhancement',s.id))),...abilities.map((id,i)=>button('Ability '+['I','II','III'][i]+' · '+(catalog.find(a=>a.id===id)?.name||'Empty'),'enh-category',()=>openPicker('ability',i))));
 }
 function closePicker(){picker.hidden=true;$('characterPage').inert=false;$('inventoryPage').inert=false;menu.querySelector('.menuTop').inert=false;returnFocus?.focus()}
 function commit(id){
  if(selection.kind==='enhancement'){if(id)loadout[selection.key]=id;else delete loadout[selection.key];saveEnhancements(origin,loadout);applyEnhancements(player(),loadout)}
  else{abilities=assignAbility(origin,abilities,selection.key,id);saveAbilities(origin,abilities);window.dispatchEvent(new CustomEvent('fractured:abilities-changed',{detail:{origin,slots:abilities}}))}
  const current={...selection};refresh();openPicker(current.kind,current.key);$('enh-feedback').textContent=id?'Equipped.':'Slot cleared.';
 }
 function openPicker(kind,key){
  selection={kind,key};picker.hidden=false;$('characterPage').inert=true;$('inventoryPage').inert=true;menu.querySelector('.menuTop').inert=true;$('enh-feedback').textContent='';
  const slot=SLOTS.find(s=>s.id===key),items=kind==='enhancement'?slot.items:abilityCatalog(origin);
  $('enh-picker-title').textContent=kind==='enhancement'?slot.name+' enhancements':'Ability '+['I','II','III'][key];
  $('enh-picker-note').textContent=kind==='enhancement'?'Choose one enhancement for this slot.':'Choose an ability. Selecting one already equipped swaps the slots.';
  $('enh-options').replaceChildren(...items.map(item=>{const active=kind==='enhancement'?loadout[key]===item.id:abilities[key]===item.id;const b=button('','enh-option'+(active?' equipped':''),()=>commit(item.id));b.setAttribute('aria-pressed',String(active));const name=document.createElement('b');name.textContent=item.name+(active?' · Equipped':'');const desc=document.createElement('small');desc.textContent=item.text+(kind==='ability'?' · '+item.cooldown+'s cooldown':'');b.append(name,desc);return b}));
  if(!items.length){const p=document.createElement('p');p.textContent='No abilities learned for this character yet.';$('enh-options').append(p)}
  $('enh-remove').textContent=kind==='ability'?'Clear ability slot':'Remove enhancement';$('enh-remove').onclick=()=>commit(null);$('enh-picker-close').focus();
 }
 function open(page){refresh();menu.classList.add('open');menu.setAttribute('aria-hidden','false');clearInput();closePicker();for(const p of menu.querySelectorAll('.menuPage'))p.classList.toggle('active',p.id===(page==='inventory'?'inventoryPage':'characterPage'));for(const t of menu.querySelectorAll('.menuTab'))t.classList.toggle('active',t.dataset.page===page);menu.scrollTop=0;if(previewOwner!==player()&&player()){previewOwner=player();previewRenderer=new (player().renderer.constructor)();previewRenderer.setState('idle',true)}$('menu-close').focus()}
 function close(){closePicker();menu.classList.remove('open');menu.setAttribute('aria-hidden','true');clearInput();$('menu-character').focus()}
 $('menu-character').onclick=()=>open('character');$('menu-inventory').onclick=()=>open('inventory');$('menu-close').onclick=close;$('enh-picker-close').onclick=closePicker;
 menu.querySelectorAll('.menuTab').forEach(b=>b.onclick=()=>open(b.dataset.page));
 picker.addEventListener('click',e=>{if(e.target===picker)closePicker()});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();picker.hidden?close():closePicker()}if(e.key==='Tab'&&!picker.hidden){const all=[...picker.querySelectorAll('button')],first=all[0],end=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus()}}});
 function preview(now){if(!document.hidden&&now-lastPreview>=1000/15&&menu.classList.contains('open')&&previewRenderer&&$('characterPage').classList.contains('active')){lastPreview=now;const c=$('character-preview'),ctx=c.getContext('2d');ctx.clearRect(0,0,600,600);previewRenderer.update(Math.min(.04,(now-last)/1000||.016),()=>{});previewRenderer.draw(ctx,300,565,1,origin==='demonic-rogue'?440:530,true)}last=now;requestAnimationFrame(preview)}requestAnimationFrame(preview);
}

return {initMenus};
})();
const m19=(()=>{
// FRACTURED V4 v19 — original supplied panorama, uncropped, proportionate, shorter world.
// The source is 3:1. The entire image fits above the bridge; the camera scrolls
// across its natural width instead of stretching it to an arbitrary 10-screen map.
const WORLD_SCREENS = 4; // nominal mobile length; actual width is responsive.
const ASPECT = 3;
const GROUND_RATIO = .755; // matches main.js and #stone-bridge in styles.css
const BACKGROUND_SRC = './fractured_world_v17.webp?v=17';
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

class WorldExtension {
  constructor() {
    this.viewportWidth = innerWidth;
    this.worldWidth = innerWidth;
    this.cameraX = 0;
    this.art = document.getElementById('world-art');
    this.background = document.getElementById('world-background');
    if (!this.art || !this.background) {
      throw new Error('FRACTURED: missing #world-art or #world-background');
    }

    const track = document.createElement('div');
    track.id = 'fractured-world-track';
    Object.assign(track.style, {
      position: 'absolute', left: '0', top: '0', zIndex: '0',
      overflow: 'hidden', pointerEvents: 'none', willChange: 'transform',
      background: '#100816'
    });
    this.background.parentNode.insertBefore(track, this.background);
    track.appendChild(this.background);
    this.track = track;

    this.background.src = BACKGROUND_SRC;
    this.background.alt = '';
    this.background.draggable = false;
    this.background.decoding = 'async';
    // Override v15's CSS cover + scale(1.01) so no rows are cropped.
    Object.assign(this.background.style, {
      position: 'absolute', inset: 'auto', top: '0', left: '0',
      display: 'block', maxWidth: 'none', objectFit: 'contain',
      objectPosition: 'left top', transform: 'none',
      imageRendering: 'auto', pointerEvents: 'none', userSelect: 'none'
    });

    // A separate transparent viewport canvas: the source panorama is never
    // rescaled, cropped, mirrored, or redrawn by the animation layer.
    this.fx = document.createElement('canvas');
    this.fx.id = 'fractured-atmosphere';
    this.fx.setAttribute('aria-hidden', 'true');
    Object.assign(this.fx.style, {
      position:'absolute', left:'0', top:'0', zIndex:'1',
      pointerEvents:'none', display:'block', background:'transparent'
    });
    this.art.insertBefore(this.fx, this.art.querySelector('.world-grade'));
    this.fxCtx = this.fx.getContext('2d', {alpha:true});
    this.lastFxTime = -Infinity;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.bridgeFace = document.querySelector('#stone-bridge .bridge-face');
    this.bridgeLip = document.querySelector('#stone-bridge .bridge-lip');
    // V19: use the supplied gothic bridge photograph as the physical ground.
    // The top of the image is the walking surface at 75.5% viewport height.
    // Only the bridge section is extracted; the existing panorama stays intact.
    if (this.bridgeFace) Object.assign(this.bridgeFace.style, {
      inset: '0',
      backgroundImage: 'url(./fractured_bridge_v19.webp?v=19)',
      backgroundSize: 'auto 100%',
      backgroundRepeat: 'repeat-x',
      backgroundPosition: '0 0',
      filter: 'none',
      imageRendering: 'auto'
    });
    if (this.bridgeLip) this.bridgeLip.style.display = 'none';
    this.resize();
  }

  resize() {
    this.viewportWidth = innerWidth;
    const viewportHeight = this.art.getBoundingClientRect().height || innerHeight;
    const sceneHeight = viewportHeight * GROUND_RATIO;
    const imageWidth = sceneHeight * ASPECT;
    // No fabricated extra map: on phones the world is approximately 3–5 screens.
    // For wider desktop windows, center the entire image without stretching it.
    this.worldWidth = Math.max(this.viewportWidth, imageWidth);
    Object.assign(this.track.style, {
      width: `${this.worldWidth}px`, height: `${sceneHeight}px`
    });
    Object.assign(this.background.style, {
      width: `${imageWidth}px`, height: `${sceneHeight}px`,
      left: `${(this.worldWidth - imageWidth) / 2}px`
    });
    this.fxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.fx.width = Math.max(1, Math.round(this.viewportWidth * this.fxDpr));
    this.fx.height = Math.max(1, Math.round(sceneHeight * this.fxDpr));
    this.fx.style.width = `${this.viewportWidth}px`;
    this.fx.style.height = `${sceneHeight}px`;
    this.fxCtx.setTransform(this.fxDpr,0,0,this.fxDpr,0,0);
    this.sceneHeight = sceneHeight;
    this.imageWidth = imageWidth;
    this.imageLeft = (this.worldWidth - imageWidth)/2;
    this.setCamera(this.cameraX);
    this.lastFxTime = -Infinity;
  }

  setCamera(x) {
    const dpr = Math.max(1, devicePixelRatio || 1);
    const limit = Math.max(0, this.worldWidth - this.viewportWidth);
    this.cameraX = Math.round(clamp(x, 0, limit) * dpr) / dpr;
    this.track.style.transform = `translate3d(${-this.cameraX}px,0,0)`;
    // Scroll the bridge texture with the world, not with the player's viewport.
    if (this.bridgeFace) this.bridgeFace.style.backgroundPosition = `${-this.cameraX}px 0`;
    return this.cameraX;
  }

  follow(player) {
    return this.setCamera(player.x - this.viewportWidth * .36);
  }
}


// FX positions are in ORIGINAL image coordinates (1536 × 512).
// Every glow, fog bank, cloud, and tree tracks the image as the camera moves.
const ART_W = 1536, ART_H = 512;
const cloudBands = [
  [85, 66, 230, 30, .018, .14],
  [370, 118, 245, 38, -.012, .11],
  [690, 72, 200, 29, .015, .10],
  [1290, 128, 245, 35, -.017, .10],
  [1000, 205, 210, 25, .012, .07]
];
const fogBanks = [
  [80, 390, 245, 25, .019, .18],
  [380, 365, 270, 33, -.014, .14],
  [760, 385, 230, 30, .016, .16],
  [1150, 375, 300, 34, -.018, .16],
  [1480, 407, 220, 24, .013, .17]
];
function glow(ctx,x,y,rx,ry,r,g,b,alpha) {
  if(rx <= 0 || ry <= 0) return;
  ctx.save(); ctx.translate(x,y); ctx.scale(rx,ry);
  const grad=ctx.createRadialGradient(0,0,0,0,0,1);
  grad.addColorStop(0,`rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(.36,`rgba(${r},${g},${b},${alpha*.37})`);
  grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
function fir(ctx,x,y,height,opacity) {
  ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle='#080911';
  ctx.fillRect(x-height*.035,y-height*.88,height*.07,height*.88);
  for(let i=0;i<5;i++){
    const level=i/5, w=height*(.22-.15*level);
    const top=y-height*(.95-.16*i);
    ctx.beginPath();ctx.moveTo(x,top-height*.20);
    ctx.lineTo(x-w,top+height*.22);
    ctx.lineTo(x+w,top+height*.22);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
WorldExtension.prototype.render=function(now){
  if (!this.fxCtx || !this.art || !document.getElementById('game-shell')?.classList.contains('active')) return;
  if (document.hidden) return;
  const still=this.reducedMotion.matches;
  if(now-this.lastFxTime < (still ? 500 : 33)) return; // max ~30 fps on mobile
  this.lastFxTime=now;
  const c=this.fxCtx, h=this.sceneHeight, w=this.viewportWidth;
  const scale=h/ART_H, t=still ? 0 : now*.001;
  const sx=x=>this.imageLeft+x*scale-this.cameraX;
  const sy=y=>y*scale;
  c.clearRect(0,0,w,h);

  // Cloud shadows: faint, translucent bands, NOT a second scaled photograph.
  // Motion is in image coordinates and never affects moon or castle geometry.
  for(const [x,y,rx,ry,speed,alpha] of cloudBands){
    const drift=Math.sin(t*.12+x)*9 + t*speed*8;
    const px=sx(x+drift), py=sy(y+Math.sin(t*.21+x)*2);
    if(px+rx*scale<0||px-rx*scale>w)continue;
    glow(c,px,py,rx*scale,ry*scale,35,19,48,alpha);
  }

  // Blood Moon: glow around its perimeter, no transforms applied to the moon.
  const moonPulse=still ? 1 : 1+.10*Math.sin(t*1.05);
  glow(c,sx(480),sy(112),82*scale,82*scale,239,37,50,.15*moonPulse);
  glow(c,sx(480),sy(112),53*scale,53*scale,255,57,46,.045*moonPulse);

  // Purple portal: atmospheric aura and a narrow, oscillating vertical beam.
  const portalPulse=still ? 1 : 1+.18*Math.sin(t*1.65);
  const portalX=sx(1047), portalY=sy(74);
  glow(c,portalX,portalY,83*scale,50*scale,165,71,245,.19*portalPulse);
  const beam=c.createLinearGradient(portalX-11*scale,0,portalX+11*scale,0);
  beam.addColorStop(0,'rgba(165,73,255,0)');
  beam.addColorStop(.5,`rgba(202,132,255,${.18*portalPulse})`);
  beam.addColorStop(1,'rgba(165,73,255,0)');
  c.fillStyle=beam;
  c.fillRect(portalX-11*scale,portalY,22*scale,Math.max(0,sy(255)-portalY));
  glow(c,portalX,sy(246),42*scale,18*scale,190,95,255,.11*portalPulse);

  // Lake/valley fog: slowly moving translucent banks over existing details.
  for(const [x,y,rx,ry,speed,alpha] of fogBanks){
    const drift=still ? 0 : Math.sin(t*.17+x)*15+t*speed*8;
    const px=sx(x+drift);
    if(px+rx*scale<0||px-rx*scale>w)continue;
    glow(c,px,sy(y),rx*scale,ry*scale,167,146,186,alpha);
  }

  // Foreground silhouettes move a little faster than the background.
  // Their bases stay near the bridge; nothing blocks the sky or landmark.
  const nearOffset=this.cameraX*.10;
  const trees=[[40,25],[125,31],[210,22],[335,28],[575,24],
               [790,30],[920,23],[1140,27],[1365,29],[1490,24]];
  for(const [x,size] of trees){
    const px=sx(x)-nearOffset;
    if(px < -size*scale || px>w+size*scale)continue;
    fir(c,px,h-1,size*scale,.27);
  }
  // Small broken masonry at ground level, behind the player and bridge.
  for(const [x,sz] of [[165,16],[650,12],[1240,18],[1440,13]]){
    const px=sx(x)-nearOffset;
    if(px<-30||px>w+30)continue;
    c.save();c.globalAlpha=.30;c.fillStyle='#090910';
    c.fillRect(px,h-sz*scale,sz*.45*scale,sz*scale);
    c.fillRect(px-sz*.13*scale,h-sz*1.08*scale,sz*.7*scale,sz*.18*scale);
    c.restore();
  }
};

return {WORLD_SCREENS,WorldExtension};
})();
const m0=(()=>{
const {assets}=m1;
const {ANGEL_ABILITIES}=m2;
const {AngelAbilityEffects}=m3;
const abilityEffects=new AngelAbilityEffects();
const {abilityCatalog,loadAbilities}=m4;
const {AbilityCooldowns}=m5;
const {CharacterCreator}=m6;
const {Player}=m8;
const {Ruins}=m12;
const {SvarNpc}=m13;
const {SvarConversation}=m14;
const {CathedralGate}=m15;
const {CathedralInterior}=m16;
const {bindControls}=m17;
const {initMenus}=m18;
const {WorldExtension}=m19;
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d",{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
const GROUND_RATIO=.755,hpFill=document.getElementById("hp-fill"),staminaFill=document.getElementById("stamina-fill"),stateLabel=document.getElementById("state-label"),buildLabel=document.getElementById("build-label"),loadingFill=document.getElementById("loading-fill"),loadingBuild=document.getElementById("loading-build");
let player=null,svar=null,buildConfig=null,controlsBound=false,last=performance.now();
const world=new WorldExtension();
const ruins=new Ruins();
const gate=new CathedralGate();
const interior=new CathedralInterior(world);
const dialogue=new SvarConversation(finished=>{
  if(player){player.vx=0;player.input.moveX=0;player.input.moveY=0;player.input.block=false;player.input.attack=false;player.input.jump=false;player.input.dodge=false;player.input.heal=false}
  if(finished&&scene==='bridge'){svar?.startGuide();questText.textContent=svar?.arrived?'Enter the cathedral. The beasts and their portal lie ahead.':'Follow S’var to the cathedral door.';}
});
let scene='bridge',transitioning=false;
window.FRACTURED_MAP={get screens(){return world.worldWidth/world.viewportWidth},get worldWidth(){return world.worldWidth},get cameraX(){return world.cameraX}};
// The bridge artwork is clipped by #stone-bridge (overflow:hidden).
// Its child strip starts at -8px, but those pixels are NOT visible ground.
// Use the visible bridge container edge, with a 2px stone-surface inset.
function bridgeSurfaceY(){
  const bridge=document.getElementById("stone-bridge");
  const canvasTop=canvas.getBoundingClientRect().top;
  if(bridge && bridge.getBoundingClientRect().height>0){
    return bridge.getBoundingClientRect().top-canvasTop+2;
  }
  return innerHeight*GROUND_RATIO+2;
}
function resize(){const ratio=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(ratio,0,0,ratio,0,0);world.resize();const outdoorWidth=world.worldWidth;interior.resize();if(scene==='cathedral')interior.setActive(true);ruins.resize(outdoorWidth,w,bridgeSurfaceY(),h);gate.resize(outdoorWidth,bridgeSurfaceY(),h);if(player){const elevation=player.groundY-player.y;player.worldWidth=world.worldWidth;player.groundY=bridgeSurfaceY();player.obstacles=scene==='bridge'?ruins.solids:[];if(player.onGround)player.y=player.groundY-elevation;player.x=Math.max(45,Math.min(world.worldWidth-45,player.x))}if(svar)svar.configureRoute(ruins.solids,gate.doorX,bridgeSurfaceY())}
let resizePending=false;addEventListener("resize",()=>{if(resizePending)return;resizePending=true;requestAnimationFrame(()=>{resizePending=false;resize()})},{passive:true});resize();
function enterWorld(config,preparedPlayer,preparedSvar){if(window.FRACTURED.started)return;buildConfig=config;window.FRACTURED.buildConfig=config;window.FRACTURED.started=true;window.FRACTURED.loading=false;document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));document.getElementById("game-shell").classList.add("active");player=preparedPlayer;player.x=innerWidth*.36;player.y=player.groundY=bridgeSurfaceY();player.worldWidth=world.worldWidth;player.obstacles=ruins.solids;svar=preparedSvar;svar.x=Math.min(world.worldWidth-75,player.x+240);svar.groundY=bridgeSurfaceY();dialogue.origin=config.origin;world.setCamera(0);
// Exactly one playable actor exists. Keep legacy names exclusive to the chosen origin.
window.FRACTURED.player=player;
window.FRACTURED.angelKnight=config.origin==='angelic-knight'?player:null;
window.FRACTURED.demonicRogue=config.origin==='demonic-rogue'?player:null;
window.FRACTURED.svar=svar;
window.FRACTURED.scene=scene;
svar.ready.then(loaded=>{if(!loaded){const toast=document.getElementById("toast");toast.textContent="S’var artwork could not load. Reload to retry.";toast.classList.add("show");}});
player.onAbilityImpact=index=>abilityEffects.cast(player,index,window.FRACTURED.enemies||[]);
window.FRACTURED.castAbility=(id,actor)=>{const index=ANGEL_ABILITIES.findIndex(a=>a.id===id);return actor===player&&actor.origin==='angelic-knight'&&index>=0&&actor.castAbility(index)};
refreshAbilities();
if(!controlsBound){bindControls(player);controlsBound=true}buildLabel.textContent=config.displayName;resize();last=performance.now()}
async function beginGame(config){
  if(window.FRACTURED.loading||window.FRACTURED.started)return;
  if(!['angelic-knight','demonic-rogue'].includes(config?.origin))return;
  window.FRACTURED.loading=true;buildConfig=config;
  document.querySelectorAll('.flow-screen').forEach(s=>s.classList.remove('active'));
  const screen=document.getElementById('loading-screen');screen.classList.add('active');
  document.getElementById('loading-retry')?.remove();assets.resetFailures();
  const actor=new Player(innerWidth*.36,bridgeSurfaceY(),config);
  const guide=new SvarNpc(actor.x+240,bridgeSurfaceY());
  const images=[...Object.values(actor.renderer.images),...Object.values(guide.images),...Object.values(ruins.images),gate.image,interior.image,world.background];
  const failed=await assets.waitAll(images,(done,total)=>{loadingFill.style.width=`${total?done/total*100:100}%`;loadingBuild.textContent=`Loading ${config.displayName} · ${done}/${total}`});
  await guide.ready;
  if(failed.length){
    window.FRACTURED.loading=false;loadingBuild.textContent=`${failed.length} image(s) could not load. Please retry.`;
    console.warn('[FRACTURED] Assets not ready:',failed);
    const retry=document.createElement('button');retry.id='loading-retry';retry.textContent='RETRY LOADING';retry.className='primary-btn';retry.onclick=()=>{for(const image of images.flat(Infinity)){if(image?.complete&&!image.naturalWidth&&image.src&&!assets.records.has(image))image.src=image.src;}beginGame(config)};screen.appendChild(retry);return;
  }
  enterWorld(config,actor,guide);
}
window.FRACTURED={...(window.FRACTURED||{}),buildConfig:null,started:false,loading:false,player:null,angelKnight:null,demonicRogue:null,svar:null,menuPaused:false,scene};
new CharacterCreator(beginGame);initMenus(()=>buildConfig);
const abilityCooldowns=new AbilityCooldowns([4,6,8]);
let equippedAbilities=[null,null,null];
const abilityLabels=["Empty","Empty","Empty"];
function refreshAbilities(){const origin=player?.origin||buildConfig?.origin;const catalog=abilityCatalog(origin);equippedAbilities=loadAbilities(origin).map(id=>catalog.find(a=>a.id===id)||null);equippedAbilities.forEach((a,i)=>{abilityLabels[i]=a?.name||"Empty";abilityCooldowns.durations[i]=a?.cooldown||4});}
addEventListener("fractured:abilities-changed",()=>{refreshAbilities();renderAbilities()});
const abilityButtons=abilityLabels.map((label,i)=>document.getElementById(`ability${i+1}-btn`));
function renderAbilities(){
  abilityButtons.forEach((button,i)=>{
    const remaining=abilityCooldowns.remaining[i];
    button.disabled=!player||!equippedAbilities[i]||player.dead||player.state.startsWith("ability")||dialogue.opened||remaining>0;
    button.querySelector("span").textContent=["I","II","III"][i];
    button.querySelector('.cooldown').textContent=remaining>0?`${Math.ceil(remaining)}s`:'';
    button.style.setProperty('--cooldown-fill',`${remaining/abilityCooldowns.durations[i]*100}%`);
    button.setAttribute('aria-label',`${abilityLabels[i]}${remaining>0?`, ${Math.ceil(remaining)} seconds remaining`:`, ready`}`);
  });
}
abilityButtons.forEach((button,i)=>button.onclick=()=>{
  if(!player||player.dead||dialogue.opened||document.getElementById('rpgMenu').classList.contains('open')||!equippedAbilities[i]||abilityCooldowns.remaining[i]>0)return;
  const cast=(id,actor)=>{const index=ANGEL_ABILITIES.findIndex(a=>a.id===id);return actor===player&&actor.origin==='angelic-knight'&&index>=0&&actor.castAbility(index)};
  if(cast(equippedAbilities[i].id,player)===false)return;
  abilityCooldowns.use(i);
  renderAbilities();
  const toast=document.getElementById('toast');
  toast.textContent=abilityLabels[i];
  toast.classList.add('show');clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>toast.classList.remove('show'),1200);
});
renderAbilities();
const fade=document.createElement('div');
Object.assign(fade.style,{position:'absolute',inset:'0',zIndex:'25',background:'#08030c',opacity:'0',transition:'opacity .32s ease',pointerEvents:'none'});
document.getElementById('game-shell').appendChild(fade);
const questText=document.querySelector('#quest span');
function switchScene(next){
  if(transitioning||!player)return;
  transitioning=true;fade.style.opacity='1';player.vx=0;
  abilityEffects.clear();
  setTimeout(()=>{
    scene=next;window.FRACTURED.scene=scene;
    if(next==='cathedral'){
      interior.setActive(true);player.x=95;player.obstacles=[];
      questText.textContent='Explore the abandoned cathedral.';
    }else{
      interior.setActive(false);world.resize();
      ruins.resize(world.worldWidth,innerWidth,bridgeSurfaceY(),innerHeight);
      gate.resize(world.worldWidth,bridgeSurfaceY(),innerHeight);
      player.x=gate.doorX-75;player.obstacles=ruins.solids;
      questText.textContent=dialogue.finished?'Reach the abandoned cathedral beneath the Blood Moon.':'Speak with S’var on the road ahead.';
    }
    player.worldWidth=world.worldWidth;player.groundY=bridgeSurfaceY();
    player.y=player.groundY;player.vx=0;player.vy=0;player.onGround=true;
    world.setCamera(next==='cathedral'?0:player.x-innerWidth*.36);
    interior.follow();fade.style.opacity='0';
    setTimeout(()=>{transitioning=false},350);
  },350);
}
let lastHud=0;
const gameMenu=document.getElementById("rpgMenu");
function frame(now){
  if(document.hidden||gameMenu.classList.contains("open")){last=now;requestAnimationFrame(frame);return;}
  const dt=Math.min(.033,(now-last)/1000||.016);last=now;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(player){
    const paused=transitioning||dialogue.opened||document.getElementById('rpgMenu').classList.contains('open');
    if(dialogue.opened){player.vx=0;player.input.moveX=0;player.input.moveY=0;player.input.block=false;player.input.attack=false;player.input.jump=false;player.input.dodge=false;player.input.heal=false}
    if(!paused){player.update(dt);abilityCooldowns.update(dt);abilityEffects.update(dt,window.FRACTURED.enemies||[],world.worldWidth)}
    if(now-lastHud>=100){renderAbilities();lastHud=now;
      hpFill.style.width=`${player.hp/player.maxHp*100}%`;
      staminaFill.style.width=`${player.stamina/player.maxStamina*100}%`;
      const label=player.state.toUpperCase();if(stateLabel.textContent!==label)stateLabel.textContent=label;
    }
    if(scene==='bridge'&&svar)svar.update(dt,player,paused);
    if(!paused&&scene==='bridge'&&interior.ready&&gate.canEnter(player))switchScene('cathedral');
    if(!paused&&scene==='cathedral'&&player.onGround&&player.x<56&&player.input.moveX<-.08)switchScene('bridge');
    world.follow(player);
    if(scene==='bridge')world.render(now);else interior.follow();
    ctx.save();ctx.translate(-world.cameraX,0);
    if(scene==='bridge'){
      ruins.draw(ctx,world.cameraX,innerWidth);
      // Draw the wall first: the character passes in front of its first column.
      gate.draw(ctx,world.cameraX,innerWidth);
      if(svar)svar.draw(ctx,world.cameraX,innerWidth,innerHeight);
    }
    player.draw(ctx);abilityEffects.draw(ctx);ctx.restore();
    dialogue.updatePrompt(svar,player,world.cameraX,scene,paused,innerHeight);

  }
  requestAnimationFrame(frame);
}requestAnimationFrame(frame);

return {};
})();
})();
(()=>{// Bridge strip spans the same world coordinates as the player and scenery.
// The previous pseudo-element inherited a viewport-positioned background and
// did not provide a reliably world-sized layer on iOS Safari.
const bridge = document.getElementById('stone-bridge');
if (bridge) {
  const strip = document.createElement('div');
  strip.id = 'fractured-bridge-world-v23';
  strip.setAttribute('aria-hidden','true');
  bridge.appendChild(strip);
  let oldWidth = -1, oldX = NaN;
  function sync() {
    const map = window.FRACTURED_MAP;
    const width = Math.max(bridge.clientWidth, Number(map?.worldWidth) || bridge.clientWidth);
    const x = Number(map?.cameraX) || 0;
    if (width !== oldWidth) { strip.style.width = `${width}px`; oldWidth = width; }
    if (x !== oldX) { strip.style.transform = `translate3d(${-x}px,0,0)`; oldX = x; }
    requestAnimationFrame(sync);
  }
  requestAnimationFrame(sync);
}

})();
window.__fracturedBootReady=true;
