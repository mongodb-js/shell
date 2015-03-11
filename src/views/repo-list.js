var AmpersandView = require('ampersand-view'),
  RepoListItemView = require('./repo-list-item.js');

module.exports = AmpersandView.extend({
  template: require('./repo-list.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, RepoListItemView, this.queryByHook('repo-list'));
  }
});
