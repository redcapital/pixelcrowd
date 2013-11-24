jQuery(function($) {

  var UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
  var socket = io.connect('http://localhost'), players = {}, player, $players = {};
  var $ranking = $('#ranking'), $area = $('#area'), $roundTime = $('#roundTime');

  socket.on('start', function(data) {
    player = data.player;
    players = data.game.players;
    refreshArea();
    refreshRanking();
    refreshTime(data.roundTime);
  });

  socket.on('new', function(data) {
    players[data.id] = data;
    refreshArea();
    refreshRanking();
  });

  socket.on('removed', function(data) {
    if (players[data.id]) delete players[data.id];
    refreshArea();
    refreshRanking();
  });

  socket.on('move', function(data) {
    if ($players[data.id]) {
      movePlayer(data.id, data.x, data.y);
    }
  });

  socket.on('round-start', function(data) {
    if (!player) return;
    refreshTime(data.roundTime);
  });

  socket.on('round-finish', function(data) {
    if (!player) return;
    refreshTime('0');
  });

  socket.on('tick', function(data) {
    if (!player) return;
    refreshTime(data.roundTime);
  });

  function startGame() {
    var name;
    while (!name) {
      name = prompt('Nickname: ').trim();
    }
    socket.emit('new', { name: name });
  }

  function movePlayer(id, x, y) {
    $players[id].css({ left: 10 * x, top: 10 * y });
  }

  function putPlayer(player) {
    if (!$players[player.id]) {
      $players[player.id] = $('<div class="player"></div>').appendTo($area);
    }
    movePlayer(player.id, player.x, player.y);
  }

  function refreshArea() {
    $area.empty();
    $players = {};
    for (var id in players) {
      putPlayer(players[id]);
    }
  }

  function refreshRanking() {
    $ranking.empty();
    for (var id in players) {
      $ranking.append($('<li>').text(players[id].name));
    }
  }

  function refreshTime(time) {
    $roundTime.text(time);
  }

  $(document).on('keydown', function(e) {
    if (!player) return;
    var directions = {
      37: LEFT,
      38: UP,
      39: RIGHT,
      40: DOWN
    };
    if (directions.hasOwnProperty(e.which)) {
      socket.emit('move', { id: player.id, direction: directions[e.which] });
      e.preventDefault();
    }
  });

  startGame();
});

