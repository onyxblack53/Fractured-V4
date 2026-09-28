export const INTRO_SCENES=[
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
      if(!this.paused&&!document.hidden&&!this.reduced){this.elapsed+=dt;if(this.elapsed>=INTRO_SCENES[this.index].duration)this.next()}
      this.screen.classList.toggle('paused',this.paused||document.hidden);
      document.getElementById('intro-progress').style.width=`${Math.min(100,this.elapsed/INTRO_SCENES[this.index].duration*100)}%`;
      if(this.active)this.raf=requestAnimationFrame(tick);
    };this.raf=requestAnimationFrame(tick);
  }
  showScene(){
    this.elapsed=0;const scene=INTRO_SCENES[this.index];
    this.screen.dataset.effect=scene.effect;
    const old=this.screen.querySelector('.intro-shot');
    if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),1100)}
    const shot=document.createElement('div');shot.className='intro-shot';shot.dataset.motion=scene.motion;shot.dataset.fullFrame=String(this.index===1);shot.style.animationDuration=`${scene.duration+1}s`;
    const next=INTRO_SCENES[this.index+1];if(next){const preload=new Image();preload.src=next.art;}
    shot.style.backgroundImage=`url("${scene.art}")`;shot.style.backgroundPosition=scene.position;
    this.screen.prepend(shot);
    document.getElementById('intro-chapter').textContent=`PROLOGUE · ${String(this.index+1).padStart(2,'0')} / ${String(INTRO_SCENES.length).padStart(2,'0')}`;
    document.getElementById('intro-title').textContent=scene.title;
    document.getElementById('intro-story').textContent=scene.text;
    document.getElementById('intro-next').textContent=this.index===INTRO_SCENES.length-1?'CHOOSE YOUR CHARACTER':'CONTINUE';
  }
  next(){if(!this.active)return;if(this.index>=INTRO_SCENES.length-1)this.finish();else{this.index++;this.showScene()}}
  finish(){if(!this.active)return;this.active=false;cancelAnimationFrame(this.raf);this.screen.classList.remove('active');this.screen.querySelectorAll('.intro-shot').forEach(s=>s.remove());this.onComplete()}
}
