import extend from 'extend';
import identity from 'lodash.identity';
import {toObject} from './utils'
import Bacon from 'baconjs';

import {
  updateBird,
  birdTouchesPipe,
  birdTouchesGround
} from './bird'

import {updateWorld} from './world'
import {updatePipes} from './pipes'

// Game world update
export default function createGameLoop(input$, initials) {
  const gameOutput$ = new Bacon.Bus();

  // Output streams
  const birdTouchedGround$ = gameOutput$.flatMap(birdTouchesGround).toProperty();
  const birdTouchedPipe$ = gameOutput$.map(birdTouchesPipe).toProperty();
  const gameRestarted$ = gameOutput$.map(({world}) => world.restarted).toProperty();

  const output$ = Bacon.zipWith(
    toObject('birdTouchedGround', 'birdTouchedPipe', 'gameRestarted'),
    birdTouchedGround$.startWith(birdTouchesGround(initials)),
    birdTouchedPipe$.startWith(birdTouchesPipe(initials)),
    gameRestarted$.startWith(false)
  )

  const io$ = Bacon.zipAsArray(input$, output$);

  const updatedWorld$ = io$
    .scan(initials.world, updateWorld).skip(1);

  const updatedBird$ = Bacon.zipAsArray(io$, updatedWorld$)
    .scan(initials.bird, updateBird).skip(1);

  const updatedPipes$ = Bacon.zipAsArray(updatedWorld$, updatedBird$)
    .scan(initials.pipes, updatePipes).skip(1);

  const game$ = Bacon.zipWith(
    toObject('world', 'bird', 'pipes'),
    updatedWorld$,
    updatedBird$,
    updatedPipes$);

  game$.onValue(gameOutput$.push.bind(gameOutput$));

  return Bacon.zipWith((game, output) => extend(game, {output}), game$, output$);
}
