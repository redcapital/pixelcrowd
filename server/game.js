Meteor.methods({
  keepalive: function(player_id) {
    check(player_id, String);
    Players.update(
      { _id: player_id },
      { $set: { last_keepalive: (new Date()).getTime(), idle: false } }
    );
  }
});

Meteor.setInterval(function() {
  var now = (new Date()).getTime();
  var idle_threshold = now - 60 * 1000;
  Players.remove({ last_keepalive: { $lt: idle_threshold }});
}, 10 * 1000);
