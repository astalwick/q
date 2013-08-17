define(
  [
    'underscore'
  , 'backbone'

  , 'views/canvas.view'
  , 'views/dock.view'

  , 'templates'
  ]

, function (
  _
, Backbone

, CanvasView
, DockView

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
  view.render = function() {
    this.$el.append(this.dockView.render().el)
    this.$el.append(this.canvasView.render().el)
    return this;
  }

  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */
  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);
    this.canvasView = new CanvasView();
    this.dockView = new DockView();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
