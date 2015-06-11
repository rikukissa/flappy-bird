import Bacon from 'bacon.animationframe';

// http://stackoverflow.com/a/24774276
Bacon.EventStream.prototype.bufferUntilValue = function(valve) {
  var valve_ = valve.startWith(false);

  return this.filter(false).merge(valve_.flatMapConcat((function(_this) {
    return function() {
        return _this.scan([], (function(xs, x) {
            return xs.concat(x);
        }), {
            eager: true
        }).sampledBy(valve).take(1);
    };
  })(this)));
};
