import {DemonicRogueRenderer} from "./demonicRogueRenderer.js?v=43";
const EQUIPMENT=[["HEAD","Celestial Helm"],["CHEST","Seraph Plate"],["ARMS","Vambraces"],["LEGS","Greaves"],["MAIN","Divine Sword"],["OFF","Aegis Shield"]];
const INVENTORY=["Celestial Helm","Seraph Plate","Vambraces","Greaves","Divine Sword","Aegis Shield","Radiant Flask","Fracture Shard"];
export function initMenus(getBuild){
  const menu=document.getElementById("rpgMenu"),charPage=document.getElementById("characterPage"),invPage=document.getElementById("inventoryPage"),preview=document.getElementById("character-preview");
  document.getElementById("leftEquip").innerHTML=EQUIPMENT.slice(0,3).map(slotHTML).join("");document.getElementById("rightEquip").innerHTML=EQUIPMENT.slice(3).map(slotHTML).join("");
  document.getElementById("statColumns").innerHTML=[["24","VITALITY"],["21","STRENGTH"],["18","DEXTERITY"],["16","FAITH"],["14","ARCANE"],["12","RESIST"]].map(([v,n])=>`<div class="stat"><b>${v}</b><span>${n}</span></div>`).join("");
  document.getElementById("invGrid").innerHTML=INVENTORY.map((n,i)=>`<button class="invItem${i===0?" selected":""}" data-item="${n}"><b>${n}</b><small>${i<6?"Equippable":"Item"}</small></button>`).join("");
  const detail=document.getElementById("itemDetail");detail.innerHTML="<h3>Celestial Helm</h3><p>Angel Knight equipment.</p>";
  document.getElementById("invGrid").onclick=e=>{const b=e.target.closest(".invItem");if(!b)return;document.querySelectorAll(".invItem").forEach(x=>x.classList.toggle("selected",x===b));detail.innerHTML=`<h3>${b.dataset.item}</h3><p>Inventory item.</p>`};
  function refresh(){const build=getBuild();if(build){
const rogue=build.origin==='demonic-rogue';
const equipment=rogue?[["HEAD","Shadow Hood"],["CHEST","Night Leather"],["ARMS","Rogue Wraps"],["LEGS","Silent Boots"],["MAIN","Abyss Dagger"],["OFF","Shadow Dagger"]]:EQUIPMENT;
document.getElementById('leftEquip').innerHTML=equipment.slice(0,3).map(slotHTML).join('');document.getElementById('rightEquip').innerHTML=equipment.slice(3).map(slotHTML).join('');
document.getElementById('invGrid').innerHTML=[...equipment.map(e=>e[1]),'Restoring Flask','Fracture Shard'].map((n,i)=>`<button class="invItem" data-item="${n}"><b>${n}</b><small>${i<6?'Equippable':'Item'}</small></button>`).join('');detail.textContent='Select an item to inspect.';
document.getElementById("bloodlineText").textContent=`${build.races.join(" / ")} · ${build.className}`;document.getElementById("bloodlineTier").textContent=build.displayName||"Angelic Knight"}startPreview()}
  function open(page){refresh();menu.classList.add("open");menu.setAttribute("aria-hidden","false");document.querySelectorAll(".menuPage").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".menuTab").forEach(x=>x.classList.remove("active"));if(page==="inventory"){invPage.classList.add("active");document.querySelector('[data-page="inventory"]').classList.add("active")}else{charPage.classList.add("active");document.querySelector('[data-page="character"]').classList.add("active")}}
  const close=()=>{menu.classList.remove("open");menu.setAttribute("aria-hidden","true")};document.getElementById("menu-character").onclick=()=>open("character");document.getElementById("menu-inventory").onclick=()=>open("inventory");document.getElementById("menu-close").onclick=close;document.querySelectorAll(".menuTab[data-page]").forEach(b=>b.onclick=()=>open(b.dataset.page));
  let roguePreview=null,previewStarted=false,frame=0;
  function renderPreview(){
    if(getBuild()?.origin==='demonic-rogue'){
      roguePreview??=new DemonicRogueRenderer();
      const c=document.createElement('canvas');c.width=240;c.height=240;
      roguePreview.draw(c.getContext('2d'),120,215,1,210,false);
      if(roguePreview.images.idle.complete&&roguePreview.images.idle.naturalWidth)preview.src=c.toDataURL();
    }else{frame=(frame+1)%4;preview.src=`./idle_${frame}.png?v=36`}
  }
  function startPreview(){
    if(getBuild()?.origin==='demonic-rogue')preview.removeAttribute('src');
    renderPreview();
    if(previewStarted)return;
    previewStarted=true;setInterval(renderPreview,200);
  }
}
function slotHTML([slot,item]){return `<div class="equipSlot"><b>${slot}</b><small>${item}</small></div>`}
