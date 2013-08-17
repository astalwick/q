define(
  [
    'underscore'
  , 'backbone'

  , '../models/tile.model'
  ]
, function(
    _
  , Backbone

  , ItemModel
) {

  var collection = {};

  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  collection.model = ItemModel;

  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */

  /* eventually, when we support multiple canvases, put this back in  */
  /*collection.fetch = function(options) {
    options               || (options = {});
    options.data          || (options.data = {})
    options.data.itemId   || (options.data.itemId = this.itemId)

    Backbone.Collection.prototype.fetch.call(this, options);
  } */  

  /* ======================================================================= *
   *  PULSE COLLECTION CONSTRUCTOR & INITIALIZATION                          *
   * ======================================================================= */
  collection.constructor = function(models, options) {
    _.bindAll(this);
    
    this.url = 'tiles';

    Backbone.Collection.call(this, models, options);
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.Collection.extend(collection);
  
});
