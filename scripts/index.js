import set from 'lodash.set';
import clone from 'lodash.clone';
import some from 'lodash.some';
import Bacon from 'bacon.animationframe';
require('./bufferUntilValue');

import {
  FRAME_RATE,
  WORLD_HEIGHT,
  BIRD_RADIUS,
  GROUND_HEIGHT,
  PIPE_DISTANCE,
  PAUSE_KEY,
  HOLE_HEIGHT,
  PIPE_WIDTH
} from './constants';

const GRAVITY = 0.2;
const PIPE_OFFSET = WORLD_HEIGHT * 0.4;

import {random} from './utils'

// User events
const userClicks = Bacon.fromEvent(window, 'click');
const paused = Bacon.fromEvent(window, 'keydown')
  .filter(ev => ev.keyCode === PAUSE_KEY).scan(false, paused => !paused);
const manuallyControlled = require('./store').isManual$;

// Game tick
const tick = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE)
  .filter(paused.or(manuallyControlled).not());

const userClicksForFrame = userClicks.bufferUntilValue(tick)

// Input caused by game state
const gameOutput = new Bacon.Bus();

// States coming from store

function birdTouchesGround(bird) {
  return bird.y - BIRD_RADIUS * 2 <= GROUND_HEIGHT;
}

const birdTouchedGround = gameOutput
  .flatMap(([, bird]) => {
    if(birdTouchesGround(bird) && bird.groundTouchTime === 0) {
      return Bacon.later(1000, true);
    }
    return false;
  });

const birdTouchedPipe = gameOutput
  .map(([, bird, pipes]) => {
    return some(pipes, (pipe) => {
      // Horizontal check
      if(!(bird.x + BIRD_RADIUS*2 > pipe.x && bird.x < pipe.x + PIPE_WIDTH)) return false;

      // Bird not vertically inside the hole
      return !(bird.y < pipe.y && bird.y - BIRD_RADIUS*2 > pipe.y - HOLE_HEIGHT)
    });
  });

const gameEnds = birdTouchedGround;

const output = Bacon.zipWith(
  (birdTouchedGround, birdTouchedPipe, gameEnds) => ({birdTouchedGround, birdTouchedPipe, gameEnds}),
  birdTouchedGround.startWith(false),
  birdTouchedPipe.startWith(false),
  gameEnds.startWith(false))

const input = Bacon.zipWith((userClicksForFrame) => ({clicks: userClicksForFrame}), userClicksForFrame)

const io = Bacon.zipAsArray(input, output);


//io.log()
// Initial values
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


const updatedWorld = io.scan(initialWorld, (world, [input, output]) => {
  world.tick++;

  if(!world.running && input.clicks.length > 0) {
    return set(world, 'running', true);
  }

  if(world.running && output.gameEnds) {
    return set(world, 'running', false);
  }

  return world;
});


const updatedBird = Bacon.zipAsArray(io, updatedWorld)
.scan(initialBird, (bird, [[input, output], world]) => {
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
});
const updatedPipes = Bacon.zipAsArray(updatedWorld, updatedBird)
.scan(initialPipes, (pipes, [world, bird]) => {
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
      y: random(PIPE_OFFSET, WORLD_HEIGHT)
    })
  }

  return newPipes;
});

const game = Bacon.zipAsArray(updatedWorld, updatedBird, updatedPipes)

game.onValue(require('./store'));
game.onValue(world => gameOutput.push(world));

// Rendering
let destroyRenderer = game.merge(require('./store').selectedState$).onValues(require('./render'));
module.hot.accept('./render', () => {
  destroyRenderer();
  destroyRenderer = game.merge(require('./store').selectedState$).onValues(require('./render'));
});
