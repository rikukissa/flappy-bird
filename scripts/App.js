import React from 'react';
import set from 'lodash.set';
import get from 'lodash.get';

var FRAME_RATE = 1000 / 60;
var SCALE = 256;

var StyleSheet = require('react-style');

const sprites = {
  background: require('file!crop!../assets/sprite.png?x=0&y=0&w=144&h=256'),
  ground: require('file!crop!../assets/sprite.png?x=146&y=0&w=154&h=56'),
  score: require('file!crop!../assets/sprite.png?x=146&y=58&w=113&h=58'),
  bird: require('file!crop!../assets/sprite.png?x=223&y=124&w=17&h=12'),
  pipe: require('file!crop!../assets/sprite.png?x=330&y=0&w=26&h=121'),
}
const update = (obj, key, fn) => set(obj, key, fn(get(obj, key)));
const scaleX = (n) => n * 2;
const scaleY = (n) => n * 2;
const translateX = (n) => window.innerWidth * n;
const translateY = (n) => window.innerHeight * n;

var styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
    backgroundImage: `url(${sprites.background})`,
    backgroundSize: 'auto 100%',
    backgroundRepeat: 'repeat-x'
  },
  bird: {
    backgroundImage: `url(${sprites.bird})`,
    backgroundSize: '100% 100%',
    position: 'absolute',
    left: '50%'
  }
});

function updateWorld(world) {
  world.mapX++;

  world.bird.y += world.bird.vy;
  world.bird.vy += 0.3;

  if(world.pipes.length === 0) {
    world.pipes.push({
      bottom: true,
      x: world.mapX
    });
  }

  return world;
}

export default class Bird extends React.Component {
  render() {
    var style = {
      width: scaleX(17),
      height: scaleY(12),
      top: this.props.y
    }

    return (
      <div styles={[styles.bird, style]}></div>
    );
  }
}

export default class Background extends React.Component {
  render() {
    return (
      <div styles={[styles.background, {backgroundPosition: `-${this.props.offset}px`}]}></div>
    );
  }
}

export default class App extends React.Component {
  constructor() {
    this.state = {
      gameRunning: false,
      world: {
        mapX: 0,
        bird: {
          y: translateY(0.5),
          vy: 0
        },
        pipes: []
      }
    };
  }
  render() {
    return (
      <div onClick={() => this.handleClick()}>
        <Background offset={this.state.world.mapX}/>
        <Bird y={this.state.world.bird.y} />
      </div>
    );
  }
  handleClick() {

    if(!this.state.gameRunning) {
      return this.setState({
        gameRunning: true
      });
    }

    this.setState(update(this.state, 'world.bird.vy', (vy) => -7))


  }
  tick() {
    const tickStart = Date.now();

    if(this.state.gameRunning) {
      this.setState(update(this.state, 'world', updateWorld))
    }

    if(this.shouldTick) {
      window.requestAnimationFrame(() => {
        var syncTime = Math.max(0, FRAME_RATE - (Date.now() - tickStart));
        setTimeout(() => this.tick(), syncTime);
      })
    }
  }
  componentDidMount() {
    this.shouldTick = true;
    this.tick();
  }
  componentWillUnmount() {
    this.shouldTick = false;
  }
}
