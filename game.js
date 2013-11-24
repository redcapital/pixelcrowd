var X = 800 / 10, Y = 600 / 10, UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;

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

var Game = function() {
  this.playerCount = 0;
  this.idCount = 1;
  this.used = [];
  for (var i = 0; i < X; i++) {
    this.used.push(new Array(Y));
  }
  this.players = {};
};

Game.prototype.createPlayer = function(name) {
  var x, y;
  do {
    x = Math.floor(Math.random() * X);
    y = Math.floor(Math.random() * Y);
  } while (this.used[x][y]);
  var player = new Player(this.idCount++, name, x, y);
  this.used[x][y] = true;
  this.players[player.id] = player;
  this.playerCount++;
  return player;
};

Game.prototype.publish = function() {
  var result = { players: {}, roundTime: this.roundTime };
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

Game.prototype.move = function(playerId, direction) {
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
      this.used[x][y] = true;
      player.x = x;
      player.y = y;
      return [x, y];
    }
  }
  return false;
};

Game.prototype._runRound = function(callback) {
  var game = this, interval;
  this.roundTime = 5;
  this.onRoundStart();
  interval = setInterval(function() {
    game.roundTime--;
    if (game.roundTime == 0) {
      game.onRoundFinish();
      clearInterval(interval);
      callback();
    } else {
      game.onTick();
    }
  }, 1000);
};

Game.prototype.run = function() {
  var game = this, rerun = function() {
    setTimeout(function() {
      game._runRound(rerun);
    }, 1000);
  };
  this._runRound(rerun);
};

exports.Game = Game;
