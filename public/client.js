var $challengePixels = [];
jQuery(function($) {

  var UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3,
    CHALLENGE_W = 6, CHALLENGE_H = 6, PIXEL_W = 10;

  var socket = io.connect('http://localhost'), players = {}, player, $players = {};
  var $ranking = $('#ranking'), $area = $('#area'), $roundTime = $('#roundTime');
    //$challengePixels = [];

  socket.on('start', function(data) {
    player = data.player;
    players = data.game.players;
    refreshArea();
    refreshRanking();
    refreshTime(data.game.roundTime);
    if (data.game.challenge.length !== null) {
      refreshChallenge(data.game.challenge);
    }
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
    refreshChallenge(data.challenge);
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
    var $pixels;
    $('#challenge').css({ width: CHALLENGE_W * PIXEL_W, height: CHALLENGE_H * PIXEL_W });
    for (var x = 0; x < CHALLENGE_W; x++) {
      $pixels = [];
      for (var y = 0; y < CHALLENGE_H; y++) {
        $pixels.push(
          $('<div class="pixel" style="display:none"></div>')
          .css({ left: x * PIXEL_W, top: y * PIXEL_W })
          .appendTo('#challenge')
        );
      }
      $challengePixels.push($pixels);
    }
    var name;
    while (!name) {
      name = prompt('Nickname: ').trim();
    }
    socket.emit('new', { name: name });
  }

  function movePlayer(id, x, y) {
    $players[id].css({ left: PIXEL_W * x, top: PIXEL_W * y });
  }

  function putPlayer(player) {
    if (!$players[player.id]) {
      $players[player.id] = $('<div class="pixel"></div>').appendTo($area);
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

  function refreshChallenge(c) {
    $('#challenge .pixel').hide();
    var i, j,
      x = Math.floor((CHALLENGE_W - c.length) / 2),
      y = Math.floor((CHALLENGE_H - c[0].length) / 2)
    ;
    for (i = 0; i < c.length; i++) {
      for (j = 0; j < c[0].length; j++) {
        if (c[i][j]) {
          $challengePixels[i + x][j + y].show();
        }
      }
    }
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

