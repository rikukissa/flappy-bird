const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

document.getElementById('game').appendChild(canvas);

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resize);
resize();


module.exports = {canvas,ctx};
