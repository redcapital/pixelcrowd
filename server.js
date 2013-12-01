var nodeStatic = require('node-static');
var gameModule = require('./game.js');
var file = new nodeStatic.Server('./public');
var socketIo = require('socket.io');

var game = new gameModule.Game();

var server = require('http').createServer(function(request, response) {
  request.addListener('end', function() {
    file.serve(request, response);
  }).resume();
});

var io = socketIo.listen(server, {
  transports: ['websocket']
}), playerIds = {};

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
    if (!playerIds[socket.id]) return;
    var place = game.move(playerIds[socket.id], data.direction);
    if (place !== false) {
      io.sockets.emit('move', { id: playerIds[socket.id], x: place[0], y: place[1] });
    }
  });

  socket.on('signal', function() {
    if (!playerIds[socket.id]) return;
    io.sockets.emit('signal', { id: playerIds[socket.id] });
  });

  socket.on('disconnect', function() {
    if (!playerIds[socket.id]) return;
    game.removePlayer(playerIds[socket.id]);
    socket.broadcast.emit('removed', { id: playerIds[socket.id] });
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
server.listen(3333);
