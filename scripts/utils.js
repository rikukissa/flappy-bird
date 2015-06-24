import zipObject from 'lodash.zipobject';

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function toObject(...keys) {
  return function(...values) {
    return zipObject(keys, values);
  }
}
