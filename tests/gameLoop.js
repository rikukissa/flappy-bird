import Bacon from 'baconjs'
import assert from 'assert';

import gameLoop from '../scripts/gameLoop'
import {initialBird} from '../scripts/bird'
import {initialWorld} from '../scripts/world'
import {initialPipes} from '../scripts/pipes'
import {GRAVITY} from '../scripts/constants'

function velocityAfterTicks(initial, ticks) {
  for(let i = 0; i < ticks; i++) {
    initial -= GRAVITY;
  }
  return initial;
}

function velocityAfterClicks(ticks) {
  return ticks.reduce((memo, num) => {
    if(num) {
      return 3;
    }
    return memo - GRAVITY;
  }, 0);
}

function positionAfterClicks(initial, ticks) {
  return ticks.reduce((memo, num) => {
    const y = memo.y + memo.vy;

    if(num) {
      return {y, vy: 3};
    }
    return {y, vy: memo.vy - GRAVITY};
  }, {y: initial, vy: 0}).y;
}

describe('Game loop', function() {
  it('should compute the right future for given input', function(done) {
    var clicks = [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
    var input = clicks.map(num => ({clicks: new Array(num)}));

    gameLoop(Bacon.fromArray(input).delay(0), {
      bird: initialBird,
      pipes: initialPipes,
      world: initialWorld
    }).last().onValue((state) => {
      assert.equal(state.world.tick, clicks.length);
      assert.equal(state.bird.vy, velocityAfterClicks(clicks));
      assert.equal(state.bird.y, positionAfterClicks(initialBird.y, clicks));
      done();
    });
  });
})
