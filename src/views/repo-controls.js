var $ = require('jquery');

var AmpersandView = require('ampersand-view'),
  debug = require('debug')('mongodb-js:views:repo-controls');

module.exports = AmpersandView.extend({
  events: {
    'click a.btn': 'changeLayout',
    'change select': 'changeSort'
  },
  initialize: function() {
    this.listenTo(this, 'change:rendered', this.onRendered);
  },
  changeSort: function(evt) {
    var el = evt.delegateTarget,
      key = el.selectedOptions[0].value;

    if (key === this.parent.sort_key) {
      return debug('sort_key is already %s', sort_key);
    }
    debug('setting sort_key to %s', key);
    this.parent.sort_key = key;
  },
  changeLayout: function(evt) {
    var el = evt.delegateTarget,
      layout = el.dataset.hook;

    if (layout === this.parent.layout) {
      return debug('layout is already %s', layout);
    }

    this.$btnGroup.find('.btn.active').removeClass('active');
    $(el).addClass('active');

    debug('switching parent layout to %s', layout);
    this.parent.layout = layout;

  },
  onRendered: function() {
    this.$el = $(this.el);
    this.$btnGroup = this.$el.find('.btn-group');
    this.$btnGroup.find('.btn[data-hook=' + this.parent.layout + ']').addClass('active');

    this.$el.find('select').val(this.parent.sort_key);
  },
  template: require('./repo-controls.jade')
});
