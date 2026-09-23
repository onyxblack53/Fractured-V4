export const RACES=[
  ["Human","Balanced and adaptable."],["Orc","Powerful and resilient."],["Elf","Fast and magically attuned."],["Dragonborn","Enduring dragon-blooded warriors."],["Demon","Dark supernatural lineage."],["Angel","Celestial blood with radiant power."],["Fallen Angel","Divine power fractured by shadow."],["Tiefling","Infernal blood with volatile magic."],["Vampire","Night-born speed and lifesteal."],["Werewolf","Regeneration and physical strength."]
];
export const CLASSES=[
  ["Knight","Sword-and-shield melee fighter."],["Mage","Long-range elemental caster."],["Witch","Hexes, curses and control."],["Samurai","Timing, counters and disciplined blades."],["Ronin","Fast independent duelist."],["Ninja","Evasive high-speed fighter."]
];
export class CharacterCreator{
  constructor(onComplete){
    this.onComplete=onComplete;this.mode="pure";this.races=[];this.cls=null;
    this.raceGrid=document.getElementById("race-grid");this.classGrid=document.getElementById("class-grid");
    this.raceSummary=document.getElementById("race-summary");this.raceNext=document.getElementById("race-next");this.enterWorld=document.getElementById("enter-world");
    this.buildCards();this.bind();this.refreshRaces();
  }
  show(id){document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active")}
  buildCards(){
    this.raceGrid.innerHTML=RACES.map(([name,desc])=>`<button class="choice-card" data-race="${name}"><span class="choice-glyph">${name[0]}</span><span><b>${name}</b><small>${desc}</small></span></button>`).join("");
    this.classGrid.innerHTML=CLASSES.map(([name,desc])=>`<button class="choice-card" data-class="${name}"><span class="choice-glyph">${name[0]}</span><span><b>${name}</b><small>${desc}</small></span></button>`).join("");
  }
  setMode(mode){this.mode=mode;this.races=[];document.getElementById("pure-btn").classList.toggle("selected",mode==="pure");document.getElementById("hybrid-btn").classList.toggle("selected",mode==="hybrid");this.refreshRaces()}
  refreshRaces(){
    document.querySelectorAll("[data-race]").forEach(c=>c.classList.toggle("selected",this.races.includes(c.dataset.race)));
    const need=this.mode==="pure"?1:2;
    this.raceSummary.textContent=this.races.length?this.races.join(" × "):`Select ${need===1?"one":"two"} race${need===1?"":"s"}.`;
    this.raceNext.disabled=this.races.length!==need;
  }
  bind(){
    document.getElementById("start-btn").onclick=()=>this.show("race-screen");
    document.getElementById("flow-back-start").onclick=()=>this.show("start-screen");
    document.getElementById("flow-back-race").onclick=()=>this.show("race-screen");
    document.getElementById("pure-btn").onclick=()=>this.setMode("pure");document.getElementById("hybrid-btn").onclick=()=>this.setMode("hybrid");
    this.raceGrid.onclick=e=>{const c=e.target.closest("[data-race]");if(!c)return;const r=c.dataset.race,limit=this.mode==="pure"?1:2;if(this.races.includes(r))this.races=this.races.filter(x=>x!==r);else if(this.races.length<limit)this.races.push(r);else if(limit===1)this.races=[r];this.refreshRaces()};
    this.raceNext.onclick=()=>{document.getElementById("bloodline-summary").textContent=`${this.mode==="pure"?"FULL BLOODED":"HALF BLOODED"} — ${this.races.join(" / ")}`;this.show("class-screen")};
    this.classGrid.onclick=e=>{const c=e.target.closest("[data-class]");if(!c)return;this.cls=c.dataset.class;document.querySelectorAll("[data-class]").forEach(x=>x.classList.toggle("selected",x===c));this.enterWorld.disabled=false};
    this.enterWorld.onclick=()=>this.onComplete?.({bloodMode:this.mode,races:[...this.races],className:this.cls});
  }
}
