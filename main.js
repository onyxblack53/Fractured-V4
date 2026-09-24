import { Player } from "./player.js?v=7";
import { bindControls } from "./controls.js";
import { CharacterCreator } from "./creator.js";
import { openMenu,closeMenu,showPage } from "./menu.js";

const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d",{alpha:true});
ctx.imageSmoothingEnabled=true;
ctx.imageSmoothingQuality="high";

const hpFill=document.getElementById("hp-fill");
const staminaFill=document.getElementById("stamina-fill");
const stateLabel=document.getElementById("state-label");
const buildLabel=document.getElementById("build-label");
const loadingFill=document.getElementById("loading-fill");
const loadingBuild=document.getElementById("loading-build");

const GROUND_RATIO=.755;

window.FRACTURED={
  ...(window.FRACTURED||{}),
  buildConfig:null,
  menuPaused:false,
  started:false,
  openMenu,closeMenu,showPage
};

let player=null;
let controlsBound=false;
let last=performance.now();

async function clearOldBuildCaches(){
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if("caches" in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(_){}
}
clearOldBuildCaches();

function resize(){
  const ratio=Math.min(devicePixelRatio||1,2);
  const cssW=innerWidth;
  const cssH=innerHeight;

  canvas.width=Math.round(cssW*ratio);
  canvas.height=Math.round(cssH*ratio);
  canvas.style.width=cssW+"px";
  canvas.style.height=cssH+"px";
  ctx.setTransform(ratio,0,0,ratio,0,0);

  if(player){
    player.groundY=cssH*GROUND_RATIO;
    if(player.onGround)player.y=player.groundY;
    player.x=Math.max(45,Math.min(cssW-45,player.x));
  }
}
addEventListener("resize",resize,{passive:true});
resize();

function drawWorld(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
}

function actuallyEnterWorld(config){
  window.FRACTURED.buildConfig=config;
  window.FRACTURED.started=true;
  window.FRACTURED.menuPaused=false;

  document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));
  document.getElementById("game-shell").classList.add("active");

  const groundY=innerHeight*GROUND_RATIO;
  player=new Player(innerWidth*.36,groundY);

  if(!controlsBound){
    bindControls(player);
    controlsBound=true;
  }

  window.FRACTURED.angelKnight=player;
  buildLabel.textContent=`${config.races.join(" / ")} · ${config.className}`;

  resize();
  last=performance.now();
}

function beginGame(config){
  window.FRACTURED.buildConfig=config;

  document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));

  const loading=document.getElementById("loading-screen");
  loading.classList.add("active");

  loadingBuild.textContent=`${config.races.join(" / ")} · ${config.className}`;
  loadingFill.style.width="0%";

  const steps=[16,37,61,83,100];
  let i=0;

  const tick=()=>{
    loadingFill.style.width=steps[i]+"%";
    i++;

    if(i<steps.length){
      setTimeout(tick,140);
    }else{
      setTimeout(()=>actuallyEnterWorld(config),220);
    }
  };

  requestAnimationFrame(()=>setTimeout(tick,80));
}

new CharacterCreator(beginGame);

document.getElementById("menu-character").onclick=()=>openMenu("character");
document.getElementById("menu-inventory").onclick=()=>openMenu("inventory");
document.getElementById("menu-close").onclick=closeMenu;

document.querySelectorAll(".menuTab[data-page]").forEach(btn=>{
  btn.onclick=()=>showPage(btn.dataset.page);
});

document.querySelectorAll(".ability").forEach((btn,i)=>{
  btn.addEventListener("click",()=>{
    const toast=document.getElementById("toast");
    const labels=["Radiant Burst","Aegis of Heaven","Falling Star"];
    toast.textContent=labels[i]+" — ability slot ready";
    toast.classList.add("show");
    clearTimeout(window.__fcdToast);
    window.__fcdToast=setTimeout(()=>toast.classList.remove("show"),800);
  });
});

function frame(now){
  const dt=Math.min(.033,(now-last)/1000||.016);
  last=now;

  if(window.FRACTURED.started){
    if(player&&!window.FRACTURED.menuPaused)player.update(dt);

    drawWorld();
    player?.draw(ctx);

    if(player){
      hpFill.style.width=`${player.hp/player.maxHp*100}%`;
      staminaFill.style.width=`${player.stamina/player.maxStamina*100}%`;
      stateLabel.textContent=player.state.toUpperCase();
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
