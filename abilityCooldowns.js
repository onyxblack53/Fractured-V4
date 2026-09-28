// Independent timers advance with unpaused game time.
export class AbilityCooldowns {
  constructor(durations=[4,6,8]){this.durations=[...durations];this.remaining=durations.map(()=>0);}
  use(index){
    if(!Number.isInteger(index)||index<0||index>=this.remaining.length||this.remaining[index]>0)return false;
    this.remaining[index]=this.durations[index];return true;
  }
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.remaining=this.remaining.map(value=>Math.max(0,value-dt));
  }
}
