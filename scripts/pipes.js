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

  if(newPipes.length > 25) {
    newPipes.shift()
  }

  const lastPipe = newPipes[newPipes.length - 1];

  if(newPipes.length === 0 || bird.x + (PIPE_DISTANCE * 5) > lastPipe.x + PIPE_DISTANCE) {
    newPipes.push({
      x: bird.x + (PIPE_DISTANCE * 5),
      y: random(PIPE_OFFSET, WORLD_HEIGHT - WORLD_HEIGHT/8)
    })
  }

  return newPipes;
};
