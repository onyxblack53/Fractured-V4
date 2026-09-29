const NODES={
  greeting: {
    speech:"Well, another soul on Aradavia's broken road. The sky has been tearing since the Thirteenth Scholar's ritual. I am S’var. Come closer; I can tell you what happened and how to cross these ruins.",
    choices:[['What happened to Aradavia?','history'],['Who are you?','identity'],['Show me how to survive.','tutorial'],['I’m ready to go.','leave']]
  },
  history: {
    speech:"Aradavia was a golden nation of magic and machines, governed by thirteen arcane scholars. Deep beneath the earth, they found the Black Gem. They swore to seal it in the void. One of them wanted its power for himself.",
    choices:[['What did he do?','fall'],['How do I cross the ruins?','tutorial'],['Back','greeting']]
  },
  fall: {
    speech:"During the sealing, the Thirteenth Scholar tethered the darkness to himself. The gem vanished, but its darkness remained. He slew the other scholars, stole their power, and cast a forgotten curse. The earth and sky cracked; creatures poured through. The cathedral ahead may still hold a trace of the seal.",
    choices:[['Why was I drawn here?','origin'],['How do I reach the cathedral?','tutorial'],['I’m ready to go.','leave']]
  },
  identity: {
    speech:"S’var. I was the Council's fool. They seldom listened to a jester, which may be why I am still here to tell you what they did.",
    choices:[['Tell me about the Black Gem.','history'],['Teach me the path.','tutorial'],['Back','greeting']]
  },
  origin: {
    speech:null,
    choices:[['Show me the way.','tutorial'],['I’m ready to go.','leave'],['Back','greeting']]
  },
  tutorial: {
    speech:"Use the left pad to move. Jump onto the broken stones to climb over them. ATK strikes, BLK guards, and DODGE gets you clear. HEAL costs stamina. Your three abilities sit in slots I, II, and III; each needs a few seconds to recharge. Follow the path to the cathedral door.",
    choices:[['What happened to Aradavia?','history'],['I’m ready to go.','leave'],['Back','greeting']]
  }
};

export class SvarConversation {
  constructor(onLeave) {
    this.root=document.getElementById('svar-dialogue');
    this.speech=document.getElementById('svar-speech');
    this.choices=document.getElementById('svar-choices');
    this.prompt=document.getElementById('svar-prompt');
    this.target=document.getElementById('svar-target');
    this.canInteract=false;
    this.onLeave=onLeave;
    this.opened=false;
    this.finished=false;
    this.origin='angelic-knight';
    this.root.querySelector('#svar-close').addEventListener('click',()=>this.close(false));
    const interact=()=>{if(this.canInteract)this.open(this.origin)};
    this.prompt.addEventListener('click',interact);
    this.target.addEventListener('click',interact);
    this.root.addEventListener('keydown',e=>{if(e.key==='Escape')this.close(false)});
  }
  open(origin) {
    if(this.opened)return;
    this.origin=origin;
    this.opened=true;
    this.prompt.hidden=true;
    this.target.hidden=true;
    this.canInteract=false;
    this.root.hidden=false;
    this.root.setAttribute('aria-hidden','false');
    this.show('greeting');
    this.root.querySelector('#svar-close').focus();
  }
  show(id) {
    if(id==='leave'){this.close(true);return}
    const node=NODES[id];
    this.speech.textContent=id==='origin'
      ? this.origin==='demonic-rogue'
        ? "You crawled out of Hell and turned against its reign. That choice may be the light Aradavia needs. Reach the cathedral and learn what remains of the seal."
        : "You fell through the broken heavens to restore order. Reach the cathedral and learn what remains of the seal."
      :node.speech;
    this.choices.replaceChildren();
    for(const [label,next] of node.choices){
      const button=document.createElement('button');
      button.type='button';button.textContent=label;
      button.addEventListener('click',()=>this.show(next));
      this.choices.appendChild(button);
    }
  }
  close(finished) {
    if(!this.opened)return;
    this.opened=false;
    this.finished ||= finished;
    this.root.hidden=true;
    this.root.setAttribute('aria-hidden','true');
    this.onLeave?.(this.finished);
  }
  updatePrompt(npc,player,cameraX,scene,blocked,viewportHeight) {
    const show=!!(scene==='bridge'&&!blocked&&!this.opened&&npc?.canTalk(player));
    this.canInteract=show;
    this.prompt.hidden=!show;
    this.target.hidden=!show;
    if(show){
      const x=npc.x-cameraX,h=npc.height(viewportHeight);
      this.prompt.style.left=`${Math.max(76,Math.min(innerWidth-76,x))}px`;
      this.prompt.style.top=`${Math.max(12,npc.groundY-h-44)}px`;
      Object.assign(this.target.style,{left:`${x-48}px`,top:`${npc.groundY-h}px`,width:'96px',height:`${h}px`});
    }
  }
}
