import extend from 'extend'
import {random} from './utils'
export const initialPipes = [];

import {
  WORLD_HEIGHT,
  PIPE_DISTANCE,
  PIPE_OFFSET
} from './constants';

export function updatePipes(pipes, [world, bird]) {
  if(!world.running) {
    return initialPipes;
  }

  const newPipes = pipes.slice(0).map((pipe) => extend({}, pipe));

  if(newPipes.length > 15) {
    newPipes.shift()
  }

  if(bird.x % PIPE_DISTANCE === 0) {
    newPipes.push({
      x: bird.x + (PIPE_DISTANCE * 5),
      y: random(PIPE_OFFSET, WORLD_HEIGHT)
    })
  }

  return newPipes;
};
