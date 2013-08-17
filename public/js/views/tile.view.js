define(
  [
    'underscore'
  , 'backbone'

  , 'templates'
  ]

, function (
  _
, Backbone

, Templates
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
    this.imageData.data[(y * 32 * 4 + x * 4)] = r;
    this.imageData.data[(y * 32 * 4 + x * 4) + 1] = g;
    this.imageData.data[(y * 32 * 4 + x * 4) + 2] = b;
    this.imageData.data[(y * 32 * 4 + x * 4) + 2] = a;
    this.context.putImageData(this.imageData,0,0);

    this.model.setPixel(x,y,r,g,b,a);
    this.model.save();
    Backbone.trigger('PaintTile', this)
  }

  view.drawTile = function(ctx, posX, posY, width, height) {
    if(true){//width < 150 && height < 150) {
      ctx.drawImage(
        this.canvas
        , 0
        , 0
        , 32
        , 32
        , posX
        , posY
        , width
        , height)
    }
    /*else {
      // fillrect... 
      //var start = Date.now();
      var imageData = ctx.createImageData(width, height);
      //var imageTime = Date.now() - start;
      //start = Date.now();
      var buf = new ArrayBuffer(width * height * 4);
      var buf8 = new Uint8ClampedArray(buf);
      var data32 = new Uint32Array(buf);    
      //var allocTime = Date.now() - start;

      var id = this.imageData.data;
      var n = 0;

      // precalculate.  if we do it outside of the loop,
      // we have far less rounding going on.
      var xh = []
      var yh = []
      for(var x = 0; x < width; x++) {
        xh.push(Math.floor(x / width) * 4);
      }
      for(var y = 0; y < height; y++) {
        yh.push(Math.floor(y / height * 32) * 32 * 4);
      }

      //start = Date.now();
      for(var x = 0; x < width; x++) {
        for(var y = 0; y < height; y++) {
          var offset = yh[y] + xh[x];
          data32[y * width + x] =
                  (255 << 24) |    // alpha
                  (id[offset + 2] << 16) |    // blue
                  (id[offset + 1] <<  8) |    // green
                   id[offset];            // red

          n++;
        }
      }
      //var loopTime = Date.now() - start;
      
      //start = Date.now();
      imageData.data.set(buf8);
      //var setTime = Date.now() - start;
      //start = Date.now();
      ctx.putImageData(imageData, posX, posY)
      //var putTime = Date.now() - start;

    }*/
  }


  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */
  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);

    this.model = options.model;
    this.model.on('IOUpdatePixel', function(x,y,r,g,b,a) { 
      that.imageData.data[(y * 32 * 4 + x * 4)] = r;
      that.imageData.data[(y * 32 * 4 + x * 4) + 1] = g;
      that.imageData.data[(y * 32 * 4 + x * 4) + 2] = b;
      that.imageData.data[(y * 32 * 4 + x * 4) + 2] = a;      
      that.context.putImageData(that.imageData,0,0);
      Backbone.trigger('PaintTile', that) 
    })
    this.canvas = document.createElement("canvas");
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    this.imageData = this.context.createImageData(32,32);

    for(var i = 0; i < 32 * 32 * 4; i++) {
      this.imageData.data[i] = this.model.tileData[i];
    }
    this.context.putImageData(this.imageData,0,0);
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
