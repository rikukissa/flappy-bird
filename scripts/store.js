import Bacon from 'bacon.animationframe';
import pluck from 'lodash.pluck';
import get from 'lodash.get';
import identity from 'lodash.identity';
import partialRight from 'lodash.partialright';
import {replaceNotifier$} from './hotReplaceNotifier';
const sliderEl = document.getElementById('slider');
const framesEl = document.getElementById('frames');

import {PAUSE_KEY} from './constants';

const bus = new Bacon.Bus();

const sliderChange$ = Bacon.fromEvent(document.getElementById('slider'), 'input')
  .map(e => parseInt(e.target.value, 10));


const states$ = bus.scan([], (states, value) => {
  states.push(value)
  return states;
});

const updateRequest$ = Bacon.combineWith(identity, sliderChange$, replaceNotifier$);

const paused = Bacon.fromEvent(window, 'keydown')
  .filter(ev => ev.keyCode === PAUSE_KEY)
  .scan(false, paused => !paused);

const shouldRun$ = updateRequest$.map(false).toProperty().startWith(true).and(paused.not());

const selectedState$ = Bacon.combineWith((arr, index) => arr[index] || arr[arr.length - 1],
  states$.filter(shouldRun$),
  updateRequest$).toEventStream();


const futureInput$ = Bacon.zipWith((arr, index) => arr.slice(index, arr.length),
  states$.filter(shouldRun$),
  updateRequest$).map(partialRight(pluck, 'input'));

const newStatesLength$ = states$.map(a => a.length);

newStatesLength$.filter(shouldRun$)
  .onValue(val => sliderEl.value = val)

newStatesLength$.onValue(x => {
  sliderEl.max = x;
  framesEl.innerHTML = x;
})

module.exports.record = bus.push.bind(bus);
module.exports.shouldRun$ = shouldRun$;
module.exports.selectedState$ = selectedState$;
module.exports.futureInput$ = futureInput$;
