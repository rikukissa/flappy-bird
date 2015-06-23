import identity from 'lodash.identity';
import Bacon from 'baconjs';
require('bacon.animationframe');
require('./bufferUntilValue');

import {
  FRAME_RATE,
  SPACE_KEY
} from './constants';

import {record, selectedState$, isRunning$, futureInput$} from './store'
import gameLoop from './gameLoop'
import {initialBird} from './bird'
import {initialWorld} from './world'
import {initialPipes} from './pipes'


// User events
const spacePressed = Bacon.fromEvent(window, 'keydown').map('.keyCode').filter(x => x === SPACE_KEY);
const mouseClicked = Bacon.fromEvent(window, 'click')

// Game tick
const tick = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE)
  .filter(isRunning$);

const userClicksForFrame = mouseClicked.merge(spacePressed).bufferUntilValue(tick)

// Input caused by game state
let i = 0;
const input = Bacon.zipWith((clicks) => ({clicks, tick: ++i}),
  userClicksForFrame
  // Possibly more coming
)

const futures$ = Bacon.zipWith((initialState, futureInput) => {
  // console.log(initialState, futureInput);
  return gameLoop(Bacon.fromArray(futureInput), initialState);
}, selectedState$, futureInput$).flatMap(identity);


// futures$.log()

Bacon
  .combineAsArray(futures$, selectedState$)
  .onValues(require('./render').renderFuture)

const game = gameLoop(input.filter(isRunning$), {
  bird: initialBird,
  pipes: initialPipes,
  world: initialWorld
});

Bacon.zipWith((state, input) => ({state, input}), game, input)
.filter(isRunning$)
.onValue(record);


// Rendering
game.merge(selectedState$).onValue(require('./render'));

