import {CinematicIntro} from './intro.js?v=39';
export const ORIGINS=[
  {id:'angelic-knight',name:'Angelic Knight',race:'Angel',className:'Knight',glyph:'✦',description:'A celestial guardian. Stand your ground with sword and shield.'},
  {id:'demonic-rogue',name:'Demonic Rogue',race:'Demon',className:'Rogue',glyph:'☽',description:'A swift fighter of the abyss. Close the distance with paired blades.'}
];
export class CharacterCreator{
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
    document.getElementById('origin-enter').onclick=()=>{if(!this.selected)return;const o=this.selected;onComplete({origin:o.id,displayName:o.name,races:[o.race],className:o.className})};
  }
  show(id){document.querySelectorAll('.flow-screen').forEach(s=>s.classList.remove('active'));const screen=document.getElementById(id);screen.classList.add('active');screen.querySelector('button')?.focus()}
}
