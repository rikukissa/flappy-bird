import identity from 'lodash.identity';
import Bacon from 'baconjs';

import {
  updateBird,
  birdTouchesPipe,
  birdTouchesGround
} from './bird'

import {updateWorld} from './world'
import {updatePipes} from './pipes'

// Game world update
export default function gameLoop(input, initials) {
  const gameOutput = new Bacon.Bus();

  const birdTouchedGround = gameOutput.flatMap(birdTouchesGround);
  const birdTouchedPipe = gameOutput.map(birdTouchesPipe);

  const output = Bacon.zipWith(
    (birdTouchedGround, birdTouchedPipe) => ({birdTouchedGround, birdTouchedPipe}),
    birdTouchedGround.startWith(false),
    birdTouchedPipe.startWith(false)
  )

  const io = Bacon.zipAsArray(
    input,
    output
  );

  const updatedWorld = io.scan(initials.world, updateWorld).skip(1);

  const updatedBird = Bacon.zipAsArray(io, updatedWorld)
    .scan(initials.bird, updateBird).skip(1);

  const updatedPipes = Bacon.zipAsArray(updatedWorld, updatedBird)
    .scan(initials.pipes, updatePipes).skip(1);

  const game = Bacon.zipWith(
    (world, bird, pipes) => ({
      world,
      bird,
      pipes
    }),
    updatedWorld,
    updatedBird,
    updatedPipes);

  game.onValue(gameOutput.push.bind(gameOutput));

  return game;
}
