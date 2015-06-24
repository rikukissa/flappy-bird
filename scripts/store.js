import Bacon from 'baconjs';
import pluck from 'lodash.pluck';
import get from 'lodash.get';
import identity from 'lodash.identity';
import partialRight from 'lodash.partialright';
import {replaceNotifier$} from './hotReplaceNotifier';

const sliderEl = document.getElementById('future-slider');
const framesEl = document.getElementById('frames');

import {PAUSE_KEY} from './constants';

const recordedStates$ = new Bacon.Bus();

const sliderChange$ = Bacon.fromEvent(sliderEl, 'input')
  .map(e => parseInt(e.target.value, 10));

const paused$ = Bacon.fromEvent(window, 'keydown')
  .filter(ev => ev.keyCode === PAUSE_KEY)
  .scan(false, paused => !paused);

paused$.filter(identity).onValue(() => sliderEl.focus());

const allStates$ = recordedStates$.scan([], (states, value) => {
  states.push(value)
  return states;
});

const updateRequest$ = Bacon.combineWith(identity, sliderChange$, replaceNotifier$);
const isRunning$ = updateRequest$.map(false).toProperty().startWith(true).and(paused$.not());

const selectedState$ = Bacon.combineWith((arr, index) => arr[index] || arr[arr.length - 1],
  allStates$.filter(isRunning$),
  updateRequest$).map('.state').toEventStream();

const futureInput$ = allStates$.sampledBy(
  updateRequest$,
  (arr, index) => arr.slice(index + 1)
  ).map(partialRight(pluck, 'input'));

allStates$.map('.length').onValue(x => {
  sliderEl.max = x;
  sliderEl.value = x;
  framesEl.innerHTML = x;
})

module.exports.record = recordedStates$.push.bind(recordedStates$);
module.exports.isRunning$ = isRunning$;
module.exports.selectedState$ = selectedState$;
module.exports.futureInput$ = futureInput$;
