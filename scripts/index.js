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
  HOLE_HEIGHT,
  PIPE_WIDTH
} from './constants';

import {record, selectedState$, shouldRun$, futureInput$} from './store'
import {initialBird, updateBird, birdTouchesPipe, birdTouchesGround} from './bird'
import {initialWorld, updateWorld} from './world'
import {initialPipes, updatePipes} from './pipes'

// User events
const userClicks = Bacon.fromEvent(window, 'click');

// Game tick
const tick = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE).filter(shouldRun$);

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
  input.filter(shouldRun$),
  output
);



function scanStreams(fn) {
  var initialValue;
  var accumulator;

  return function(sourceVal, value) {
    if(!initialValue) {
      initialValue = sourceVal;
      accumulator = sourceVal;
    }
    if(sourceVal !== initialValue) {
      accumulator = sourceVal;
      initialValue = sourceVal;
    }
    accumulator = fn(accumulator, value);
    return accumulator;
  }
}

function doTick(state, input) {
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
}

const futures$ = Bacon.zipWith((currentState, futureInputs) => {
  const allFutureStates = [];
  futureInputs.reduce((acc, input) => {
    const newState = doTick(acc, input);
    allFutureStates.push(newState);
    return newState;
  }, currentState)
  return allFutureStates;
}, selectedState$, futureInput$).flatMap(Bacon.fromArray);

// Game world update
const updatedWorld = io.scan(initialWorld, updateWorld);
const updatedBird = Bacon.zipAsArray(io, updatedWorld).scan(initialBird, updateBird);
const updatedPipes = Bacon.zipAsArray(updatedWorld, updatedBird).scan(initialPipes, updatePipes);

const updatedGameWorld = Bacon.zipAsArray(updatedWorld, updatedBird, updatedPipes);

const game = updatedGameWorld.filter(shouldRun$)
  .merge(selectedState$.map('.state'))


Bacon.zipWith((state, tick, input, output) => ({state, tick, input, output}), game, tick, input, output)
  .filter(shouldRun$)
  .onValue(record);

game.onValue(world => gameOutput.push(world));

// Rendering

game.onValues(require('./render'));

Bacon.combineAsArray(futures$.map('.state'), game)
  .onValues(require('./render').renderFuture);
