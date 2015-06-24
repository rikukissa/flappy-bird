import identity from 'lodash.identity';
import Bacon from 'baconjs';
require('bacon.animationframe');
require('./bufferUntilValue');

import {
  FRAME_RATE,
  SPACE_KEY
} from './constants';

import {record, selectedState$, isRunning$, futureInput$} from './store'
import createGameLoop from './gameLoop'
import {initialBird} from './bird'
import {initialWorld} from './world'
import {initialPipes} from './pipes'
import {toObject} from './utils'


// User events
const spacePressed$ = Bacon.fromEvent(window, 'keydown').map('.keyCode').filter(x => x === SPACE_KEY);
const mouseClicked$ = Bacon.fromEvent(window, 'click')

// Game tick
const tick$ = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE);
const userClicksForFrame$ = mouseClicked$.merge(spacePressed$).bufferUntilValue(tick$);

const gameReset$ = new Bacon.Bus();

// Input caused by game state
const input$ = Bacon.zipWith(toObject('clicks'),
  userClicksForFrame$
).filter(isRunning$)

const futures$ = Bacon.zipWith((initialState, futureInput) => {
  return createGameLoop(Bacon.fromArray(futureInput), initialState);
}, selectedState$, futureInput$).flatMap(identity);

Bacon
  .combineAsArray(futures$, selectedState$)
  .onValues(require('./render').renderFuture)

const game$ = createGameLoop(input$, {
  bird: initialBird,
  pipes: initialPipes,
  world: initialWorld
});

Bacon.zipWith(toObject('state', 'input'), game$, input$).onValue(record);

// Rendering
game$.merge(selectedState$).onValue(require('./render'));


