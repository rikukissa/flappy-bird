import identity from 'lodash.identity';
import extend from 'extend';
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

const uiInteraction$ = new Bacon.Bus();
const shouldInputBeBlocked$ = uiInteraction$.map('.endCountdown').toProperty().startWith(false);

// User events
const spacePressed$ = Bacon.fromEvent(window, 'keydown').map('.keyCode').filter(x => x === SPACE_KEY);
const mouseClicked$ = Bacon.fromEvent(window, 'click')

// Game tick
const tick$ = Bacon.scheduleAnimationFrame().bufferWithTime(FRAME_RATE);
const userClicksForFrame$ = mouseClicked$
  .merge(spacePressed$)
  .filter(shouldInputBeBlocked$.not())
  .bufferUntilValue(tick$);


// Input caused by game state
const input$ = Bacon.zipWith((clicks, ui) => {
  return extend(ui, {clicks});
}, userClicksForFrame$, uiInteraction$).filter(isRunning$)

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

game$.scan({
  endCountdown: 0,
  gameEnds: false
}, (state, {output}) => {

    const newState = extend({}, state);

    if(newState.endCountdown) {
      newState.endCountdown++;
    }

    if(!newState.endCountdown && (output.birdTouchedGround || output.birdTouchedPipe)) {
      newState.endCountdown = 1;
    }

    if(newState.endCountdown > 100) {
      newState.gameEnds = true;
    }

    if(output.gameRestarted) {
      newState.endCountdown = 0;
      newState.gameEnds = false;
    }
    return newState;
}).onValue(uiInteraction$.push.bind(uiInteraction$))

// Rendering
game$.merge(selectedState$).onValue(require('./render'));


