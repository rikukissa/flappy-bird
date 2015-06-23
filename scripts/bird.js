import some from 'lodash.some';

import {
  WORLD_HEIGHT,
  GROUND_HEIGHT,
  HOLE_HEIGHT,
  PIPE_WIDTH,
  BIRD_RADIUS,
  GRAVITY
} from './constants';

export const initialBird = {
  radius: WORLD_HEIGHT,
  x: 0,
  vx: 2,
  y: WORLD_HEIGHT / 2 - BIRD_RADIUS / 2,
  vy: 0,
  touchesGround: false,
  groundTouchTime: 0
};

export function updateBird(bird, [[input, output], world]) {
  if(!world.running) {
    return initialBird;
  }

  const newBird = {
    x: bird.x + bird.vx,
    vx: output.birdTouchedPipe ? 0 : bird.vx,
    y: bird.y + bird.vy,
    vy: bird.vy - GRAVITY,
    touchesGround: false,
    groundTouchTime: bird.touchesGround ? bird.groundTouchTime + 1 : 0
  }

  const birdBottom = newBird.y - BIRD_RADIUS * 2;

  if(birdBottom <= GROUND_HEIGHT) {
    newBird.y = GROUND_HEIGHT + BIRD_RADIUS * 2;
    newBird.vy = 0;
    newBird.touchesGround = true;
  }

  if(input.clicks.length > 0 && !newBird.touchesGround) {
    newBird.vy = 3;
  }

  return newBird;
};

export function birdTouchesPipe({bird, pipes}) {
  return some(pipes, (pipe) => {
    // Horizontal check
    if(!(bird.x + BIRD_RADIUS*2 > pipe.x && bird.x < pipe.x + PIPE_WIDTH)) return false;

    // Bird not vertically inside the hole
    return !(bird.y < pipe.y && bird.y - BIRD_RADIUS*2 > pipe.y - HOLE_HEIGHT)
  });
}
export function birdTouchesGround({bird}) {
  return bird.y - BIRD_RADIUS * 2 <= GROUND_HEIGHT;
}

require('./hotReplaceNotifier')();
