var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var popoverTpl = require('./repo-popover.jade');

require('bootstrap/js/tooltip');
require('bootstrap/js/popover');

module.exports = AmpersandView.extend({
  bindings: {
    'model.name': [
      {
        hook: 'name'
      },
      {
        hook: 'url',
        type: 'attribute',
        name: 'title'
      }
    ],
    'model.avatar_url': {
      type: 'attribute',
      name: 'src',
      hook: 'avatar'
    },
    'model.travis_badge_url': {
      type: 'attribute',
      name: 'src',
      hook: 'travis_badge_url'
    },
    'model.github_url': {
      type: 'attribute',
      name: 'href',
      hook: 'url'
    },
    'model.description': {
      hook: 'description'
    },
    'model.size': {
      hook: 'size'
    },
    'model.last_commit_at_string': {
      hook: 'last_commit_at'
    },
    'model.last_activity_at_string': {
      hook: 'last_activity_at'
    },
    'model.created_at_string': {
      hook: 'created_at'
    },
    'model.open_issues': {
      hook: 'open_issues'
    },
    'model.stargazers': {
      hook: 'stargazers'
    },
  },
  listeners: {
    'change rendered': this.onRendered
  },
  initialize: function() {
    this.listenTo(this, 'change:rendered', this.onRendered);
  },
  onRendered: function() {
    process.nextTick(function() {
      this.$a = $('[data-toggle="popover"]', this.el);
      this.$a.popover({
        html: true,
        trigger: 'hover',
        container: 'body',
        placement: 'auto right',
        content: popoverTpl(this.model)
      });

// this.$a.on('shown.bs.popover', function() {
//   $('.popover-content').html(popoverTpl(this.model));
// }.bind(this));
    }.bind(this));
  },
  template: require('./repo-grid-item.jade')
});
