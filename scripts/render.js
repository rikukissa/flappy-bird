require('./style.css');

import radians from 'degrees-radians';
import {canvas, ctx} from './canvas';

const sprites = {
  background: {x: 0, y: 0, w: 144, h: 256},
  ground: {x: 146, y: 0, w: 154, h: 56},
  score: {x: 146, y: 58, w: 113, h: 58},
  bird: {x: 223, y: 124, w: 17, h: 12},
  bird2: {x: 264, y: 90, w: 17, h: 12},
  pipe: {x: 330, y: 0, w: 26, h: 121},
}

const atlas = new Image()
atlas.src = require('url!../assets/sprite.png');


function drawSprite(context, type, x, y) {
  const sprite = sprites[type];
  context.drawImage(atlas, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
}

function scale(world, y) {
  return (canvas.height / world.height) * y;
}


var running = false;
function updateRunningClass(running) {
  const {classList} = document.body;

  running ? classList.add('running') : classList.remove('running');
}

module.exports = function render([world, bird]) {
  if(world.running !== running) {
    updateRunningClass(world.running);
    running = world.running;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save()
  ctx.translate(canvas.width / 2, scale(world, bird.y))
  ctx.rotate(radians(bird.vy * 7))

  if(bird.vy < 0) {
    drawSprite(ctx, world.tick % 2 === 0 ? 'bird' : 'bird2', 0, 0)
  } else {
    drawSprite(ctx, 'bird', 0, 0)
  }


  ctx.restore()
}
