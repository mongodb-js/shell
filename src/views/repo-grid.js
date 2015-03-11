var AmpersandView = require('ampersand-view'),
  RepoGridItemView = require('./repo-grid-item.js');

module.exports = AmpersandView.extend({
  template: require('./repo-grid.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, RepoGridItemView, this.queryByHook('repo-grid'));
  }
});
