import extend from 'extend';
import set from 'lodash.set';
import {WORLD_HEIGHT} from './constants';

export const initialWorld = {
  running: false,
  height: WORLD_HEIGHT,
  tick: 0
}

export function updateWorld(world, [input, output]) {
  const w = {
    running: world.running,
    height: world.height,
    tick: world.tick + 1
  };

  if(!w.running && input.clicks.length > 0) {
    return set(w, 'running', true);
  }

  if(w.running && output.gameEnds) {
    return set(w, 'running', false);
  }

  return w;
};

require('./hotReplaceNotifier')();
