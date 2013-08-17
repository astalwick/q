define(
  [
    'underscore'
  , 'backbone'
  , 'config'
  ]
, function(_, Backbone, Config) {
  
  var model = {};
  
  /* ======================================================================= *
   *  MODEL ATTRIBUTES                                                       *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */

  model.url = function() {
    if(this.get('id'))
      return 'tiles/' + this.get('id');
    else
      return 'tiles';
  }

  model.ioUpdate = function(data) {

    console.log('IOUPDATE:', data)
    if(data.tileData)
      this.tileData = this.QuickUnRLE(data.tileData);

    this.trigger('IOUpdatePixel', data.pixelx, data.pixely, data.pixel[0],data.pixel[1],data.pixel[2],data.pixel[3])
    //Backbone.trigger('PaintTile', this)

  }

  model.parse = function(response) {
    //console.log('parse received', response.tileData)
    if(response.tileData)
      this.tileData = this.QuickUnRLE(JSON.parse(response.tileData) );

    //console.log(this.tileData.length)
    return Backbone.Model.prototype.parse.call(this, response);
  }

  model.save = function() {

    this.set('tileData', this.QuickRLE(this.tileData))
    
    console.log('save saved ', this.get('tileData'));
    return Backbone.Model.prototype.save.apply(this, arguments); 
  }

  model.setPixel = function(x,y,r,g,b,a,silent) {

    console.log('SETPIXEL', x, y, r, g, b, a)
    this.tileData[(y * Config.TILE_SIZE * 4 + x * 4)] = r;
    this.tileData[(y * Config.TILE_SIZE * 4 + x * 4) + 1] = g;
    this.tileData[(y * Config.TILE_SIZE * 4 + x * 4) + 2] = b;
    this.tileData[(y * Config.TILE_SIZE * 4 + x * 4) + 2] = a;
    this.set('pixelx', x)
    this.set('pixely', y)
    this.set('pixel', [r,g,b,a]);    
  }

  model.QuickUnRLE = function(rleData) {

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

  model.QuickRLE = function(tileData) {
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

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */
  
  model.initialize = function () {
    _.bindAll(this);
    this.ioBind('update', this.ioUpdate);
  };

  model.constructor = function(attributes, options) {

    Backbone.Model.prototype.constructor.call(this, attributes, options)

  }
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return Backbone.Model.extend(model);
});
