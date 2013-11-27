var X = 800 / 10, Y = 600 / 10, UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;

function doNothing() {}

function rangeRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Player = function(id, name, x, y) {
  this.id = id;
  this.name = name;
  this.x = x;
  this.y = y;
  this.score = 0;
};

Player.prototype.publish = function() {
  return {
    id: this.id, name: this.name, x: this.x, y: this.y,
    score: this.score
  };
};

var Challenge = function(w, h, horizontal) {
  this.w = w;
  this.h = h;
  this.horizontal = horizontal;
  if (this.horizontal) {
    this.vectorSize = w;
    this.numVectors = Math.floor(h / 2) + (h % 2);
  } else {
    this.vectorSize = h;
    this.numVectors = Math.floor(w / 2) + (w % 2);
  }
};

Challenge.prototype.createHalf = function(randomizer) {
  this.data = [];
  var i = this.numVectors, prevEmpty = true, on;
  while (i--) {
    for (var j = 0, vector = [], empty = true; j < this.vectorSize; j++) {
      on = randomizer();
      if (!on && !prevEmpty && !this.data[this.data.length - this.vectorSize + j]) {
        on = 1;
      }
      if (on) empty = false;
      vector.push(on);
    }
    if (!prevEmpty && empty) {
      vector[rangeRandom(0, this.vectorSize - 1)] = 1;
      empty = false;
    }

    // Handle some special cases for last vector
    if (!i) {
      var minPixel = -1, maxPixel = -1;
      for (j = 0; j < vector.length; j++) {
        if (vector[j]) {
          if (minPixel < 0) minPixel = j;
          maxPixel = j;
        }
      }

      // Set one random pixel to On if everything is empty
      if (minPixel < 0 && maxPixel < 0) {
        vector[rangeRandom(0, this.vectorSize - 1)] = 1;
      }

      // In a narrow grids make sure last vector pixels are contiguous
      if (this.numVectors === 1) {
        var mid = Math.floor(this.vectorSize / 2) - 1;
        if (!minPixel) {
          minPixel = rangeRandom(0, mid);
          vector[minPixel] = 1;
        }
        if (!maxPixel) {
          maxPixel = rangeRandom(mid + 1, this.vectorSize - 1);
          vector[maxPixel] = 1;
        }

        // Fill in everything in between
        for (j = minPixel + 1; j < maxPixel; j++) vector[j] = 1;
      }
    }
    this.data = this.data.concat(vector);
    prevEmpty = empty;
  }

  return this;
};

Challenge.prototype.reflect = function() {
  var param = this.horizontal ? 'h' : 'w', c = Math.floor(this[param] / 2);
  while (c--) {
    for (var i = c * this.vectorSize, k = this.vectorSize; k; k--, i++) {
      this.data.push(this.data[i]);
    }
  }
  return this;
};

Challenge.prototype.value = function() {
  var grid = 0, bit = 1 << (this.w * this.h - 1);
  if (this.horizontal) {
    for (var i = 0; i < this.w; i++) {
      for (var j = i, k = this.h; k; j += this.w, k--) {
        if (this.data[j]) grid |= bit;
        bit >>= 1;
      }
    }
  } else {
    this.data.forEach(function(pixel) {
      if (pixel) grid |= bit;
      bit >>= 1;
    });
  }

  return this.w | (this.h << 3) | (grid << 6);
};

var Game = function() {
  this.bonus = 5;
  this.playerCount = 0;
  this.idCount = 1;
  this.used = [];
  for (var i = 0; i < X; i++) {
    this.used.push(new Array(Y));
  }
  this.players = {};
  this.roundActive = false;
  this.onRoundStart = doNothing;
  this.onRoundFinish = doNothing;
  this.onTick = doNothing;
  this.challenge = null;
};

