Multiplayer game where you control one pixel and build figures of varying
complexity together with another players.

The stack consists of Node.js, socket.io (both on server and client) and
node-static to serve static assets. Deployed to Heroku.

I coded it in a few days, the code is crappy, but there are some tests :)

```
$ npm install
$ ./node_modules/.bin/nodeunit test/
```

The game was a huge success among my coworkers:

[!Screenshot](https://raw.github.com/galymzhan/pixelcrowd/master/pixelcrowd/game.png "Screenshot")
