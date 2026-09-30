export const ANGEL_ABILITIES=[
 {id:'celestial_light',name:'Celestial Light',icon:'☀',cooldown:4,text:'Blinding light · 3.5-second stun within 10 ft.'},
 {id:'halo_bolt',name:'Halo Bolt',icon:'ϟ',cooldown:6,text:'A yellow-white holy lightning projectile.'},
 {id:'wing_burst',name:'Wing Burst',icon:'≋',cooldown:8,text:'A damaging gust with knockback.'}
];
export function abilityCatalog(origin){return origin==='angelic-knight'?ANGEL_ABILITIES:[]}
export function cleanAbilities(origin,value){const catalog=abilityCatalog(origin),seen=new Set();return Array.from({length:3},(_,i)=>{const id=Array.isArray(value)?value[i]:catalog[i]?.id;if(!catalog.some(a=>a.id===id)||seen.has(id))return null;seen.add(id);return id})}
export function loadAbilities(origin){try{const saved=localStorage.getItem('fractured.abilities.v1.'+origin);return cleanAbilities(origin,saved?JSON.parse(saved):undefined)}catch{return cleanAbilities(origin,undefined)}}
export function saveAbilities(origin,ids){try{localStorage.setItem('fractured.abilities.v1.'+origin,JSON.stringify(cleanAbilities(origin,ids)))}catch{}}
export function assignAbility(origin,ids,index,id){const result=cleanAbilities(origin,ids);if(index<0||index>2)return result;if(id!==null&&!abilityCatalog(origin).some(a=>a.id===id))return result;const other=id===null?-1:result.indexOf(id);if(other>=0&&other!==index)result[other]=result[index];result[index]=id;return result}
