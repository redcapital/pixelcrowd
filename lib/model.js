Players = new Meteor.Collection('players');

Players.allow({
  insert: function() {
    return false;
  }
});

Meteor.methods({
  createPlayer: function(options) {
    check(options, {
      name: String
    });
    return Players.insert({
      name: options.name,
      idle: false,
      last_keepalive: (new Date()).getTime(),
      x: 0,
      y: 0
    });
  }
});

if (Meteor.isServer) {
  Meteor.publish('players', function() {
    return Players.find({ idle: false });
  });
}
