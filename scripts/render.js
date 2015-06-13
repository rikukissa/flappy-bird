import radians from 'degrees-radians';

require('./style.css');

import {
  FRAME_RATE,
  WORLD_HEIGHT,
  BIRD_HEIGHT
} from './constants';

import {canvas, ctx} from './canvas';

const sprites = {
  background: {x: 0, y: 0, w: 144, h: 256},
  ground: {x: 146, y: 0, w: 153, h: 56},
  score: {x: 146, y: 58, w: 113, h: 58},
  bird: {x: 223, y: 124, w: 17, h: 12},
  bird2: {x: 264, y: 90, w: 17, h: 12},
  pipe: {x: 330, y: 0, w: 26, h: 121},
}

const atlas = new Image()
atlas.src = require('url!../assets/sprite.png');


function drawSprite(context, type, x, y, w, h) {
  const sprite = sprites[type];
  context.drawImage(atlas, sprite.x, sprite.y, sprite.w, sprite.h, x, y, w, h);
}


function scale(y) {
  return (canvas.height / WORLD_HEIGHT) * y;
}


let running = false;
function updateRunningClass(running) {
  const {classList} = document.body;

  running ? classList.add('running') : classList.remove('running');
}


function renderBird(world, bird) {
  const sprite = sprites.bird;

  ctx.save()
  ctx.translate(canvas.width / 2, scale(bird.y))
  ctx.rotate(radians(bird.vy * 7))

  if(bird.vy < 0) {
    const asset = world.tick % 10 < 5 ? 'bird' : 'bird2';
    drawSprite(ctx, asset, 0, 0, scale(sprite.w), scale(sprite.h))
  } else {
    drawSprite(ctx, 'bird', 0, 0, scale(sprite.w), scale(sprite.h))
  }

  ctx.restore()
}

function renderGround(world) {
  const sprite = sprites.ground;
  const spriteWidth = scale(sprite.w);
  const spriteHeight = scale(sprite.h);

  ctx.save();

  let movement = 0;

  if(world.running) {
    movement = (world.tick * 4) % spriteWidth * -1;
  }

  ctx.translate(0 + movement, canvas.height - spriteHeight);

  for(let i = 0; i < Math.ceil(canvas.width / spriteWidth) + 1; i++) {
    drawSprite(ctx, 'ground', 0, 0, spriteWidth, spriteHeight)
    ctx.translate(spriteWidth - 1, 0)
  }

  ctx.restore();
}

function renderBackground(world) {
  const sprite = sprites.background;

  const spriteWidth = scale(sprite.w);
  const spriteHeight = scale(sprite.h);

  ctx.save();

  ctx.translate(0, -scale(sprite.h) * 0.25);

  for(let i = 0; i < Math.ceil(canvas.width / spriteWidth) + 1; i++) {
    drawSprite(ctx, 'background', 0, 0, spriteWidth, spriteHeight)
    ctx.translate(spriteWidth - 1, 0)
  }

  ctx.restore();
}

module.exports = function render([world, bird]) {
  if(world.running !== running) {
    updateRunningClass(world.running);
    running = world.running;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderBackground(world);
  renderGround(world);
  renderBird(world, bird);
}
