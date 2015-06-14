import radians from 'degrees-radians';

require('./style.css');

import {
  FRAME_RATE,
  WORLD_HEIGHT,
  BIRD_HEIGHT,
  HOLE_HEIGHT,
  GROUND_HEIGHT,
  BIRD_RADIUS
} from './constants';

import {canvas, ctx} from './canvas';

const sprites = {
  background: {x: 0, y: 0, w: 144, h: 256},
  ground: {x: 146, y: 0, w: 153, h: 56},
  score: {x: 146, y: 58, w: 113, h: 58},
  bird: [{x: 223, y: 124, w: 17, h: 12},
        {x: 264, y: 90, w: 17, h: 12},
        {x: 264, y: 63, w: 17, h: 12}],
  pipe: {x: 330, y: 0, w: 26, h: 121},
  pipe2: {x: 302, y: 0, w: 26, h: 135}
}

const atlas = new Image()
atlas.src = require('url!../assets/sprite.png');


function drawSprite(context, sprite, x, y, w, h) {
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

function getFrame(sprites, tick) {
  return sprites[Math.floor(tick / sprites.length) % sprites.length];
}

function renderBird(world, bird) {
  ctx.save()

  //console.log(scale(bird.y), bird.y);
  const radius = scale(BIRD_RADIUS);
  const divider = radius * 2;

  ctx.translate(canvas.width / 2 + radius, canvas.height - scale(bird.y) + radius);


  ctx.rotate(radians(-bird.vy * 7 + bird.groundTouchTime * 4))

  ctx.translate(-radius, -radius)
  //ctx.fillRect(0, 0, scale(BIRD_RADIUS * 2), scale(BIRD_RADIUS * 2))

  const sprite = bird.vy > 0 ? getFrame(sprites.bird, world.tick) : sprites.bird[0];

  const ratio = sprite.w / sprite.h;

  drawSprite(ctx, sprite, 0, 0, divider * ratio, divider)

  ctx.restore()
}

function renderGround(bird) {
  const sprite = sprites.ground;
  const spriteWidth = scale(sprite.w);
  const spriteHeight = scale(sprite.h);

  ctx.save();

  const movement = bird.x % spriteWidth * -1;

  ctx.translate(0 + movement, canvas.height - scale(GROUND_HEIGHT) * 1.25);

  for(let i = 0; i < Math.ceil(canvas.width / spriteWidth) + 1; i++) {
    drawSprite(ctx, sprite, 0, 0, spriteWidth, spriteHeight)
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
    drawSprite(ctx, sprite, 0, 0, spriteWidth, spriteHeight)
    ctx.translate(spriteWidth - 1, 0)
  }

  ctx.restore();
}

// TODO refactor
function renderPipes(pipes, bird) {
  const sprite = sprites.pipe;
  const sprite2 = sprites.pipe2;

  const spriteWidth = scale(sprite.w);
  const spriteHeight = scale(sprite.h);

  const sprite2Width = scale(sprite2.w);
  const sprite2Height = scale(sprite2.h);

  pipes.forEach((pipe) => {

    const x = canvas.width - (bird.x - pipe.x);

    ctx.save();
    ctx.translate(x, canvas.height - scale(pipe.height) + scale(HOLE_HEIGHT));
    drawSprite(ctx, sprite, 0, 0, spriteWidth, spriteHeight)
    ctx.restore();

    ctx.save();
    ctx.translate(x, canvas.height - scale(pipe.height) - sprite2Height);
    drawSprite(ctx, sprite2, 0, 0, sprite2Width, sprite2Height)
    ctx.restore();
  })
}

module.exports = function render(world, bird, pipes) {
  if(world.running !== running) {
    updateRunningClass(world.running);
    running = world.running;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderBackground(world);
  renderPipes(pipes, bird);
  renderGround(bird);
  renderBird(world, bird);
}
