import {AbilityCooldowns} from "./abilityCooldowns.js?v=38";
import {CharacterCreator} from "./creator.js?v=50";
import {Player} from "./player.js?v=54";
import {Ruins} from "./ruins.js?v=59";
import {SvarNpc} from "./svarNpc.js?v=66";
import {SvarConversation} from "./svarConversation.js?v=66";
import {CathedralGate} from "./cathedralGate.js?v=59";
import {CathedralInterior} from "./cathedralInterior.js?v=59";
import {bindControls} from "./controls.js?v=11";
import {initMenus} from "./menus.js?v=44";
import {WorldExtension} from "./worldExtension.js?v=20";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d",{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
const GROUND_RATIO=.755,hpFill=document.getElementById("hp-fill"),staminaFill=document.getElementById("stamina-fill"),stateLabel=document.getElementById("state-label"),buildLabel=document.getElementById("build-label"),loadingFill=document.getElementById("loading-fill"),loadingBuild=document.getElementById("loading-build");
let player=null,svar=null,buildConfig=null,controlsBound=false,last=performance.now();
const world=new WorldExtension();
const ruins=new Ruins();
const gate=new CathedralGate();
const interior=new CathedralInterior(world);
const dialogue=new SvarConversation(finished=>{
  if(player){player.vx=0;player.input.moveX=0;player.input.moveY=0;player.input.block=false;player.input.attack=false;player.input.jump=false;player.input.dodge=false;player.input.heal=false}
  if(finished&&scene==='bridge')questText.textContent='Reach the abandoned cathedral beneath the Blood Moon.';
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
function resize(){const ratio=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(ratio,0,0,ratio,0,0);world.resize();const outdoorWidth=world.worldWidth;interior.resize();if(scene==='cathedral')interior.setActive(true);ruins.resize(outdoorWidth,w,bridgeSurfaceY(),h);gate.resize(outdoorWidth,bridgeSurfaceY(),h);if(player){const elevation=player.groundY-player.y;player.worldWidth=world.worldWidth;player.groundY=bridgeSurfaceY();player.obstacles=scene==='bridge'?ruins.solids:[];if(player.onGround)player.y=player.groundY-elevation;player.x=Math.max(45,Math.min(world.worldWidth-45,player.x))}if(svar)svar.groundY=bridgeSurfaceY()}
addEventListener("resize",resize,{passive:true});resize();
function enterWorld(config){if(window.FRACTURED.started)return;buildConfig=config;window.FRACTURED.buildConfig=config;window.FRACTURED.started=true;window.FRACTURED.loading=false;document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));document.getElementById("game-shell").classList.add("active");player=new Player(innerWidth*.36,bridgeSurfaceY(),config);player.worldWidth=world.worldWidth;player.obstacles=ruins.solids;svar=new SvarNpc(Math.min(world.worldWidth-75,player.x+240),bridgeSurfaceY());dialogue.origin=config.origin;world.setCamera(0);
// Exactly one playable actor exists. Keep legacy names exclusive to the chosen origin.
window.FRACTURED.player=player;
window.FRACTURED.angelKnight=config.origin==='angelic-knight'?player:null;
window.FRACTURED.demonicRogue=config.origin==='demonic-rogue'?player:null;
window.FRACTURED.svar=svar;
window.FRACTURED.scene=scene;
svar.ready.then(loaded=>{if(!loaded){const toast=document.getElementById("toast");toast.textContent="S’var artwork could not load. Reload to retry.";toast.classList.add("show");}});
if(!controlsBound){bindControls(player);controlsBound=true}buildLabel.textContent=config.displayName;resize();last=performance.now()}
function beginGame(config){if(window.FRACTURED.loading||window.FRACTURED.started)return;
if(!['angelic-knight','demonic-rogue'].includes(config?.origin))throw new Error('Choose Angelic Knight or Demonic Rogue before entering the world');
window.FRACTURED.loading=true;buildConfig=config;document.querySelectorAll(".flow-screen").forEach(s=>s.classList.remove("active"));const loading=document.getElementById("loading-screen");loading.classList.add("active");loadingBuild.textContent=config.displayName;loadingFill.style.width="0%";const steps=[14,36,58,80,100];let i=0;const tick=()=>{loadingFill.style.width=steps[i]+"%";i++;if(i<steps.length)setTimeout(tick,140);else setTimeout(()=>enterWorld(config),220)};setTimeout(tick,80)}
window.FRACTURED={...(window.FRACTURED||{}),buildConfig:null,started:false,loading:false,player:null,angelKnight:null,demonicRogue:null,svar:null,menuPaused:false,scene};
new CharacterCreator(beginGame);initMenus(()=>buildConfig);
const abilityCooldowns=new AbilityCooldowns([4,6,8]);
const abilityLabels=["Radiant Burst","Aegis of Heaven","Falling Star"];
const abilityButtons=abilityLabels.map((label,i)=>document.getElementById(`ability${i+1}-btn`));
function renderAbilities(){
  abilityButtons.forEach((button,i)=>{
    const remaining=abilityCooldowns.remaining[i];
    button.disabled=!player||player.dead||dialogue.opened||remaining>0;
    button.querySelector('.cooldown').textContent=remaining>0?`${Math.ceil(remaining)}s`:'';
    button.style.setProperty('--cooldown-fill',`${remaining/abilityCooldowns.durations[i]*100}%`);
    button.setAttribute('aria-label',`${abilityLabels[i]}${remaining>0?`, ${Math.ceil(remaining)} seconds remaining`:`, ready`}`);
  });
}
abilityButtons.forEach((button,i)=>button.onclick=()=>{
  if(!player||player.dead||dialogue.opened||document.getElementById('rpgMenu').classList.contains('open')||!abilityCooldowns.use(i))return;
  renderAbilities();
  const toast=document.getElementById('toast');
  toast.textContent=abilityLabels[i]+" — combat effect coming soon";
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
function frame(now){
  const dt=Math.min(.033,(now-last)/1000||.016);last=now;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(player){
    const paused=transitioning||dialogue.opened||document.getElementById('rpgMenu').classList.contains('open');
    if(dialogue.opened){player.vx=0;player.input.moveX=0;player.input.moveY=0;player.input.block=false;player.input.attack=false;player.input.jump=false;player.input.dodge=false;player.input.heal=false}
    if(!paused){player.update(dt);abilityCooldowns.update(dt)}
    renderAbilities();
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
    player.draw(ctx);ctx.restore();
    dialogue.updatePrompt(svar,player,world.cameraX,scene,paused,innerHeight);
    hpFill.style.width=`${player.hp/player.maxHp*100}%`;
    staminaFill.style.width=`${player.stamina/player.maxStamina*100}%`;
    stateLabel.textContent=player.state.toUpperCase();
  }
  requestAnimationFrame(frame);
}requestAnimationFrame(frame);
