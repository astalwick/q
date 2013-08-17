define(
  [
    'underscore'
  , 'backbone'

  , 'collections/tiles.collection'
  , 'models/tile.model'
  , 'views/tile.view'
  , 'templates'
  , 'config'
  , 'jquery.mousewheel'
  ]

, function (
  _
, Backbone
, TilesCollection
, TileModel
, TileView
, Templates
, Config
){

  var view = {};

  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  view.tagName = 'canvas'

  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */

  view.events = {
    'mousewheel'  : 'onMousewheel'
  , 'click'       : 'onClick'
  }

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */  
  view.addTileView = function(model) {
    //console.log('tileview')
    this.tileViews[model.id] = new TileView({model: model});
  }

  view.onZoomToUserTile = function() {
    this.zoomToTile(this.myTile.x, this.myTile.y, 2000);


  }

  view.onPaintTile = function(tileView) {
    this.paintTile(tileView);

  }

  view.onColorChange = function(r,g,b) {

    this.currentColor.r = r;
    this.currentColor.g = g;
    this.currentColor.b = b;

  }

  view.onClick = function(event) {

    xy = this.tileFromPoint(event.pageX, event.pageY - 100,  true);
    if(xy.x != this.myTile.x || xy.y != this.myTile.y) {
      console.log("No, can't write in other user tile")
      return;
    }

    console.log('TILE CLICK', xy)
    this.tileViews[xy.x + '_' + xy.y].click(xy.tileX, xy.tileY, this.currentColor.r, this.currentColor.g, this.currentColor.b, 255);
  }

  view.onMousewheel = function(event, delta) {
   if(!$('body').hasClass('welcome')) {
     $('body').removeClass('zoomed-out zoomed-in welcome');
     $('body').addClass('zoomed-out');
     window.zoomedIn = false;
   }

    var aspectRatio =  this.canvas.height / this.canvas.width;

    var dest = {
      x: this.viewport.x - (50 * delta * event.pageX / this.canvas.width)
    , y: this.viewport.y - (50 * delta * (event.pageY - 100)/ this.canvas.height * aspectRatio)
    , w: this.viewport.w + (50 * delta)
    , h: this.viewport.h + (50 * delta * aspectRatio)
    }

    // clamp.
    if(dest.x < 0)
      dest.x = 0;
    else if(dest.x > this.canvas.width - Config.TILE_SIZE)
      dest.x = this.canvas.width - Config.TILE_SIZE;

    if(dest.y < 0)
      dest.y = 0;
    else if(dest.y > this.canvas.height - Config.TILE_SIZE)
      dest.y = this.canvas.height - Config.TILE_SIZE;

    if(dest.x + dest.w > this.canvas.width)
      dest.w = this.canvas.width - dest.x
    else if(dest.w < Config.TILE_SIZE && this.viewport.w == Config.TILE_SIZE)
      return;
    else if(dest.w < Config.TILE_SIZE)
      dest.w = Config.TILE_SIZE

    if(dest.y + dest.h > this.canvas.height)
      dest.h = this.canvas.height - dest.y
    else if(dest.h < Config.TILE_SIZE && this.viewport.h == Config.TILE_SIZE)
      return;
    else if(dest.h < Config.TILE_SIZE)
      dest.h = Config.TILE_SIZE

    //console.log(dest);
    this.zoomToRect(Math.round(dest.x), Math.round(dest.y), Math.round(dest.w), Math.round(dest.h), 100);    
  }

  /* ======================================================================= *
   *  PRIVATE CLASS METHODS                                                  *
   * ======================================================================= */


  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  view.render = function() {
    this.$el.html(jade.render('canvas.view'));

    //this.$el.css('width', window.innerWidth);
    //this.$el.css('height', window.innerHeight);

    this.canvas = this.$el[0];
    this.canvas.width = window.innerWidth;
    this.canvas.height=  window.innerHeight - 100;

    this.context = this.canvas.getContext('2d');
    this.context.strokeStyle = '#aaaaaa';
    this.context.lineWidth = 1;

    // disable image smoothing. even though it barely works.
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    var maxw = this.canvas.width > 50 * Config.TILE_SIZE ? 50 * Config.TILE_SIZE : this.canvas.width;
    var maxh = this.canvas.height > 50 * Config.TILE_SIZE ? 50 * Config.TILE_SIZE : this.canvas.height;

    this.viewport = {
        x: 0
      , y: 0
      , w: Math.floor(maxw / 3)
      , h: Math.floor(maxh / 3)
    }

    console.log(this.viewport)
    return this;
  }

  this.animLoop = function(time) {
    if(this.activeAnimations.length == 0) {
      requestAnimationFrame(this.animLoop);
      return;
    }
    var continuedAnimations = []
    _.each(this.activeAnimations, function(anim) {
        if(anim(time))
          continuedAnimations.push(anim);
    })
    this.activeAnimations = continuedAnimations;
    requestAnimationFrame(this.animLoop);
  }

  view.paint = function() {
    var that = this;
    that.zoomToRect(that.viewport.x, that.viewport.y, that.viewport.w, that.viewport.h);
  }

  view.zoomToRect = _.throttle(function (x, y, w, h, duration) {

    var that = this;

    var start = {
      x: this.viewport.x
    , y: this.viewport.y
    , w: this.viewport.w
    , h: this.viewport.h
    }

    var dest = {
      x: x
    , y: y
    , w: w
    , h: h
    }

    var startTime;
    this.activeAnimations.push(function(time) {
      
      if(!startTime) startTime = time;
      
      var pct = duration ? (time - startTime) / duration : 1.0;

      if(pct >= 1.0) {
        that.viewport.w = Math.round(dest.w);
        that.viewport.h = Math.round(dest.h);
        that.viewport.x = Math.round(dest.x);
        that.viewport.y = Math.round(dest.y);
      }
      else {
        that.viewport.w = Math.round(start.w + ((dest.w - start.w) * pct))
        that.viewport.h = Math.round(start.h + ((dest.h - start.h) * pct))
        that.viewport.x = Math.round(start.x + ((dest.x - start.x) * pct))
        that.viewport.y = Math.round(start.y + ((dest.y - start.y) * pct))
      }

      //console.log(current)

      that.paintViewport();

      return pct < 1.0;
    })

  })

  view.paintTile = function(tileView) {
    var that = this;
    var scaleX = that.canvas.width / that.viewport.w;
    var scaleY = that.canvas.height / that.viewport.h;    

    var topLeft = that.tileFromPoint(0,0);
    var bottomRight = that.tileFromPoint(that.canvas.width,that.canvas.height, true)
    var offset = {
      x: topLeft.x - Math.floor(topLeft.x) 
    , y: topLeft.y - Math.floor(topLeft.y)
    }

    var width = Config.TILE_SIZE * scaleX;
    var height = Config.TILE_SIZE * scaleY;
    var startX = Math.floor((-offset.x) * width);
    var startY = Math.floor((-offset.y) * height);    

    console.log(tileView.model.get('x'))

    console.log('paintTile', Math.floor((tileView.model.get('x')-topLeft.x) * width - offset.x)
            , Math.floor((tileView.model.get('y')-topLeft.y) * height - offset.y)
            , Math.ceil(width)
            , Math.ceil(height))
    tileView.drawTile(
              that.context
            , Math.floor((tileView.model.get('x')-topLeft.x) * width - offset.x)
            , Math.floor((tileView.model.get('y')-topLeft.y) * height - offset.y)
            , Math.ceil(width)
            , Math.ceil(height));
  }

  view.paintViewport = function() {

    var that = this;
    var scaleX = this.canvas.width / that.viewport.w;
    var scaleY = this.canvas.height / that.viewport.h;

    var topLeft = that.tileFromPoint(0,0);
    var bottomRight = that.tileFromPoint(this.canvas.width,this.canvas.height, true)
    var offset = {
      x: topLeft.x - Math.floor(topLeft.x) 
    , y: topLeft.y - Math.floor(topLeft.y)
    }
    topLeft.x = Math.floor(topLeft.x);
    topLeft.y = Math.floor(topLeft.y);

    var n = 0;
    var width = Config.TILE_SIZE * scaleX;
    var height = Config.TILE_SIZE * scaleY;
    var startX = Math.floor((-offset.x) * width);
    var startY = Math.floor((-offset.y) * height);


    var myCanvasXY

    for(var x = 0; x < bottomRight.x + 1 - topLeft.x; x++ ){
      for(var y = 0; y < bottomRight.y + 1 - topLeft.y; y++){
        var v = that.tileViews[(topLeft.x + x)+'_'+(topLeft.y + y)] || that.blankTile
        if(topLeft.x+x == window.myTile.x && topLeft.y + y == window.myTile.y)
          myCanvasXY = {x: startX + Math.floor(x * width)
                ,y: startY + Math.floor(y * height)
                ,w: Math.ceil(width)
                ,h: Math.ceil(height) }

          v.drawTile(
                  that.context
                , startX + Math.floor(x * width)
                , startY + Math.floor(y * height)
                , Math.ceil(width)
                , Math.ceil(height)
          )
        n++;
      }
    }       

    // we're going to draw four lines, around our canvas, to indicate where it is.
    // left
    if(myCanvasXY) {
      that.context.beginPath();
      that.context.moveTo(myCanvasXY.x-1,myCanvasXY.y-1);
      that.context.lineTo(myCanvasXY.x+myCanvasXY.w+1,myCanvasXY.y-1);
      that.context.lineTo(myCanvasXY.x+myCanvasXY.w+1,myCanvasXY.y+myCanvasXY.h+1);
      that.context.lineTo(myCanvasXY.x-1,myCanvasXY.y+myCanvasXY.h+1);
      that.context.lineTo(myCanvasXY.x-1,myCanvasXY.y-1);
      that.context.closePath();
      that.context.stroke(); 
    }

  }

  view.zoomToTile = function(x, y, duration) {

    this.zoomToRect(
      x * Config.TILE_SIZE - 3
    , y * Config.TILE_SIZE - 3
    , Config.TILE_SIZE + 6
    , Config.TILE_SIZE + 6
    , duration)

  }

  view.tileFromPoint = function(x, y, floor) {

    var xpct = x / this.canvas.width;
    var ypct = y / this.canvas.height;

    //console.log('pct', xpct, ypct)

    x = (this.viewport.x + (this.viewport.w * xpct)) / Config.TILE_SIZE;
    y = (this.viewport.y + (this.viewport.h * ypct)) / Config.TILE_SIZE;

    var floorX = Math.floor(x);
    var floorY = Math.floor(y);

    var tileX = Math.floor((x - floorX) * Config.TILE_SIZE);
    var tileY = Math.floor((y - floorY) * Config.TILE_SIZE);

    //console.log('surface', x, y)

    if(floor) {
      return { x: floorX, y: floorY, tileX: tileX, tileY : tileY}
    }
    else {
      return { x: x, y: y, tileX: tileX, tileY : tileY }
    }
  }

  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */

  view.initializeFakeTiles = function() {
    var tileData;
    
    for(var x = 0; x < 50; x++) {
      var tileBlue = x*5;
       
      for(var y = 0; y < 50; y++) {    
        var tileRed = y*5;

        var tileData = [];
        for(var n=0; n < Config.TILE_SIZE * Config.TILE_SIZE * 4; n+=4) {
          tileData[n] = tileRed;
          tileData[n + 1] = 0;
          tileData[n + 2] = tileBlue;
          tileData[n + 3] = 255;
        }

        var t = new TileModel({ tileData: tileData, id: x + '_' + y, x: x, y: y });
        this.tiles.add(t);
      }
    }
    console.log('init-fake-tiles done')
  }

  view.initializeBlankTile = function() {
    var tileData;
    
    for(var x = 0; x < 50; x++) {
       
      for(var y = 0; y < 50; y++) {    

        var tileData = [];
        for(var n=0; n < Config.TILE_SIZE * Config.TILE_SIZE * 4; n+=4) {
          tileData[n] = 255;
          tileData[n + 1] = 255;
          tileData[n + 2] = 255;
          tileData[n + 3] = 255;
        }
        var model = new TileModel({ tileData: tileData, id: x + '_' + y, x: x, y: y });
        model.tileData = tileData;

        this.blankTile = new TileView({model: model}) 
      }
    }
    console.log('init-blank-tiles done')
  }

  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);

    this.initializeBlankTile();
    this.myTile = window.myTile;
    console.log('MY TILE', this.myTile)

    this.tiles = new TilesCollection();
    this.tiles.fetch({error:function() {console.log('err')},success: function() {

      that.paint();
      
      function animLoop(time) {
        if(that.activeAnimations.length == 0) {
          requestAnimationFrame(animLoop);
          return;
        }
        var continuedAnimations = []
        _.each(that.activeAnimations, function(anim) {
            if(anim(time))
              continuedAnimations.push(anim);
        })
        that.activeAnimations = continuedAnimations;
        requestAnimationFrame(animLoop);
      }

      requestAnimationFrame(animLoop);      
    }});
    this.tiles.on('add', this.addTileView);
    this.tileViews = {};

    this.activeAnimations = [];

    this.currentColor = { r: 0, g: 62, b: 88 }

    Backbone.on('PaintTile', this.onPaintTile)
    Backbone.on('Color', this.onColorChange)
    Backbone.on('ZoomToTile', this.onZoomToUserTile)

  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
