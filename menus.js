import {SLOTS,loadEnhancements,saveEnhancements,applyEnhancements,bonuses} from './enhancements.js?v=71';
import {abilityCatalog,loadAbilities,saveAbilities,assignAbility} from './abilityLoadout.js?v=71';
export function initMenus(getBuild){
 const $=id=>document.getElementById(id),menu=$('rpgMenu'),picker=$('enh-picker');
 let origin='angelic-knight',loadout={},abilities=[],selection=null,returnFocus=null,previewRenderer=null,previewOwner=null,last=0;
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
 function preview(now){if(menu.classList.contains('open')&&previewRenderer&&$('characterPage').classList.contains('active')){const c=$('character-preview'),ctx=c.getContext('2d');ctx.clearRect(0,0,600,600);previewRenderer.update(Math.min(.04,(now-last)/1000||.016),()=>{});previewRenderer.draw(ctx,300,565,1,origin==='demonic-rogue'?440:530,true)}last=now;requestAnimationFrame(preview)}requestAnimationFrame(preview);
}
