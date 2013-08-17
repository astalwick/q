define(
  [
    'underscore'
  , 'backbone'

  , 'models/item.model'
  , 'collections/item.collection'

  , 'views/item.view'
  , 'templates'
  ]

, function (
  _
, Backbone

, ItemModel
, ItemCollection
, ItemView

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
    'click .add-item' : 'onAddItem'
  }

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */  
  view.onAddItem = function(e) {
    var item = new ItemModel({text: this.$('.item-text').val()})
    item.save();
    this.collection.add(item)
    this.$('.item-text').val('')
  }

  /* ======================================================================= *
   *  PRIVATE CLASS METHODS                                                  *
   * ======================================================================= */

  view.ioCreatedItem = function(attributes) {
    var model = new ItemModel(attributes);
    this.collection.add(model);
  }

  view.ioDeletedItem = function() {
    console.log('deleted items', arguments)
  }

  view.addItemView = function(model) {
    model.on('removed', this.modelRemoved)
    this.$el.append(new ItemView({model: model}).render().el);
  }

  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  view.render = function() {
    this.$el.html(jade.render('page.view', { counter: this.counter }));
    return this;
  }

  /* ======================================================================= *
   *  VIEW CONSTRUCTOR & INITIALIZATION                                      *
   * ======================================================================= */
  view.initialize = function(options) {
    var that = this;
    _.bindAll(this);
    this.counter = 0;

    this.collection = new ItemCollection([], {});
    this.collection.fetch({
      success: function() {
        that.collection.ioBind('create', that.ioCreatedItem)
      }
    })

    this.collection.on('add', this.addItemView);
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
