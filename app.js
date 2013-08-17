/**
 * Module dependencies.
 */

var express       = require('express')
  , routes        = require('./routes')
  , path          = require('path')
  , http          = require('http')
  , _             = require('underscore')
  , jade_browser  = require('jade-browser')
  , redis         = require('redis')
  , async         = require('async')
  , client        = redis.createClient()
  ;

/* Create the server */
var app = express()
  , server = http.createServer(app)
  ;

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Wire up our client side templates.
// This will basically package all of our templates up in a single .js file.
// On the client, we can then render those templates whenever we need.
app.use(jade_browser('/js/templates.js', '**', {root: __dirname + '/public/js/templates', minify: true}));

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Socket.io
var io = require('socket.io').listen(server);

/**
 * our socket transport events
 *
 * You will notice that when we emit the changes
 * in `create`, `update`, and `delete` we both
 * socket.emit and socket.broadcast.emit
 *
 * socket.emit sends the changes to the browser session
 * that made the request. not required in some scenarios
 * where you are only using ioSync for Socket.io
 *
 * socket.broadcast.emit sends the changes to
 * all other browser sessions. this keeps all
 * of the pages in mirror. our client-side model
 * and collection ioBinds will pick up these events
 */

var TILE_SIZE = 32;

io.sockets.on('connection', function (socket) {

  socket.on('tiles:create', function (data, callback) {
    // find a tile that is not taken,
    // mark it as taken,
    // return it back to the client.

    var multi = redis_client.multi();
    multi.get('NEXT_FREE_TILE_X');
    multi.get('NEXT_FREE_TILE_Y');
    multi.exec(function(err, values) {
      if(err)
        return console.error(err);

      var x = values[0];
      var y = values[1];

      var tile_data = [];
      for(var i = 0; i < TILE_SIZE * TILE_SIZE * 4; i++)
        tile_data.push(255);

      redis_client.hset('TILE_DATA', x + '_' + y, tile_data, function(err) {
        if(err)
          console.error(err);
      })

      chooseNextFreeTile(x,y);

      // echo the response
      callback(null, {x: x, y: y})
      socket.broadcast.emit('tiles:create', {x: x, y: y});
      socket.emit('tiles:create', {x: x, y: y});
    })

  });

  socket.on('tiles:read', function (data, callback) {
    /* do something to 'read' the whatever */
    if(data && data.tile) {
      redis_client.hget('TILE_DATA', data.id, function(err, result) {
        callback(null, {
          id: data.id
        , tileData: result
        });
      })
    }
    else {
      redis_client.hgetall('TILE_DATA', function(err, fieldvalues) {
        var tiles = [];
        for(var i = 0; i < fieldvalues.length; i+=2) {
          var t = {}
          t.id = fieldValues[i];
          t.tileData = fieldValues[i+1];
          tiles.push(t);
        }
        callback(null, tiles);
      })
    }
  });

  socket.on('tiles:update', function (data, callback) {
    redis_client.hget('TILE_DATA', data.id, function(err, result) {

      if(!result)
        return console.error('NO SUCH TILE, ', data.id)
      // need to update the tile pixel.
      var xy = data.id.split('_');
      var x = xy[0];
      var y = xy[1];
      result[y * TILE_SIZE + x]       = data.pixel[0];
      result[y * TILE_SIZE + x + 1]   = data.pixel[1];
      result[y * TILE_SIZE + x + 2]   = data.pixel[2];
      result[y * TILE_SIZE + x + 3]   = data.pixel[3];

      redis_client.hset('TILE_DATA', data.id, result, function(err) {
        if(err)
          return console.error('failed to set tile ', data.id)

        socket.broadcast.emit('tiles/' + data.id + ':update', {id: data.id, tileData: result});
        callback(null, {id: data.id});
      })
    })
  });
});


function chooseNextTile(x, y) {
  // try to keep to the center.
  if(x > 25)
    dirX = [-1, 0, 1];
  else
    dirX = [1, 0, -1];

  if(y > 25)
    dirY = [-1, 0, 1];
  else
    dirY = [1, 0, -1];

  var multi = redis_client.multi();

  for (var i = dirX.length - 1; i >= 0; i--) {
    for (var j = dirY.length - 1; j >= 0; j--) {
      multi.hexists('TILE_DATA', (x + dirX[i]) + '_' + (y + dirY[j]));
    };
  };

  multi.exec(function(err, results) {
    if(err)
      return console.error(err);
    var n = 0;
    for (var i = dirX.length - 1; i >= 0; i--) {
      for (var j = dirY.length - 1; j >= 0; j--) {
        n++;
        if(!results[n]) {

          var multi2 = redis_client.multi();
          multi2.set('NEXT_FREE_TILE_X', x + dirX[i])
          multi2.set('NEXT_FREE_TILE_Y', y + dirY[j])
          multi.exec(function(){})
        }
      };
    };
  })
  
}

// Routes
app.get('/', routes.index);

redis_client.get('NEXT_FREE_TILE_X', function(err, value) {
  if(!value) {
    var multi = redis_client.multi();
    multi.set('NEXT_FREE_TILE_X', '25')
    multi.set('NEXT_FREE_TILE_Y', '25')
  }
})

if (!module.parent) {
  server.listen(3000);
  console.log("Q - Collaborative Pixel Art", app.settings.env);
}
