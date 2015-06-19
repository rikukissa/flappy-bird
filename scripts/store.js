import Bacon from 'bacon.animationframe';
import get from 'lodash.get';
import partialRight from 'lodash.partialright';

const sliderEl = document.getElementById('slider');
const framesEl = document.getElementById('frames');

const bus = new Bacon.Bus();

const sliderChange$ = Bacon.fromEvent(document.getElementById('slider'), 'input')
  .map(e => parseInt(e.target.value, 10));


const isManual$ = sliderChange$.map(true).toProperty(false);

const states$ = bus.scan([], (states, value) => {
  states.push(value)
  return states;
});


const selectedState$ = Bacon.combineWith((arr, index) => arr[index] || arr[arr.length - 1],
  states$.filter(isManual$.not()),
  sliderChange$).toEventStream();

const futureInput$ = Bacon.zipWith((arr, index) => arr.slice(index, arr.length).slice(0, 50),
  states$.filter(isManual$.not()),
  sliderChange$).flatMap(Bacon.fromArray).map(partialRight(get, 'input'));

const newStatesLength$ = states$.map(a => a.length);

newStatesLength$.filter(isManual$.not())
  .onValue(val => sliderEl.value = val)

newStatesLength$.onValue(x => {
  sliderEl.max = x;
  framesEl.innerHTML = x;
})

module.exports.record = bus.push.bind(bus);
module.exports.isManual$ = isManual$;
module.exports.selectedState$ = selectedState$;
module.exports.futureInput$ = futureInput$;