Game.prototype.createPlayer = function(name, defaultX, defaultY) {
  var x, y;
  if (typeof defaultX === 'undefined') {
    do {
      x = Math.floor(Math.random() * X);
      y = Math.floor(Math.random() * Y);
    } while (this.used[x][y]);
  } else {
    x = defaultX;
    y = defaultY;
  }
  var player = new Player(this.idCount++, name, x, y);
  this.used[x][y] = player.id;
  this.players[player.id] = player;
  this.playerCount++;
  return player;
};

Game.prototype.publish = function() {
  var result = { players: {}, roundTime: this.roundTime, challenge: this.challenge };
  for (var id in this.players) {
    result.players[id] = this.players[id].publish();
  }
  return result;
};

Game.prototype.removePlayer = function(playerId) {
  if (this.players[playerId]) {
    var player = this.players[playerId];
    this.used[player.x][player.y] = false;
    this.playerCount = this.playerCount ? this.playerCount - 1 : 0;
    delete this.players[playerId];
  }
};

Game.prototype.generateChallenge = function() {
  return [
    [0, 1, 1],
    [1, 1, 1],
    [1, 0, 0],
    [0, 0, 1]
  ];
};

Game.prototype.move = function(playerId, direction) {
  if (!this.roundActive) return false;
  if (this.players[playerId]) {
    var player = this.players[playerId], x = player.x, y = player.y;
    switch (direction) {
      case UP:
        y = y - 1;
        break;
      case RIGHT:
        x = x + 1;
        break;
      case DOWN:
        y = y + 1;
        break;
      case LEFT:
        x = x - 1;
        break;
    }
    if (x >= 0 && x < X && y >= 0 && y < Y && !this.used[x][y]) {
      this.used[player.x][player.y] = false;
      this.used[x][y] = player.id;
      player.x = x;
      player.y = y;
      return [x, y];
    }
  }
  return false;
};

Game.prototype._runRound = function(callback) {
  var game = this, interval;
  this.roundActive = true;
  this.roundTime = 5;
  this.challenge = this.generateChallenge();
  this.onRoundStart(this.challenge);
  interval = setInterval(function() {
    game.roundTime--;
    if (game.roundTime < 0) {
      clearInterval(interval);
      callback();
    } else {
      game.onTick();
    }
  }, 1000);
};

Game.prototype.run = function() {
  var game = this, rerun = function() {
    game.roundActive = false;
    game.calculateRatings();
    game.onRoundFinish();
    setTimeout(function() {
      game._runRound(rerun);
    }, 1000);
  };
  this._runRound(rerun);
};

Game.prototype.findMatches = function() {
  var cw = this.challenge.length, ch = this.challenge[0].length,
    lastX = X - cw + 1, lastY = Y - ch + 1,
    result = [], matched = [], i, j, k, m;
  for (i = 0; i < X; i++) {
    matched.push(new Array(Y));
  }
  //xxxxx
  //xxxxx
  //xxxxx

  //ccc
  //ccc
  for (i = 0; i < lastX; i++) {
    for (j = 0; j < lastY; j++) {
      var ok = true;
      for (k = 0; k < cw && ok; k++) {
        for (m = 0; m < ch && ok; m++) {
          if (
            matched[i + k][j + m] ||
            (!!this.used[i + k][j + m] !== !!this.challenge[k][m])
          ) {
            ok = false;
            break;
          }
        }
      }
      if (ok) {
        for (k = 0; k < cw; k++) {
          for (m = 0; m < ch; m++) {
            if (this.used[i + k][j + m]) result.push([i + k, j + m]);
            matched[i + k][j + m] = true;
          }
        }
      }
    }
  }
  return result;
};

Game.prototype.calculateScores = function(match) {
  // Maps pixels to players
  var winners = {};
  for (var i = 0; i < match.length; i++) {
    winners[this.used[match[i][0]][match[i][1]]] = true;
  }
  for (var id in this.players) {
    if (winners[id]) this.players[id].score += this.bonus;
    else this.players[id].score -= this.bonus;
  }
};

exports.Game = Game;
exports.Challenge = Challenge;
