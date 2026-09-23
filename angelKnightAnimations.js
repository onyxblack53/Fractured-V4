// FRACTURED — Angel Knight Animation Definitions
// Replacement file for the 32-PNG animation pipeline.
// Update BASE_PATH only if your PNGs live somewhere else.

export const ANGEL_KNIGHT_BASE_PATH = "assets/angel-knight/";

const f = (n, options = {}) => ({
  id: n,
  src: `${ANGEL_KNIGHT_BASE_PATH}${n}.png`,
  x: 0,
  y: 0,
  ...options
});

/*
  IMPORTANT:
  The groups below use all 32 numbered PNGs.
  If your pose order differs, only change the frame numbers in this file.
  The renderer does not need to be rewritten.

  Idle is deliberately conservative:
  - lower FPS
  - no programmed horizontal bob
  - no programmed vertical bob
  The renderer will normalize the visible artwork to a fixed foot anchor.
*/
export const ANGEL_KNIGHT_ANIMATIONS = {
  idle: {
    fps: 5,
    loop: true,
    lockBody: true,
    frames: [f(1), f(2), f(3), f(4)]
  },

  walk: {
    fps: 10,
    loop: true,
    lockBody: false,
    frames: [f(5), f(6), f(7), f(8), f(9), f(10)]
  },

  run: {
    fps: 12,
    loop: true,
    lockBody: false,
    frames: [f(11), f(12), f(13), f(14)]
  },

  jump: {
    fps: 9,
    loop: false,
    holdLastFrame: true,
    lockBody: false,
    frames: [f(15), f(16), f(17)]
  },

  fall: {
    fps: 7,
    loop: true,
    lockBody: false,
    frames: [f(18), f(19)]
  },

  attack1: {
    fps: 13,
    loop: false,
    returnTo: "idle",
    lockBody: false,
    frames: [f(20), f(21), f(22), f(23)]
  },

  attack2: {
    fps: 14,
    loop: false,
    returnTo: "idle",
    lockBody: false,
    frames: [f(24), f(25), f(26), f(27)]
  },

  block: {
    fps: 7,
    loop: true,
    lockBody: true,
    frames: [f(28), f(29)]
  },

  dodge: {
    fps: 14,
    loop: false,
    returnTo: "idle",
    lockBody: false,
    frames: [f(30), f(31)]
  },

  heal: {
    fps: 6,
    loop: true,
    lockBody: true,
    frames: [f(32)]
  }
};

export function getAnimation(name) {
  return ANGEL_KNIGHT_ANIMATIONS[name] || ANGEL_KNIGHT_ANIMATIONS.idle;
}

export function listAngelKnightFrames() {
  return Array.from({ length: 32 }, (_, i) => i + 1);
}
