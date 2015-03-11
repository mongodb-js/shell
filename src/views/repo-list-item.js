var AmpersandView = require('ampersand-view');

module.exports = AmpersandView.extend({
  bindings: {
    'model.name': {
      hook: 'name'
    },
    'model.avatar_url': {
      type: 'attribute',
      name: 'src',
      hook: 'avatar'
    },
    'model.github_url': {
      type: 'attribute',
      name: 'href',
      hook: 'url'
    },
    'model.travis_url': {
      type: 'attribute',
      name: 'href',
      hook: 'travis_url'
    },
    'model.travis_badge_url': {
      type: 'attribute',
      name: 'src',
      hook: 'travis_badge_url'
    },
    'model.npm_downloads_url': {
      type: 'attribute',
      name: 'src',
      hook: 'npm_downloads_url'
    },
    'model.description': {
      hook: 'description'
    },
    'model.size_string': {
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
    'model.open_pull_requests': {
      hook: 'open_pull_requests'
    },
    'model.stargazers': {
      hook: 'stargazers'
    },
  },
  template: require('./repo-list-item.jade')
});
