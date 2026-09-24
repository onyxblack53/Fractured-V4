// Updated Angel Knight animation map using the fixed replacement PNGs.
// The 6 broken frames were swapped with repaired versions:
// attack1_1, attack1_2, attack2_1, attack2_2, attack3_1, attack3_2

export const ANGEL_KNIGHT_BASE_PATH = "assets/angel-knight-fixed/";
const f = (name, options = {}) => ({ id:name, src:`${ANGEL_KNIGHT_BASE_PATH}${name}.png`, x:0, y:0, ...options });

export const ANGEL_KNIGHT_ANIMATIONS = {
  idle: {
    fps: 5,
    loop: true,
    lockBody: true,
    frames: [f('idle_0'), f('idle_1', {x:-1, y:1}), f('idle_2', {x:-2, y:-3}), f('idle_3', {x:-1, y:1})]
  },
  walk: {
    fps: 8,
    loop: true,
    frames: [f('run_0'), f('run_1'), f('run_2'), f('run_3')]
  },
  run: {
    fps: 10,
    loop: true,
    frames: [f('run_0'), f('run_1'), f('run_2'), f('run_3')]
  },
  jump: {
    fps: 9,
    loop: false,
    holdLastFrame: true,
    frames: [f('jump_0'), f('jump_1'), f('jump_2'), f('jump_3')]
  },
  fall: {
    fps: 7,
    loop: true,
    frames: [f('jump_2'), f('jump_3')]
  },
  dodge: {
    fps: 14,
    loop: false,
    returnTo: 'idle',
    frames: [f('dodge_0'), f('dodge_1'), f('dodge_2'), f('dodge_3')]
  },
  block: {
    fps: 5,
    loop: true,
    lockBody: true,
    frames: [f('block_0'), f('block_1'), f('block_2'), f('block_3')]
  },
  attack1: {
    fps: 11,
    loop: false,
    returnTo: 'idle',
    frames: [f('attack1_0'), f('attack1_1'), f('attack1_2'), f('attack1_3')]
  },
  attack2: {
    fps: 11,
    loop: false,
    returnTo: 'idle',
    frames: [f('attack2_0'), f('attack2_1'), f('attack2_2'), f('attack2_3')]
  },
  attack3: {
    fps: 10,
    loop: false,
    returnTo: 'idle',
    frames: [f('attack3_0'), f('attack3_1'), f('attack3_2'), f('attack3_3')]
  }
};

export function getAnimation(name) {
  return ANGEL_KNIGHT_ANIMATIONS[name] || ANGEL_KNIGHT_ANIMATIONS.idle;
}
