var assert = require('nodeunit').assert;
var gameModule = require('../game');

assert._compareArray = function(a1, a2) {
  if (!a1 || !a2) return false;
  if (a1.length != a2.length) return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] instanceof Array && a2[i] instanceof Array) {
      if (!assert._compareArray(a1[i], a2[i])) return false;
    } else if (a1[i] != a2[i]) return false;
  }
  return true;
};

assert.arrayEqual = function(actual, expected, message) {
  if (!assert._compareArray(actual, expected))
    assert.fail(actual, expected, message, '=');
};

function getRandomizer(data) {
  var i = 0;
  return function() {
    return data[i++];
  };
}

exports.vectors = {
  vertical: function(test) {
    var c = new gameModule.Challenge(4, 3, false);
    test.equal(2, c.numVectors);
    test.equal(3, c.vectorSize);

    c = new gameModule.Challenge(7, 4, false);
    test.equal(4, c.numVectors);
    test.equal(4, c.vectorSize);

    test.done();
  },

  horizontal: function(test) {
    var c = new gameModule.Challenge(4, 3, true);
    test.equal(2, c.numVectors);
    test.equal(4, c.vectorSize);

    c = new gameModule.Challenge(7, 6, true);
    test.equal(3, c.numVectors);
    test.equal(7, c.vectorSize);

    test.done();
  }
};

exports.createHalf = {
  vertical: {
    setUp: function(callback) {
      this.c = new gameModule.Challenge(4, 3, false);
      callback();
    },

    simple: function(test) {
      // 01xx
      // 10xx
      // 11xx
      //
      var randomizer = getRandomizer([0, 1, 1, 1, 0, 1]);
      var res = this.c.createHalf(randomizer).data;

      test.arrayEqual([0, 1, 1, 1, 0, 1], res);
      test.done();
    },

    makeConnected: function(test) {
      // 01xx     01xx
      // 00xx  => 01xx
      // 10xx     10xx
      //
      var randomizer = getRandomizer([0, 0, 1, 1, 0, 0]);
      var res = this.c.createHalf(randomizer).data;

      test.arrayEqual([0, 0, 1, 1, 1, 0], res);
      test.done();
    },
  },

  horizontal: {
    setUp: function(callback) {
      this.c = new gameModule.Challenge(4, 3, true);
      callback();
    },

    simple: function(test) {
      // 0100
      // 1011
      // xxxx

      var randomizer = getRandomizer([0, 1, 0, 0, 1, 0, 1, 1]);
      var res = this.c.createHalf(randomizer).data;

      test.arrayEqual([0, 1, 0, 0, 1, 0, 1, 1], res);
      test.done();
    },

    makeConnected: function(test) {
      // 0101
      // 0000
      // xxxx

      var randomizer = getRandomizer([0, 1, 0, 1, 0, 0, 0, 0]);
      var res = this.c.createHalf(randomizer).data;

      test.arrayEqual([0, 1, 0, 1, 1, 0, 1, 0], res);
      test.done();
    }
  },

  emptyField: function(test) {
    var randomizer = getRandomizer([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    var c = new gameModule.Challenge(3, 3, false);
    var res = c.createHalf(randomizer).data;

    var total = res.reduce(function(acc, elem) { return acc + elem; });
    test.ok(total > 1, "At least two pixels must be on");

    test.done();
  },

  lastVectorContiguous: function(test) {
    // 1010
    // xxxx
    var randomizer = getRandomizer([1, 0, 1, 0]);
    var c = new gameModule.Challenge(4, 2, true);
    var res = c.createHalf(randomizer).data;

    test.arrayEqual([1, 1, 1, 0], res);

    test.done();
  },

};

exports.reflect = {
  vertical: function(test) {
    // 101xx
    // 010xx
    // 110xx
    var col1 = [1, 0, 1], col2 = [0, 1, 1], col3 = [1, 0, 0];
    var c = new gameModule.Challenge(5, 3, false);
    c.data = col1.concat(col2).concat(col3);
    var d = c.reflect().data;
    test.arrayEqual(col1.concat(col2).concat(col3).concat(col2).concat(col1), d);

    test.done();
  },

  horizontal: function(test) {
    // 10111
    // 01000
    // xxxxx
    // xxxxx
    var row1 = [1, 0, 1, 1, 1], row2 = [0, 1, 0, 0, 0];
    var c = new gameModule.Challenge(5, 4, true);
    c.data = row1.concat(row2);
    var d = c.reflect().data;
    test.arrayEqual(row1.concat(row2).concat(row2).concat(row1), d);

    test.done();
  }
};

exports.value = {
  vertical: function(test) {
    var c = new gameModule.Challenge(4, 4, true);
    c.data =  [1, 0, 0, 1]
      .concat([0, 1, 1, 0])
      .concat([1, 0, 0, 1])
      .concat([1, 1, 1, 1])
    ;
    var expected =
      // Width
      (4) |
      // Height
      (4 << 3) |
      (parseInt("1011010101011011", 2) << 6)
    ;
    test.equal(expected, c.value());

    test.done();
  },

  horizontal: function(test) {
    var c = new gameModule.Challenge(4, 3, true);
    c.data =  [1, 0, 1, 1]
      .concat([1, 1, 0, 1])
      .concat([1, 0, 1, 1])
    ;
    var expected =
      // Width
      (4) |
      // Height
      (3 << 3) |
      // Data in column order (first column top to bottom, then second ...)
      (parseInt("111010101111", 2) << 6)
    ;
    test.equal(expected, c.value());

    test.done();
  }

};
