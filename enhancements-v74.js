export const SLOTS=[
 {id:'power',name:'Power',icon:'✦',items:[{id:'keen',name:'Keen Sigil',text:'+10% damage',bonus:{damage:.10}},{id:'ember',name:'Ember Sigil',text:'+6% damage · +5 stamina',bonus:{damage:.06,stamina:5}}]},
 {id:'ward',name:'Ward',icon:'⬡',items:[{id:'iron',name:'Iron Ward',text:'10% damage resistance',bonus:{resist:.10}},{id:'shelter',name:'Shelter Ward',text:'6% resistance · +5 health',bonus:{resist:.06,hp:5}}]},
 {id:'vitality',name:'Vitality',icon:'♥',items:[{id:'heart',name:'Heart Shard',text:'+20 maximum health',bonus:{hp:20}},{id:'root',name:'Root Shard',text:'+10 health · 4% resistance',bonus:{hp:10,resist:.04}}]},
 {id:'endurance',name:'Endurance',icon:'◈',items:[{id:'well',name:'Deep Well',text:'+20 maximum stamina',bonus:{stamina:20}},{id:'breath',name:'Wind Breath',text:'+10 stamina · +4% movement',bonus:{stamina:10,speed:.04}}]},
 {id:'haste',name:'Haste',icon:'➤',items:[{id:'stride',name:'Swift Stride',text:'+8% movement speed',bonus:{speed:.08}},{id:'hunter',name:'Hunter’s Step',text:'+4% movement · +4% damage',bonus:{speed:.04,damage:.04}}]}
];
const baseStats=new WeakMap();
export function cleanLoadout(raw){
 const result={};for(const slot of SLOTS)if(slot.items.some(i=>i.id===raw?.[slot.id]))result[slot.id]=raw[slot.id];return result;
}
export function loadEnhancements(origin){try{return cleanLoadout(JSON.parse(localStorage.getItem('fractured.enhancements.v1.'+origin)||'{}'))}catch{return {}}}
export function saveEnhancements(origin,loadout){try{localStorage.setItem('fractured.enhancements.v1.'+origin,JSON.stringify(cleanLoadout(loadout)))}catch{}}
export function bonuses(loadout){
 const b={damage:0,resist:0,hp:0,stamina:0,speed:0};
 for(const slot of SLOTS){const item=slot.items.find(i=>i.id===loadout?.[slot.id]);if(item)for(const [k,v] of Object.entries(item.bonus))b[k]+=v;}
 return b;
}
export function applyEnhancements(player,loadout){
 if(!player)return;
 if(!baseStats.has(player))baseStats.set(player,{hp:player.maxHp,stamina:player.maxStamina,speed:player.speed,run:player.runSpeed});
 const base=baseStats.get(player),b=bonuses(loadout);
 player.maxHp=base.hp+b.hp;player.maxStamina=base.stamina+b.stamina;
 player.hp=Math.min(player.hp,player.maxHp);player.stamina=Math.min(player.stamina,player.maxStamina);
 player.speed=base.speed*(1+b.speed);player.runSpeed=base.run*(1+b.speed);
 player.damageMultiplier=1+b.damage;player.damageResistance=b.resist;
}
