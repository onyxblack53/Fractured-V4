// Angel-only skills. Keep the two playable origins' skill registries separate.
export const ANGEL_ORIGIN='angelic-knight';
export const ANGEL_ABILITIES=Object.freeze([
  {id:'celestial_light',name:'Celestial Light',icon:'celestial_light_frame_01.png',cooldown:4,
    description:'Blinding light: stuns enemies within 10 ft for 3.5 seconds.'},
  {id:'halo_bolt',name:'Halo Bolt',icon:'halo_bolt_frame_01.png',cooldown:6,
    description:'Yellow-white holy bolt that deals electric damage.'},
  {id:'wing_burst',name:'Wing Burst',icon:'wing_burst_frame_01.png',cooldown:8,
    description:'Wing-driven air blast that damages and knocks enemies back.'}
]);
// Existing Rogue placeholders remain independent and do not use the angel image paths.
export const ROGUE_ABILITIES=Object.freeze([
  {id:'rogue_slot_1',name:'Radiant Burst',icon:null,cooldown:4,description:'Rogue skill placeholder.'},
  {id:'rogue_slot_2',name:'Aegis of Heaven',icon:null,cooldown:6,description:'Rogue skill placeholder.'},
  {id:'rogue_slot_3',name:'Falling Star',icon:null,cooldown:8,description:'Rogue skill placeholder.'}
]);
export function getAbilities(origin){return origin===ANGEL_ORIGIN?ANGEL_ABILITIES:ROGUE_ABILITIES;}
export function useAngelAbility(player,index,enemies=[]){
  if(!player||player.origin!==ANGEL_ORIGIN||!Number.isInteger(index)||index<0||index>=ANGEL_ABILITIES.length)return false;
  const enemyList=Array.isArray(enemies)?enemies:[];
  const targets=enemyList.filter(enemy=>enemy&&!enemy.dead&&Number.isFinite(enemy.x));
  if(index===0){ // Approx. 10ft in the game's world coordinates (10px per foot).
    for(const enemy of targets){
      if(Math.abs(enemy.x-player.x)<=100&&Math.abs((enemy.y??player.y)-player.y)<105){
        enemy.stunRemaining=Math.max(enemy.stunRemaining||0,3.5);
      }
    }
  }else if(index===1){
    for(const enemy of targets){
      const dx=(enemy.x-player.x)*player.facing;
      if(dx>0&&dx<=430&&Math.abs((enemy.y??player.y)-player.y)<75){
        enemy.hp=Math.max(0,(enemy.hp??100)-24*(player.damageMultiplier||1));
        enemy.hitFlash=.18;
        if(enemy.hp===0)enemy.dead=true;
        break; // single target projectile
      }
    }
  }else{
    for(const enemy of targets){
      const dx=(enemy.x-player.x)*player.facing;
      if(dx>=-25&&dx<=155&&Math.abs((enemy.y??player.y)-player.y)<115){
        enemy.hp=Math.max(0,(enemy.hp??100)-18*(player.damageMultiplier||1));
        enemy.vx=player.facing*290;
        enemy.hitFlash=.18;
        if(enemy.hp===0)enemy.dead=true;
      }
    }
  }
  return true;
}
