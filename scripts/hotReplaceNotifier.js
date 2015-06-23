import Bacon from 'baconjs';


const bus = new Bacon.Bus();
module.exports = bus.push.bind(bus);
module.exports.replaceNotifier$ = bus.startWith().delay(1);
