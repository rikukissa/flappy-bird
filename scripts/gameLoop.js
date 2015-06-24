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
  const birdTouchedGround$ = gameOutput$.flatMap(birdTouchesGround);
  const birdTouchedPipe$ = gameOutput$.map(birdTouchesPipe);

  const output$ = Bacon.zipWith(
    toObject('birdTouchedGround', 'birdTouchedPipe'),
    birdTouchedGround$.startWith(birdTouchesGround(initials)),
    birdTouchedPipe$.startWith(birdTouchesPipe(initials))
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

  return game$;
}
