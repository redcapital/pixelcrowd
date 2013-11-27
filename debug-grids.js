var gameModule = require('./game');

var randomizer = function() {
  return (Math.random() <= 0.5) ? 1 : 0;
};

function rangeRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var w = rangeRandom(2, 5);
var h = rangeRandom(2, 5);
var horizontal = (randomizer() === 1);

var c = new gameModule.Challenge(w, h, horizontal);

var val = c.createHalf(randomizer).reflect().value();

// skip w and h
val >>= 6;
console.log(val);

var bit = 1 << (w * h - 1);
var cols = [];
for (var i = 0; i < w; i++) {
  var s = '';
  for (var j = 0; j < h; j++) {
    s += (val & bit) ? '*' : ' ';
    bit >>= 1;
  }
  cols.push(s);
}
console.log(cols);

for (var i = 0; i < h; i++) {
  for (var j = 0; j < w; j++) {
    process.stdout.write(cols[j].charAt(i));
  }
  process.stdout.write("\n");
}

console.log('w:', w, 'h:', h, 'axis:', (horizontal ? '-' : '|'));
