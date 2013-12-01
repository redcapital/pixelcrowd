jQuery(function($) {

  var UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3,
    CHALLENGE_W = 6, CHALLENGE_H = 6, PIXEL_W = 15;

  var socket, players = {}, me, pixels = {}, challengePixels = [];

  /**
   * Socket event handlers
   */

  function initSocket() {
    socket = io.connect(window.location.hostname);

    socket.on('start', function(data) {
      me = data.player;
      players = data.game.players;
      refreshArea();
      refreshStats();
      refreshTime(data.game.roundTime);
      refreshChallenge(data.game.challenge);
      $('#myScore').text(me.score);
    });

    socket.on('new', function(player) {
      players[player.id] = player;
      movePlayerPixel(player);
      refreshStats();
    });

    socket.on('removed', function(data) {
      removePlayer(data.id);
      refreshStats();
    });

    socket.on('move', function(player) {
      movePlayerPixel(player);
    });

    socket.on('signal', function(data) {
      showSignal(data.id);
    });

    socket.on('round-start', function(data) {
      refreshChallenge(data.challenge);
      refreshTime(data.roundTime);
    });

    socket.on('round-finish', function(scores) {
      refreshTime('0');
      for (var playerId in scores) {
        if (players[playerId]) {
          if (pixels[playerId]) {
            var cssClass = (scores[playerId] > players[playerId].score) ? 'success' : 'failure';
            pixels[playerId].addClass(cssClass);
          }
          players[playerId].score = scores[playerId];
        } else {
          removePlayer(playerId);
        }
      }
      if (me && players[me.id]) {
        $('#myScore').text(players[me.id].score);
      }
      refreshStats();
      setTimeout(function() {
        for (var playerId in pixels) {
          pixels[playerId].attr('class', 'pixel');
        }
      }, 1000);
    });

    socket.on('tick', function(data) {
      refreshTime(data.roundTime);
    });
  }


  /**
   * Game logic
   */

  function startGame() {
    $('#challenge').css({ width: CHALLENGE_W * PIXEL_W, height: CHALLENGE_H * PIXEL_W });
    for (var i = 0; i < CHALLENGE_W; i++) {
      challengePixels.push([]);
      for (var j = 0; j < CHALLENGE_H; j++) {
        challengePixels[i].push(
          $('<div class="pixel" style="display:none"></div>')
          .css({ left: i * PIXEL_W, top: j * PIXEL_W })
          .appendTo('#challenge')
        );
      }
    }
    var name;
    while (true) {
      name = prompt('Nickname: ');
      if (name === null) break;
      name = name.trim();
      if (name.length) break;
    }
    if (name !== null) {
      initSocket();
      $('#myName').text(name);
      socket.emit('new', { name: name });
    }
  }

  function removePlayer(playerId) {
    if (players[playerId]) delete players[playerId];
    if (pixels[playerId]) {
      pixels[playerId].remove();
      delete pixels[playerId];
    }
  }

  function movePlayerPixel(player) {
    if (!pixels[player.id]) {
      pixels[player.id] = $('<div class="pixel"></div>').appendTo('#area');
    }
    pixels[player.id].css({ left: PIXEL_W * player.x, top: PIXEL_W * player.y });
  }

  function refreshArea() {
    pixels = {};
    $('#area').empty();
    for (var id in players) movePlayerPixel(players[id]);
  }

  function refreshStats() {
    var $stats = $('#stats').empty();
    var rows = [];
    for (var id in players) {
      rows.push(players[id]);
    }
    rows.sort(function(a, b) {
      if (a.score > b.score) return -1;
      if (a.score < b.score) return 1;
      return (a.id < b.id) ? -1 : 1;
    });
    for (var i = 0; i < rows.length; i++) {
      var $tr = $('<tr></tr>');
      if (me && (rows[i].id == me.id)) {
        $tr.addClass('me');
        $('#myPlace').text(i + 1);
      }
      $tr.append('<td>' + (i + 1) + '</td>')
        .append($('<td></td>').text(rows[i].name))
        .append('<td>' + rows[i].score + '</td>');
      $stats.append($tr);
    }
  }

  function refreshTime(time) {
    $('#roundTime').text(time);
  }

  function refreshChallenge(c) {
    $('#challenge .pixel').hide();
    var w = c & 7;
    c >>= 3;
    var h = c & 7;
    c >>= 3;
    var i, j, sx = -1, sy = 1000, aw, ah = -1, data = [], bit = 1 << (w * h - 1);
    for (i = 0; i < w; i++) {
      data.push([]);
      for (j = 0; j < h; j++) {
        data[i].push(!!(c & bit));
        if (data[i][j]) {
          if (sx < 0) sx = i;
          sy = Math.min(sy, j);
          aw = i - sx + 1;
          ah = Math.max(ah, j - sy + 1);
        }
        bit >>= 1;
      }
    }
    var tx = Math.floor((CHALLENGE_W - aw) / 2),
      ty = Math.floor((CHALLENGE_H - ah) / 2);

    for (i = 0; i < aw; i++) {
      for (j = 0; j < ah; j++) {
        if (data[sx + i][sy + j]) challengePixels[tx + i][ty + j].show();
      }
    }
  }

  function showSignal(playerId) {
    if (!pixels[playerId]) return;
    var times = 4, interval;
    interval = setInterval(function() {
      if (times % 2) {
        pixels[playerId].removeClass('signal');
      } else {
        pixels[playerId].addClass('signal');
      }
      if (--times === 0) clearInterval(interval);
    }, 100);
  }

  $(document).on('keydown', function(e) {
    if (!me) return;
    var directions = {
      37: LEFT,
      38: UP,
      39: RIGHT,
      40: DOWN
    };
    if (directions.hasOwnProperty(e.which)) {
      socket.emit('move', { direction: directions[e.which] });
      e.preventDefault();
    } else if (e.which == 32) {
      socket.emit('signal');
      e.preventDefault();
    }
  });

  startGame();

  $('.hasTooltip').tooltip();
});

