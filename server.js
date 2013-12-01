var nodeStatic = require('node-static');
var gameModule = require('./game.js');
var file = new nodeStatic.Server('./public');
var socketIo = require('socket.io');

var game = new gameModule.Game();
var env = process.env.NODE_ENV || 'development';

var server = require('http').createServer(function(request, response) {
  request.addListener('end', function() {
    file.serve(request, response);
  }).resume();
});

var io = socketIo.listen(server, {
  transports: ['websocket']
}), playerIds = {};

if (env != 'development') {
  io.set('log level', 1);
}

io.on('connection', function(socket) {
  socket.on('new', function(data) {
    if (playerIds[socket.id]) game.removePlayer(playerIds[socket.id]);
    player = game.createPlayer(data.name);
    playerIds[socket.id] = player.id;
    socket.emit('start', {
      player: player.publish(),
      game: game.publish()
    });
    socket.broadcast.emit('new', player.publish());
  });

  socket.on('move', function(data) {
    var playerId = playerIds[socket.id];
    if (!playerId) return;
    var place = game.move(playerId, data.direction);
    if (place !== false) {
      io.sockets.emit('move', { id: playerId, x: place[0], y: place[1] });
    }
  });

  socket.on('signal', function() {
    var playerId = playerIds[socket.id];
    if (!playerId) return;
    io.sockets.emit('signal', { id: playerId });
  });

  socket.on('disconnect', function() {
    var playerId = playerIds[socket.id];
    if (!playerId) return;
    game.removePlayer(playerId);
    socket.broadcast.emit('removed', { id: playerId });
    delete playerIds[socket.id];
  });
});

game.onRoundStart = function() {
  io.sockets.emit('round-start', { roundTime: game.roundTime, challenge: game.challenge.value() });
};

game.onRoundFinish = function() {
  io.sockets.emit('round-finish', game.publishScores());
};

game.onTick = function() {
  io.sockets.emit('tick', { roundTime: game.roundTime });
};

game.run();

var port = process.env.PORT || 3333;
server.listen(port);
