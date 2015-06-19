import set from 'lodash.set';
import {WORLD_HEIGHT} from './constants';

export const initialWorld = {
  running: false,
  height: WORLD_HEIGHT,
  tick: 0
}

export function updateWorld(world, [input, output]) {
  world.tick++;

  if(!world.running && input.clicks.length > 0) {
    return set(world, 'running', true);
  }

  if(world.running && output.gameEnds) {
    return set(world, 'running', false);
  }

  return world;
};
