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
  view.className = 'dock'

  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */

  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */

  view.events = {
    'click .color'        : 'onSelectColor'
  , 'click .get-started'  : 'onZoomToTile'
  , 'click .take-me-back' : 'onZoomToTile'
  , 'click .auto-mirror'  : 'onAutoMirrorChange'
  }

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */  

  view.onAutoMirrorChange = function() {
    Backbone.trigger('AutoMirrorChanged', this.$('.auto-mirror').is(':checked'))
  }

  view.onZoomToTile = function(e) {
    Backbone.trigger('ZoomToTile');
    $('body').removeClass('zoomed-out zoomed-in welcome');
    window.zoomedIn = true;
    $('body').addClass('zoomed-in');
  }

  view.onSelectColor = function(e) {
    var className = e.currentTarget.className;
    var color = className.split(' ')[1];
    var hex;
    switch(color) {
      case 'ad':
        hex = '#E8DDCB';
        break;
      case 'bd':
        hex = '#CDB380';
        break;
      case 'cd':
        hex = '#036564';
        break;
      case 'dd':
        hex = '#033649';
        break;
      case 'ed':
        hex = '#031634';
        break;
      case 'fd':
        hex = '#003e58';
        break;
      case 'gd':
        hex = '#05dbf5';
        break;
      case 'hd':
        hex = '#42f0f6';
        break;
      case 'al':
        hex = '#583f2a';
        break;
      case 'bl':
        hex = '#3c200b';
        break;
      case 'cl':
        hex = '#003e58';
        break;
      case 'dl':
        hex = '#05dbf5';
        break;
      case 'el':
        hex = '#42f0f6';
        break;
      case 'fl':
        hex = '#583f2a';
        break;
      case 'gl':
        hex = '#3c200b';
        break;        
      case 'hl':
        hex = '#ffffff'
        break;                  
    }

    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
    }

    var rgb = hexToRgb(hex);

    Backbone.trigger('Color', rgb.r, rgb.g, rgb.b, 255);

  }

  /* ======================================================================= *
   *  PRIVATE CLASS METHODS                                                  *
   * ======================================================================= */

  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  view.render = function() {
    this.$el.html(jade.render('dock.view'))
    return this;
  }

  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */
  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
