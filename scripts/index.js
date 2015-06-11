import set from 'lodash.set';
import clone from 'lodash.clone';

import Bacon from 'bacon.animationframe';
require('./bufferUntilValue');

import render from './render'

const FRAME_RATE = 1000 / 60;
const WORLD_HEIGHT = 200;
const BIRD_HEIGHT = 10;

const frames = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE);
const input = Bacon.fromEvent(window, 'click');

const tick = input.bufferUntilValue(frames)

const bus = new Bacon.Bus();
const stopStream = bus.startWith(false);

const initialBird = {
  radius: WORLD_HEIGHT,
  y: WORLD_HEIGHT / 2 - BIRD_HEIGHT / 2,
  vy: 0,
  tick: 0
};

const updatedWorld = Bacon.combineAsArray(tick, stopStream).scan({
  running: false,
  height: WORLD_HEIGHT
}, (world, [input, stop]) => {

  world.tick++;

  if(!world.running && input.length > 0) {
    return set(world, 'running', true);
  }

  if(world.running && stop) {
    return set(world, 'running', false);
  }

  return world;
})

const runningGame = Bacon
  .zipAsArray(tick, updatedWorld)
  .filter(([, world]) => world.running)
  .map(([input]) => input)



const updatedBird = Bacon.combineAsArray(runningGame, stopStream.startWith(false))
.scan(initialBird, (bird, [input, reset]) => {
  if(reset) {
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
const gameOver = game
  .filter(([world, bird]) => bird.y > 200)
  .filter(([world, bird]) => world.running);

gameOver.onValue(() => {
  bus.push(true);
  bus.push(false);
});

game.onValue(render);

// module.hot.accept('./render', function() {
//   render = require('./render')
// });

// module.hot.accept('./tick', function() {
//   tick = require('./tick')
// });
