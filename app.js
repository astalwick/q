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
  , redis_client  = redis.createClient()
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

/*
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

      tile_data = {
        run: 1024,
        data: [255,255,255,255]
      }

      redis_client.hset('TAKEN_TILES', x+'_'+y, 'true');

      // echo the response
      callback(null, {id: x + '_' + y, tileData: tile_data, x: x, y: y})
      socket.broadcast.emit('tiles:create', {id: x + '_' + y, tileData: tile_data, x: x, y: y});
      socket.emit('tiles:create', {id: x + '_' + y, tileData: tile_data, x: x, y: y});

      chooseNextFreeTile(x,y);
    })

  });*/

  socket.on('tiles:read', function (data, callback) {
    /* do something to 'read' the whatever */
    if(data && data.tile) {
      redis_client.hget('TILE_DATA', data.id, function(err, result) {
        var xy = data.id.split('_');
        callback(null, {
          id: data.id
        , tileData: result
        , x : xy[0]
        , y: xy[1]
        });
      })
    }
    else {
      redis_client.hgetall('TILE_DATA', function(err, fieldValues) {
        var tiles = [];
        if(!fieldValues) {
          console.log('no tile data');
          return callback(null, tiles);
        }

        for(var x = 0; x < 50; x++) {
          for(var y = 0; y < 50; y++) {
            var t = {}
            t.id = x + '_' + y;
            t.tileData = fieldValues[t.id];
            t.x = x;
            t.y = y
            tiles.push(t);
          }
        }
        console.log('tiles', tiles)
        callback(null, tiles);
      })
    }
  });

  socket.on('tiles:update', function (data, callback) {
    console.log('UPDATE', data)

    // CUT MY LOSSES:
    // we'll just fully update.


    redis_client.hset('TILE_DATA', data.id, JSON.stringify(data.tileData), function(err) {
      if(err)
        return console.error('failed to set tile ', data.id)

      socket.broadcast.emit('tiles/' + data.id + ':update', data);
      callback(null, {id: data.id});
    });
  });

    /*
    redis_client.hget('TILE_DATA', data.id, function(err, result) {

      
      if(!result)
        return console.error('NO SUCH TILE, ', data.id)

      result = JSON.parse(result);
      var tileData = QuickUnRLE(result);
      console.log('UPDATE TILEDATA LENGTH', tileData.length)

      // need to update the tile pixel.
      var xy = data.id.split('_');
      var x = xy[0];
      var y = xy[1];      

      tileData[(y * TILE_SIZE * 4) + (x * 4)]       = data.pixel[0];
      tileData[(y * TILE_SIZE * 4) + (x * 4) + 1]   = data.pixel[1];
      tileData[(y * TILE_SIZE * 4) + (x * 4) + 2]   = data.pixel[2];
      tileData[(y * TILE_SIZE * 4) + (x * 4) + 3]   = data.pixel[3];

      result = QuickRLE(tileData);

      console.log('UPDATE RLE RESULT', result);

      redis_client.hset('TILE_DATA', data.id, JSON.stringify(result), function(err) {
        if(err)
          return console.error('failed to set tile ', data.id)

        socket.broadcast.emit('tiles/' + data.id + ':update', {id: data.id, tileData: result});
        callback(null, {id: data.id});
      })
    })
  });*/
});

dir = 0;

function chooseNextFreeTile(x, y) {
  // try to keep to the center.
  x = parseInt(x)
  y = parseInt(y)
  

  if(dir < 3)
    dir++;
  else 
    dir = 0;

  var dirX = 0;
  var dirY = 0;
  if(dir == 0) {
    // try going up.
    dirY = -1;
  }
  else if(dir == 1) {
    // try going left
    dirX = -1;
  }
  else if(dir == 2) {
    // try going down.
    dirY = 1
  }
  else if(dir == 3) {
    // try going right
    dirY = 1
  }

  var exists = true;
  async.doWhilst(function(callback) {
    x += dirX;
    y += dirY;
    redis_client.hexists('TAKEN_TILES', x + '_' + y, function(err, result) {
      console.log(err, result);
      exists = !!result;
      callback(err);
    })
  }, function() {
    return exists;
  }
  , function() {
    console.log('next', x, y)

    var multi2 = redis_client.multi();
    multi2.set('NEXT_FREE_TILE_X', x)
    multi2.set('NEXT_FREE_TILE_Y', y)
    multi2.exec(function(){})    

  });  
}

