var assert = require('nodeunit').assert;
var gameModule = require('../game');

assert._containsPixel = function(pixel, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i][0] === pixel[0] && arr[i][1] === pixel[1]) {
      return true;
    }
  }
  return false;
};

assert.includesPixel = function(pixel, arr, message) {
  if (!assert._containsPixel(pixel, arr))
    assert.fail(pixel.toString(), arr, message, 'inside');
};

assert.notIncludesPixel = function(pixel, arr, message) {
  if (assert._containsPixel(pixel, arr))
    assert.fail(pixel.toString(), arr, message, 'not inside');
};

//
// 000000
// 000000
// 001001
// 001110
// 001010
exports.matchSimple = function(test) {
  var game = new gameModule.Game();
  game.challenge = [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 1]
  ];

  game.createPlayer('p1', 2, 2);
  game.createPlayer('p2', 2, 3);
  game.createPlayer('p3', 2, 4);

  game.createPlayer('p4', 3, 3);

  game.createPlayer('p5', 4, 3);
  game.createPlayer('p6', 4, 4);

  game.createPlayer('loser', 5, 2);

  var m = game.findMatches();
  test.includesPixel([2, 2], m);
  test.includesPixel([2, 3], m);
  test.includesPixel([3, 3], m);
  test.includesPixel([4, 3], m);
  test.includesPixel([4, 4], m);

  test.notIncludesPixel([4, 2], m);
  test.notIncludesPixel([5, 2], m);

  test.done();
};

// 1 1 1
// 1 1 1
exports.matchOverlapping = function(test) {
  var game = new gameModule.Game();
  game.challenge = [
    [1, 1], [1, 1],
  ];

  game.createPlayer('p1', 0, 0);
  game.createPlayer('p2', 0, 1);
  game.createPlayer('p3', 1, 0);
  game.createPlayer('p4', 1, 1);
  game.createPlayer('p5', 2, 0);
  game.createPlayer('p6', 2, 1);

  var m = game.findMatches();
  test.includesPixel([0, 0], m);
  test.includesPixel([1, 1], m);

  test.notIncludesPixel([2, 0], m);
  test.notIncludesPixel([2, 1], m);

  test.done();
};

// 0 1 1
// 1 0 0
// 0 1 1
exports.matchAdjacent = function(test) {
  var game = new gameModule.Game();
  game.challenge = [
    [1, 0, 1]
  ];

  game.createPlayer('p1', 0, 1);
  game.createPlayer('p2', 1, 0);
  game.createPlayer('p3', 1, 2);
  game.createPlayer('p4', 2, 0);
  game.createPlayer('p5', 2, 2);

  var m = game.findMatches();
  test.includesPixel([1, 0], m);
  test.includesPixel([2, 0], m);
  test.includesPixel([2, 2], m);

  test.notIncludesPixel([0, 1], m);

  test.done();
};

exports.calculateScores = function(test) {
  var game = new gameModule.Game(),
    p1 = game.createPlayer('p1', 1, 3),
    p2 = game.createPlayer('p2', 1, 4),
    loser = game.createPlayer('loser', 5, 5)
  ;
  p2.score = 15;
  game.calculateScores([
    [1, 3], [1, 4]
  ]);

  test.equal(p1.score, game.bonus);
  test.equal(p2.score, 15 + game.bonus);
  test.equal(loser.score, -game.bonus);

  test.done();
};
