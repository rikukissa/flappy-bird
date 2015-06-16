import Bacon from 'bacon.animationframe';

const sliderEl = document.getElementById('slider');
const framesEl = document.getElementById('frames');

const bus = new Bacon.Bus();


module.exports = bus.push.bind(bus);

const sliderChange$ = Bacon.fromEvent(document.getElementById('slider'), 'input')
const isManual$ = sliderChange$.map(true).toProperty(false);

const states$ = bus.scan([], (states, value) => {
  states.push(value)
  return states;
});


const selectedState$ = Bacon.zipWith((arr, index) => arr[index] || arr[arr.length - 1],
  states$.filter(isManual$.not()),
  sliderChange$.map(e => parseInt(e.target.value, 10)));

const newStatesLength$ = states$.map(a => a.length);

newStatesLength$.filter(isManual$.not())
  .onValue(val => sliderEl.value = val)

newStatesLength$.onValue(x => {
  sliderEl.max = x;
  framesEl.innerHTML = x;
})

module.exports.stream = new Bacon.Bus()
module.exports.isManual$ = isManual$;
module.exports.selectedState$ = selectedState$;
