var gameModule = require('./game');

var randomizer = function() {
  return (Math.random() <= 0.5) ? 1 : 0;
};

function rangeRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render(val) {
  var w = val & 7;
  val >>= 3;
  var h = val & 7;
  val >>= 3;

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
}

function randomChallenge() {

  var w = rangeRandom(2, 5);
  var h = rangeRandom(2, 5);
  //var w = 4;
  //var h = 4;
  var horizontal = (Math.random() <= 0.5 ? 1 : 0);

  var c = new gameModule.Challenge(w, h, horizontal);

  render(c.createHalf(randomizer).reflect().value());
  console.log('w:', w, 'h:', h, 'axis:', (horizontal ? '-' : '|'));
}

render(338);
