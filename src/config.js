var src = require('../config.js');

var _ = require('underscore'),
  jade = require('jade');

module.exports.Organization = {
  _id: src.org,
  title: src.title
};

// RepoCollection.facetBy
module.exports.RepoCollection = {
  facetBy: _.map(src.facetBy || [], function(k) {
    return {
      _id: k,
      name: src.columns[k].name || k
    };
  }),
  columns: _.map(src.columns, function(d, key) {
    if (d.type === 'string') {
      return {
        _id: key,
        fn: function(repo) {
          return repo[key];
        }
      };
    }
    if (d.type === 'image') {
      var tpl = jade.compile([
        'a(href=' + d.href + ', target="_blank")',
        '  img(src=' + d.src + ')'
      ].join('\n'));
      return {
        _id: key,
        fn: function(repo) {
          return tpl(repo, {});
        }
      };
    }
  })
};

var _props = _.omit(src, 'facetBy', 'columns', 'title', 'org');
module.exports.Repo = {
  // Declares extra properties
  props: _.mapObject(_props, function(fn, key) {
    return {
      type: 'string'
    };
  }),
  // Called by each `Repo.parse` so properties will be set by custom handlers.
  parseExtra: function(repo, resp) {
    _.mapObject(_props, function(fn, key) {
      repo[key] = fn.call(this, repo, resp);
    }, this);
  }
};
