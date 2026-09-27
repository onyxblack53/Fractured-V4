import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.window = {innerWidth:393, innerHeight:852};
globalThis.Image = class {
  set src(value) {
    this.url=value;
    queueMicrotask(()=>{
      try {
        const bytes=readFileSync(new URL('../'+value.split('?')[0],import.meta.url));
        this.naturalWidth=bytes.readUInt32BE(16);
        this.naturalHeight=bytes.readUInt32BE(20);
        this.complete=true;
        this.onload?.();
      } catch {this.onerror?.();}
    });
  }
};
const {GoblinEnemy}=await import('../goblinEnemy.js');
const {Player}=await import('../player.js');

test('all NPC frames exist and use a directory separate from knight art',async()=>{
  const enemy=new GoblinEnemy(280,600), player=new Player(140,600);
  assert.equal(await enemy.ready,true);
  const frames=Object.values(enemy.images).flat();
  assert.equal(new Set(frames.map(f=>f.url)).size,36);
  for(const frame of frames) assert.match(frame.url,/^\.\/assets\/goblin-v35\//);
  assert.equal(player.renderer.images.idle[0].naturalWidth,900);
  assert.notEqual(frames[0].url,player.renderer.images.idle[0].url);
});

test('enemy AI moves independently, respects pause and body spacing',async()=>{
  const enemy=new GoblinEnemy(320,600), player=new Player(140,600);
  await enemy.ready;
  enemy.update(.1,player,1500,true);
  assert.equal(enemy.x,320);
  enemy.update(.1,player,1500);
  assert.ok(enemy.x<320);
  assert.equal(player.x,140);
  enemy.x=player.x;
  enemy.update(.016,player,1500);
  assert.ok(Math.abs(enemy.x-player.x)>=138);
});

test('player sword hits enemy once per swing; enemy can attack player',async()=>{
  const enemy=new GoblinEnemy(278,600),player=new Player(140,600);
  await enemy.ready;
  player.facing=1;
  player.activeHitbox={x:34,y:-92,w:118,h:76,damage:20,knockback:220,ttl:.09};
  enemy.takeHit(player);
  enemy.takeHit(player);
  assert.equal(enemy.hp,80);
  player.activeHitbox=null;
  enemy.setState('idle',true);enemy.attackCooldown=0;
  for(let i=0;i<30;i++)enemy.update(.016,player,1500);
  assert.ok(player.hp<100);
});

test('an unloaded enemy cannot attack invisibly',async()=>{
  const enemy=new GoblinEnemy(278,600),player=new Player(140,600);
  await enemy.ready;enemy.assetsLoaded=false;enemy.attackCooldown=0;
  for(let i=0;i<180;i++)enemy.update(.016,player,1500);
  assert.equal(player.hp,100);assert.equal(enemy.state,'idle');
});

test('defeated NPC fades out and no longer attacks',async()=>{
  const enemy=new GoblinEnemy(278,600),player=new Player(140,600);
  await enemy.ready;
  player.activeHitbox={x:34,y:-92,w:118,h:76,damage:100,knockback:0};
  enemy.takeHit(player);player.activeHitbox=null;
  for(let i=0;i<120;i++)enemy.update(.016,player,1500);
  assert.equal(enemy.dead,true);assert.equal(enemy.hp,0);assert.equal(enemy.frame,3);
  assert.equal(player.hp,100);
});
