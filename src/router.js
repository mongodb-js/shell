var AmpersandRouter = require('ampersand-router');

var ReposPage = require('./repos');

module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    'repos/:sort_key/:layout': 'repos',
    '(*path)': 'catchAll'
  },
  index: function() {
    this.trigger('page', new ReposPage({}));
  },
  repos: function(sort_key, layout) {
    this.trigger('page', new ReposPage({
      sort_key: sort_key,
      layout: layout
    }));
  },
  catchAll: function() {
    console.warn('catchAll!', arguments);
    this.redirectTo('');
  }
});
