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

  view.onPaintTile = function(tileView) {
    this.paintTile(tileView);

  }

  view.onClick = function(event) {
    xy = this.tileFromPoint(event.pageX, event.pageY, true);
    console.log('TILE CLICK', xy)
    this.tileViews[xy.x + '_' + xy.y].click(xy.tileX, xy.tileY, 0, 0, 0, 255);
  }

  view.onMousewheel = function(event, delta) {

    var aspectRatio =  window.innerHeight / window.innerWidth;

    var dest = {
      x: this.viewport.x - (50 * delta * event.pageX / window.innerWidth)
    , y: this.viewport.y - (50 * delta * event.pageY / window.innerHeight * aspectRatio)
    , w: this.viewport.w + (50 * delta)
    , h: this.viewport.h + (50 * delta * aspectRatio)
    }

    // clamp.
    if(dest.x < 0)
      dest.x = 0;
    else if(dest.x > window.innerWidth - 32)
      dest.x = window.innerWidth - 32;

    if(dest.y < 0)
      dest.y = 0;
    else if(dest.y > window.innerHeight - 32)
      dest.y = window.innerHeight - 32;

    if(dest.x + dest.w > window.innerWidth)
      dest.w = window.innerWidth - dest.x
    else if(dest.w < 32 && this.viewport.w == 32)
      return;
    else if(dest.w < 32)
      dest.w = 32

    if(dest.y + dest.h > window.innerHeight)
      dest.h = window.innerHeight - dest.y
    else if(dest.h < 32 && this.viewport.h == 32)
      return;
    else if(dest.h < 32)
      dest.h = 32

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
    this.canvas.height=  window.innerHeight

    this.context = this.canvas.getContext('2d');

    // disable image smoothing. even though it barely works.
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    this.viewport = {
        x: 0
      , y: 0
      , w: window.innerWidth
      , h: window.innerHeight
    }



    /*setTimeout(function() {
      that.zoomToRect(500, 500, 32, 32, 1000);
    }, 1000)*/

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
    var scaleX = window.innerWidth / that.viewport.w;
    var scaleY = window.innerHeight / that.viewport.h;    

    console.log('scaleX', scaleX, scaleY)

    var topLeft = that.tileFromPoint(0,0);
    var bottomRight = that.tileFromPoint(window.innerWidth,window.innerHeight, true)
    var offset = {
      x: topLeft.x - Math.floor(topLeft.x) 
    , y: topLeft.y - Math.floor(topLeft.y)
    }

    var width = 32 * scaleX;
    var height = 32 * scaleY;
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
    var scaleX = window.innerWidth / that.viewport.w;
    var scaleY = window.innerHeight / that.viewport.h;

    var topLeft = that.tileFromPoint(0,0);
    var bottomRight = that.tileFromPoint(window.innerWidth,window.innerHeight, true)
    var offset = {
      x: topLeft.x - Math.floor(topLeft.x) 
    , y: topLeft.y - Math.floor(topLeft.y)
    }
    topLeft.x = Math.floor(topLeft.x);
    topLeft.y = Math.floor(topLeft.y);

    var n = 0;
    var width = 32 * scaleX;
    var height = 32 * scaleY;
    var startX = Math.floor((-offset.x) * width);
    var startY = Math.floor((-offset.y) * height);

    for(var x = 0; x < bottomRight.x + 1 - topLeft.x; x++ ){
      for(var y = 0; y < bottomRight.y + 1 - topLeft.y; y++){
        var v = that.tileViews[(topLeft.x + x)+'_'+(topLeft.y + y)] || that.blankTile
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
  }

  view.zoomToTile = function(x, y, duration) {

    this.zoomToRect(
      x * 32 - 3
    , y * 32 - 3
    , 38
    , 38
    , duration)

  }

  view.tileFromPoint = function(x, y, floor) {

    var xpct = x / window.innerWidth;
    var ypct = y / window.innerHeight;

    //console.log('pct', xpct, ypct)

    x = (this.viewport.x + (this.viewport.w * xpct)) / 32;
    y = (this.viewport.y + (this.viewport.h * ypct)) / 32;

    var floorX = Math.floor(x);
    var floorY = Math.floor(y);

    var tileX = Math.floor((x - floorX) * 32);
    var tileY = Math.floor((y - floorY) * 32);

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
        for(var n=0; n < 32 * 32 * 4; n+=4) {
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
        for(var n=0; n < 32 * 32 * 4; n+=4) {
          tileData[n] = 255;
          tileData[n + 1] = 255;
          tileData[n + 2] = 255;
          tileData[n + 3] = 255;
        }

        this.blankTile = new TileModel({ tileData: tileData, id: x + '_' + y, x: x, y: y });
      }
    }
    console.log('init-blank-tiles done')
  }

  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);

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

    Backbone.on('PaintTile', this.onPaintTile)

  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
