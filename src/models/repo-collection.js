var AmpersandCollection = require('ampersand-collection'),
  rest = require('ampersand-collection-rest-mixin'),
  sortable = require('./sortable-collection-mixin'),
  filterable = require('ampersand-collection-filterable'),
  config = require('../config').RepoCollection,
  organization_id = require('../config').Organization._id,
  _ = require('underscore');

var Repo = require('./repo');

module.exports = AmpersandCollection.extend(rest, sortable, filterable, config, {
  model: Repo,
  sort_key: 'size',
  url: function() {
    return 'https://api.github.com/orgs/' + organization_id + '/repos';
  },
  initialize: function() {
    this.listenTo(this, 'add sync remove reset', _.debounce(this._refacet, 100, this));
  },
  // @todo: break off into ampersand-collection-facet-mixin
  facets: {},
  _refacet: function() {
    var keys = _.pluck(_.result(this, 'facetBy'), '_id'),
      changed = [];
    _.each(keys, function(k) {
      var newFacets = _.countBy(this.models, k);
      if (!_.isEqual(this.facets[k], newFacets)) {
        changed.push([k, this.facets[k], newFacets]);
        this.facets[k] = newFacets;
      }
    }, this);

    process.nextTick(function() {
      _.each(changed, function(k, prev, current) {
        this.trigger('change:facet.' + k, prev, current);
      }, this);

      if (changed.length > 0) {
        this.trigger('change:facet');
      }
    }.bind(this));
  },
});
