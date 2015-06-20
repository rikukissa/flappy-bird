import Bacon from 'bacon.animationframe';


const bus = new Bacon.Bus();
module.exports = bus.push.bind(bus);
module.exports.replaceNotifier$ = bus.startWith().delay(1);
