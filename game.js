var X = 750 / 15, Y = 600 / 15, UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;

function doNothing() {}

function randomizer() {
  return (Math.random() < 0.5) ? 1 : 0;
}

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
  var i = this.numVectors * this.vectorSize, count = 0,
    odd = this.horizontal ? (this.h % 2) : (this.w % 2);

  while (i--) {
    var on = randomizer();
    if (on) {
      if (!i && odd) count += 1; else count += 2;
    }
    this.data.push(on);
  }
  while (count < 2) {
    i = rangeRandom(0, this.data.length - 1);
    if (!this.data[i]) {
      this.data[i] = 1;
      count += 1;
    }
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

Challenge.prototype.toArray = function() {
  var i, result = [];
  if (this.horizontal) {
    for (i = 0; i < this.w; i++) {
      result.push([]);
      for (var j = i, k = this.h; k; j += this.w, k--) {
        result[i].push(this.data[j]);
      }
    }
  } else {
    i = -1;
    this.data.forEach(function(pixel, index) {
      if (index % this.h === 0) {
        result.push([]);
        i++;
      }
      result[i].push(pixel);
    }, this);
  }
  return result;
};

Challenge.prototype.value = function() {
  if (this._value) return this._value;

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

  /* jshint boss:true */
  return this._value = this.w | (this.h << 3) | (grid << 6);
};

var Game = function() {
  this.failurePenalty = 3;
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
  var result = { players: {}, roundTime: this.roundTime, challenge: this.challenge.value() };
  for (var id in this.players) {
    result.players[id] = this.players[id].publish();
  }
  return result;
};

Game.prototype.publishScores = function() {
  var result = {};
  for (var id in this.players) {
    result[id] = this.players[id].score;
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

Game.prototype.setRoundParameters = function() {
  var w = rangeRandom(2, 5);
  var h = rangeRandom(2, 5);
  this.challenge = new Challenge(w, h, (Math.random() < 0.5)).createHalf(randomizer).reflect();

  var occupied = this.challenge.data.reduce(function(a, e) {
    return a + e;
  });
  this.roundTime = Math.max(4, Math.round(occupied * 1.5));
  this.bonus = Math.max(3, occupied);
};

Game.prototype._runRound = function(callback) {
  var game = this, interval;
  this.setRoundParameters();
  this.onRoundStart();
  this.roundActive = true;
  interval = setInterval(function() {
    game.roundTime--;
    if (game.roundTime === 0) {
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
    game.calculateScores(game.findMatches(game.challenge.toArray()));
    game.onRoundFinish();
    setTimeout(function() {
      game._runRound(rerun);
    }, 1500);
  };
  this._runRound(rerun);
};

Game.prototype.findMatches = function(challenge) {
  var cw = challenge.length, ch = challenge[0].length,
    occupiedCount = 0,
    lastX = X - cw + 1, lastY = Y - ch + 1,
    result = [], used = [], i, j, k, m;
  for (i = 0; i < X; i++) {
    used.push(this.used[i].slice(0));
  }
  for (i = 0; i < cw; i++) for (j = 0; j < ch; j++) if (challenge[i][j]) occupiedCount++;

  for (i = 0; i < lastX; i++) {
    for (j = 0; j < lastY; j++) {
      var localMatched = [], ok = true;
      for (k = 0; k < cw && ok; k++) {
        for (m = 0; m < ch && ok; m++) {
          if (challenge[k][m]) {
            if (used[i + k][j + m]) {
              localMatched.push([i + k, j + m]);
            } else {
              ok = false;
              break;
            }
          }
        }
      }

      if (localMatched.length === occupiedCount) {
        for (k = 0; k < occupiedCount; k++) {
          result.push(localMatched[k]);
          used[localMatched[k][0]][localMatched[k][1]] = false;
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
    else this.players[id].score = Math.max(0, this.players[id].score - this.failurePenalty);
  }
};

exports.Game = Game;
exports.Challenge = Challenge;