// Routes
app.get('/', function(req, res){

  var multi = redis_client.multi();
  multi.get('NEXT_FREE_TILE_X');
  multi.get('NEXT_FREE_TILE_Y');
  multi.exec(function(err, values) {
    if(err)
      return console.error(err);
    var x = values[0];
    var y = values[1];

    redis_client.hset('TAKEN_TILES', x+'_'+y, 'true');

    // echo the response
    chooseNextFreeTile(x,y);
    res.render('index', { locals: {myTile: { x: x, y: y }, title: 'Q - Collaborative Pixel Art'}, layout: false });
  })  
  
});

redis_client.get('NEXT_FREE_TILE_X', function(err, value) {
  if(!value) {
    var multi = redis_client.multi();
    multi.set('NEXT_FREE_TILE_X', '10')
    multi.set('NEXT_FREE_TILE_Y', '10')
    multi.exec();
  }
})


// initialize some fake tile data.
for(var x = 0; x < 50; x++) {

  
  var tileBlue = x*5;
   
  for(var y = 0; y < 50; y++) {    
    var tileRed = y*5;

    var tileData = [];
    for(var n=0; n < TILE_SIZE * TILE_SIZE * 4; n+=4) {
      /*tileData[n] = tileRed;
      tileData[n + 1] = 0;
      tileData[n + 2] = tileBlue;
      tileData[n + 3] = 255;*/

      tileData[n] = 255;
      tileData[n + 1] = 255;
      tileData[n + 2] = 255;
      tileData[n + 3] = 255;

    }
    redis_client.hset('TILE_DATA', x+'_'+y, JSON.stringify(QuickRLE(tileData)) );
  }
}

function QuickUnRLE(rleData) {
    var tileData = []
    var n = 0;
    for(var i = 0; i < rleData.length; i++) {
      for(var j = 0; j < rleData[i].run; j++) {
        var d = rleData[i].data;
        tileData[n++] = d[0]
        tileData[n++] = d[1]
        tileData[n++] = d[2]
        tileData[n++] = d[3]

      }
    }

    return tileData;
}

function QuickRLE(tileData) {
  var rleTileData = []
  var last;
  var run = 0;
  for(var i = 0; i+3 < tileData.length; i += 4) {
    if(i == 0) {
      // start our first run.
      last = []

      last[0] = tileData[i];
      last[1] = tileData[i + 1];
      last[2] = tileData[i + 2];
      last[3] = tileData[i + 3];
      run = 1;
    }
    else if( 
      last[0] != tileData[i] ||
      last[1] != tileData[i + 1] ||
      last[2] != tileData[i + 2] ||
      last[3] != tileData[i + 3]) {

      // no match.
      // push it into the rleTileData objects

      rleTileData.push({
        data: last  
      , run: run
      })

      // this pixel is different.
      // start a new run.
      //if(i+3 < tileData.length) {
      run = 1;
      last = []

      last[0] = tileData[i];
      last[1] = tileData[i + 1];
      last[2] = tileData[i + 2];
      last[3] = tileData[i + 3];
      //}
    }
    else {
      run++;
    }
  }
  rleTileData.push({
    data: last  
  , run: run
  })  
  return rleTileData;
}

if (!module.parent) {
  server.listen(3000);
  console.log("Q - Collaborative Pixel Art - env:" + app.settings.env);
}
