define(
  [
    'underscore'
  , 'backbone'

  , 'templates'
  , 'config'
  ]

, function (
  _
, Backbone

, Templates
, Config
){

  var view = {};

  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */

  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */

  view.events = {
  }

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */  

  /* ======================================================================= *
   *  PRIVATE CLASS METHODS                                                  *
   * ======================================================================= */

  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  view.click = function(x, y, r, g, b, a) {
    console.log('click', x,y,r,g,b,a)

    this._setPixel(x, y, r, g, b, a);
    if(this.autoMirror) {
      this._setPixel(Config.TILE_SIZE - x - 1, y, r, g, b, a);
      this._setPixel(Config.TILE_SIZE - x - 1, Config.TILE_SIZE - y - 1, r, g, b, a);
      this._setPixel(x, Config.TILE_SIZE - y - 1, r, g, b, a);
    }
    this.context.putImageData(this.imageData,0,0);

    
    Backbone.trigger('PaintTile', this)
  }

  view._setPixel = function(x, y, r, g, b, a) {
    console.log('_setPixel', x,y,r,g,b,a)
    this.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4)] = r;
    this.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 1] = g;
    this.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 2] = b;
    this.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 3] = a;
    this.model.setPixel(x,y,r,g,b,a);
    this.model.save();
  }

  view.drawTile = function(ctx, posX, posY, width, height) {
    ctx.drawImage(
      this.canvas
      , 0
      , 0
      , Config.TILE_SIZE
      , Config.TILE_SIZE
      , posX
      , posY
      , width
      , height)
  }


  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */
  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);

    this.model = options.model;
    this.model.on('IOUpdatePixel', function(x,y,r,g,b,a) { 
      console.log('IOUpdatePixel', x, y, r, g, b, a)
      that.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4)] = r;
      that.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 1] = g;
      that.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 2] = b;
      that.imageData.data[(y * Config.TILE_SIZE * 4 + x * 4) + 3] = a;      
      that.context.putImageData(that.imageData,0,0);
      Backbone.trigger('PaintTile', that) 
    })
    this.canvas = document.createElement("canvas");
    this.canvas.width = Config.TILE_SIZE;
    this.canvas.height = Config.TILE_SIZE;
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    this.imageData = this.context.createImageData(Config.TILE_SIZE,Config.TILE_SIZE);

    for(var i = 0; i < Config.TILE_SIZE * Config.TILE_SIZE * 4; i++) {
      this.imageData.data[i] = this.model.tileData[i];
    }
    this.context.putImageData(this.imageData,0,0);

    that.autoMirror = true;
    Backbone.on('AutoMirrorChanged', function(value) {
      that.autoMirror = value;
    })
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
