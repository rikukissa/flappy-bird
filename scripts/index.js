import set from 'lodash.set';
import clone from 'lodash.clone';
import Bacon from 'bacon.animationframe';
require('./bufferUntilValue');

import {
  FRAME_RATE,
  WORLD_HEIGHT,
  BIRD_RADIUS,
  GROUND_HEIGHT,
  PIPE_DISTANCE,
  PAUSE_KEY
} from './constants';

import {random} from './utils'

// User events
const input = Bacon.fromEvent(window, 'click');
const paused = Bacon.fromEvent(window, 'keydown')
  .filter(ev => ev.keyCode === PAUSE_KEY).scan(false, paused => !paused);

// Game tick
const frames = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE);
const tick = input.bufferUntilValue(frames)

// Input caused by game state
const gameOutput = new Bacon.Bus();

function birdTouchesGround(bird) {
  return bird.y - BIRD_RADIUS * 2 <= GROUND_HEIGHT;
}

const birdTouchedGround = gameOutput
  .flatMap(([, bird]) => {
    if(birdTouchesGround(bird) && bird.groundTouchTime === 0) {
      return Bacon.later(1000, true);
    }
    return false;
  })
  .skipDuplicates();

const gameEnds = birdTouchedGround.startWith(false);

const allInput = Bacon.combineAsArray(tick, gameEnds).filter(paused.not());

const initialBird = {
  radius: WORLD_HEIGHT,
  x: 0,
  vx: 2,
  y: WORLD_HEIGHT / 2 - BIRD_RADIUS / 2,
  vy: 0,
  touchesGround: false,
  groundTouchTime: 0
};

const initialWorld = {
  running: false,
  height: WORLD_HEIGHT,
  tick: 0
}

const initialPipes = [];

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
    x: bird.x + bird.vx,
    vx: bird.vx,
    y: bird.y + bird.vy,
    vy: bird.vy - 0.1,
    touchesGround: false,
    groundTouchTime: bird.touchesGround ? bird.groundTouchTime + 1 : 0
  }

  const birdBottom = newBird.y - BIRD_RADIUS * 2;

  if(birdBottom <= GROUND_HEIGHT) {
    newBird.y = GROUND_HEIGHT + BIRD_RADIUS * 2;
    newBird.vy = 0;
    newBird.touchesGround = true;
  }

  if(input.length > 0 && !newBird.touchesGround) {
    newBird.vy = 2;
  }
  return newBird;
});

const updatedPipes = Bacon.zipAsArray(updatedWorld, updatedBird).scan(initialPipes, (pipes, [world, bird]) => {
  if(!world.running) {
    return initialPipes;
  }

  const newPipes = pipes.slice(0);

  if(newPipes.length > 15) {
    newPipes.shift()
  }

  if(bird.x % PIPE_DISTANCE === 0) {
    newPipes.push({
      x: bird.x + (PIPE_DISTANCE * 5),
      height: random(WORLD_HEIGHT/2, WORLD_HEIGHT - WORLD_HEIGHT/4)
    })
  }

  return newPipes;
});

const game = Bacon.combineAsArray(updatedWorld, updatedBird, updatedPipes, tick)

game.onValue(world => gameOutput.push(world));

let destroyRenderer = game.onValues(require('./render'));

module.hot.accept('./render', () => {
  destroyRenderer();
  destroyRenderer = game.onValues(require('./render'));
});
