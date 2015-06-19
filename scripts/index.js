import set from 'lodash.set';
import clone from 'lodash.clone';
import get from 'lodash.get';
import partialRight from 'lodash.partialright';
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

import {record, selectedState$, isManual$, futureInput$} from './store'

import {initialBird, updateBird, birdTouchesPipe, birdTouchesGround} from './bird'
import {initialWorld, updateWorld} from './world'
import {initialPipes, updatePipes} from './pipes'

// User events
const userClicks = Bacon.fromEvent(window, 'click');
const paused = Bacon.fromEvent(window, 'keydown')
  .filter(ev => ev.keyCode === PAUSE_KEY)
  .scan(false, paused => !paused);

// Game tick
const tick = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE)
  .filter(paused.or(isManual$).not());

const userClicksForFrame = userClicks.bufferUntilValue(tick)

// Input caused by game state
const gameOutput = new Bacon.Bus();

const birdTouchedGround = gameOutput
  .flatMap(([, bird]) => {
    if(birdTouchesGround(bird) && bird.groundTouchTime === 0) {
      return Bacon.later(1000, true);
    }
    return false;
  });

const birdTouchedPipe = gameOutput.map(birdTouchesPipe);

const output = Bacon.zipWith(
  (birdTouchedGround, birdTouchedPipe) => ({birdTouchedGround, birdTouchedPipe}),
  birdTouchedGround.startWith(false),
  birdTouchedPipe.startWith(false))

const input = Bacon.zipWith((userClicksForFrame) => ({clicks: userClicksForFrame}), userClicksForFrame)

const io = Bacon.zipAsArray(
  input.filter(isManual$.not()),
  output
);


function scanStreams(fn) {
  var cachedChar;
  var accumulator;

  return (sourceVal, value) => {
    if(!cachedChar) {
      cachedChar = sourceVal;
      accumulator = sourceVal;
    }
    if(sourceVal !== cachedChar) {
      accumulator = sourceVal;
      cachedChar = sourceVal;
    }
    accumulator = fn(accumulator, value);
    return accumulator;
  }
}

const futureState$ = Bacon.combineWith(scanStreams((state, input) => {
  let [world, bird, pipes] = state.state;
  const {tick} = state;
  let {output} = state;

  world = updateWorld(world, [input, output]);
  bird = updateBird(bird, [[input, output], world]);
  pipes = updatePipes(pipes, [world, bird]);

  output = {
    birdTouchedGround: birdTouchesGround(bird),
    birdTouchedPipe: birdTouchesPipe([world, bird, pipes])
  }

  return {
    state: [world, bird, pipes],
    tick,
    output,
    input
  }
}), selectedState$, futureInput$)

// Game world update
const updatedWorld = io.scan(initialWorld, updateWorld);
const updatedBird = Bacon.zipAsArray(io, updatedWorld).scan(initialBird, updateBird);
const updatedPipes = Bacon.zipAsArray(updatedWorld, updatedBird).scan(initialPipes, updatePipes);

const updatedGameWorld = Bacon.zipAsArray(updatedWorld, updatedBird, updatedPipes);

const game = updatedGameWorld.filter(isManual$.not())
  .merge(selectedState$.map('.state'))


Bacon.zipWith((state, tick, input, output) => ({state, tick, input, output}), game, tick, input, output)
  .filter(isManual$.not())
  .onValue(record);

game.onValue(world => gameOutput.push(world));

// Rendering
function connect() {
  const renderer = require('./render');
  return [game.onValues(renderer),
          Bacon.combineAsArray(
            futureState$.map('.state'),
            game
          ).onValues(renderer.renderFuture)];
}

let destroyRenderers = connect();

if(module.hot) {
  module.hot.accept('./render', () => {
    destroyRenderers.forEach(fn => fn());
    destroyRenderers = connect();
  });
}
