import set from 'lodash.set';
import clone from 'lodash.clone';
import Bacon from 'bacon.animationframe';
require('./bufferUntilValue');

import {
  FRAME_RATE,
  WORLD_HEIGHT,
  BIRD_HEIGHT
} from './constants';

import render from './render'

// User events
const input = Bacon.fromEvent(window, 'click');

// Game tick
const frames = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE);
const tick = input.bufferUntilValue(frames)

// Input caused by game state
const gameOutput = new Bacon.Bus();
const birdTouchesGround = gameOutput.map(([, bird]) => bird.y > 300);
const gameEnds = birdTouchesGround;

const allInput = Bacon.zipAsArray(tick, gameEnds.toProperty(false));

const initialBird = {
  radius: WORLD_HEIGHT,
  y: WORLD_HEIGHT / 2 - BIRD_HEIGHT / 2,
  vy: 0
};

const initialWorld = {
  running: false,
  height: WORLD_HEIGHT,
  tick: 0
}

const updatedWorld = allInput.scan(initialWorld, (world, [input, gameEnds]) => {

  world.tick++;

  if(!world.running && input.length > 0) {
    return set(world, 'running', true);
  }

  if(world.running && gameEnds) {
    return set(world, 'running', false);
  }

  return world;
});

const runningWorld = Bacon.zipAsArray(allInput, updatedWorld)

const updatedBird = runningWorld.scan(initialBird, (bird, [[input, gameEnds], world]) => {

  if(!world.running) {
    return initialBird;
  }

  const newBird = {
    y: bird.y + bird.vy,
    vy: bird.vy + 0.1
  }

  if(input.length > 0) {
    newBird.vy = -2;
  }
  return newBird;
});

const game = Bacon.combineAsArray(updatedWorld, updatedBird)

game.onValue(x => gameOutput.push(x));
game.onValue(render);
