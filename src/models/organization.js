var AmpersandModel = require('ampersand-model');

module.exports = AmpersandModel.extend({
  props: {
    _id: 'string',
    avatar_url: 'string',
    blog_url: 'string',
    github_url: 'string',
    title: 'string'
  },
  url: function() {
    return 'https://api.github.com/orgs/' + this._id;
  },
  parse: function(d) {
    var org = {
      _id: d.login,
      avatar_url: d.avatar_url,
      blog_url: d.blog,
      github_url: d.html_url,
      description: d.description
    };
    return org;
  }
});
