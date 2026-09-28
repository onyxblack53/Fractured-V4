export const INTRO_SCENES=[
  {
    "title": "Aradavia",
    "text": "Aradavia was a prosperous nation, where advanced magic and technology flourished together.",
    "art": "./shattered_kingdom_world.jpeg",
    "position": "18% 45%"
  },
  {
    "title": "The Council of Thirteen",
    "text": "Thirteen scholars governed the nation. Powerful arcane wielders, they guided Aradavia through its golden age.",
    "art": "./original_background.jpeg",
    "position": "85% 30%"
  },
  {
    "title": "Beneath the earth",
    "text": "Deep beneath the earth, the council discovered a hidden power: the Black Gem.",
    "art": "./shattered_kingdom_world.jpeg",
    "position": "48% 70%"
  },
  {
    "title": "The oath",
    "text": "The thirteen swore to seal it away. But one among them believed its power could carry Aradavia further into the golden age.",
    "art": "./original_background.jpeg",
    "position": "72% 25%"
  },
  {
    "title": "The sealing",
    "text": "Together, the council began a ritual to seal the Black Gem within the void. During the ritual, the thirteenth scholar tethered its darkness to himself.",
    "art": "./shattered_kingdom_world.jpeg",
    "position": "85% 40%"
  },
  {
    "title": "A new host",
    "text": "The gem was sealed. But before it vanished into the void, the darkness had found a new host.",
    "art": "./original_background.jpeg",
    "position": "28% 20%"
  },
  {
    "title": "The descent",
    "text": "Under its influence, the scholar began to lose his mind. He turned upon his fellow scholars, killing them and draining their power into his own.",
    "art": "./shattered_kingdom_world.jpeg",
    "position": "60% 65%"
  },
  {
    "title": "The forgotten curse",
    "text": "Then the darkness showed him a ritual: a dark, forgotten curse, powerful enough to plunge the world into an age of darkness.",
    "art": "./original_background.jpeg",
    "position": "85% 30%"
  },
  {
    "title": "The Fracture",
    "text": "As the scholar performed the ritual, the earth and sky cracked open. Other worlds spilled through the fractures.",
    "art": "./original_background.jpeg",
    "position": "72% 25%"
  },
  {
    "title": "Hell unleashed",
    "text": "Through the broken earth and sky came nightmarish creatures of hell, unleashed upon Aradavia.",
    "art": "./shattered_kingdom_world.jpeg",
    "position": "85% 40%"
  }
];
export class CinematicIntro{
  constructor(onComplete){
    this.onComplete=onComplete;this.active=false;this.elapsed=0;this.index=0;
    this.screen=document.getElementById('intro-screen');
    document.getElementById('intro-skip').onclick=()=>this.finish();
    document.getElementById('intro-next').onclick=()=>this.next();
    document.getElementById('intro-pause').onclick=()=>{this.paused=!this.paused;document.getElementById('intro-pause').textContent=this.paused?'RESUME':'PAUSE'};
    document.addEventListener('visibilitychange',()=>{this.last=performance.now()});
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  start(){
    if(this.active)return;
    document.querySelectorAll('.flow-screen').forEach(s=>s.classList.remove('active'));
    this.screen.classList.add('active');this.active=true;this.paused=false;this.index=0;this.last=performance.now();
    document.getElementById('intro-pause').textContent='PAUSE';this.showScene();
    document.getElementById('intro-next').focus();
    const tick=now=>{
      if(!this.active)return;
      const dt=Math.min((now-this.last)/1000,.1);this.last=now;
      if(!this.paused&&!document.hidden&&!this.reduced){this.elapsed+=dt;if(this.elapsed>=7.5)this.next()}
      this.screen.classList.toggle('paused',this.paused);
      document.getElementById('intro-progress').style.width=`${Math.min(100,this.elapsed/7.5*100)}%`;
      if(this.active)this.raf=requestAnimationFrame(tick);
    };this.raf=requestAnimationFrame(tick);
  }
  showScene(){
    this.elapsed=0;const scene=INTRO_SCENES[this.index];
    const old=this.screen.querySelector('.intro-shot');
    if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),1100)}
    const shot=document.createElement('div');shot.className='intro-shot';shot.style.backgroundImage=`url("${scene.art}")`;shot.style.backgroundPosition=scene.position;
    this.screen.prepend(shot);
    document.getElementById('intro-chapter').textContent=`PROLOGUE · ${String(this.index+1).padStart(2,'0')} / ${String(INTRO_SCENES.length).padStart(2,'0')}`;
    document.getElementById('intro-title').textContent=scene.title;
    document.getElementById('intro-story').textContent=scene.text;
    document.getElementById('intro-next').textContent=this.index===INTRO_SCENES.length-1?'CHOOSE YOUR CHARACTER':'CONTINUE';
  }
  next(){if(!this.active)return;if(this.index>=INTRO_SCENES.length-1)this.finish();else{this.index++;this.showScene()}}
  finish(){if(!this.active)return;this.active=false;cancelAnimationFrame(this.raf);this.screen.classList.remove('active');this.screen.querySelectorAll('.intro-shot').forEach(s=>s.remove());this.onComplete()}
}
