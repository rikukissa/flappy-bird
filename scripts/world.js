import extend from 'extend';
import set from 'lodash.set';
import {WORLD_HEIGHT} from './constants';

export const initialWorld = {
  running: false,
  tick: 0
}

export function updateWorld(world, [input, output]) {
  const newWorld = {
    running: world.running,
    tick: world.tick + 1,
    restarted: false
  };

  if(!newWorld.running && input.clicks.length > 0) {
    newWorld.running = true;
  }

  if(newWorld.running && input.gameEnds) {
    newWorld.running = false;
    newWorld.restarted = true;
  }

  return newWorld;
};

require('./hotReplaceNotifier')();
