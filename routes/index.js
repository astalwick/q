var _     = require('underscore')

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Q - Collaborative Pixel Art', layout: false });
};