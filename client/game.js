Meteor.Router.add({
  '/': 'home',
  '/game': 'game'
});

Template.home.events({
  'click #start' : function () {
    var name = prompt('Your name: ');
    var player_id = createPlayer({ name: name });
    console.log('created player ', player_id);
    Session.set('player_id', player_id);

    Deps.autorun(function() {
      Meteor.subscribe('players');
    });

    Meteor.Router.to('/game');
  }
});

Template.home.greeting = function() {
  return "Welcome to pixelcrowd.";
};

Template.game.helpers({
  players: function() {
    return Players.find();
  }
});

function keyPressed(e) {
  var player_id = Session.get('player_id'), handled = false;
  if (player_id) {
    //Players.find({ _id: player_id }).update(;
    switch (e.which) {
    }
  }
  if (handled) e.preventDefault();
}

Meteor.startup(function() {
  Meteor.setInterval(function() {
    if (Meteor.status().connected) {
      Meteor.call('keepalive', Session.get('player_id'));
    }
  }, 10 * 1000);

  $(document).keydown(keyPressed);
});
