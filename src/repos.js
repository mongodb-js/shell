var AmpersandView = require('ampersand-view'),
  ViewSwitcher = require('ampersand-view-switcher'),
  RepoCollection = require('./models/repo-collection'),
  RepoListView = require('./views/repo-list'),
  RepoGridView = require('./views/repo-grid'),
  RepoControlsView = require('./views/repo-controls'),
  _ = require('underscore'),
  config = require('./config');

var Organization = require('./models/organization');

module.exports = AmpersandView.extend({
  collections: {
    repos: RepoCollection
  },
  bindings: {
    repo_count: {
      hook: 'repo_count'
    },
    'org.avatar_url': {
      hook: 'org_avatar_url',
      type: 'attribute',
      name: 'src'
    },
    'org.title': {
      hook: 'org_title',
    }
  },
  events: {
    'click input[type=checkbox]': 'onCheckboxClicked'
  },
  props: {
    layout: {
      type: 'string',
      values: ['list', 'grid'],
      default: 'grid'
    },
    sort_key: {
      type: 'string',
      default: 'stargazers_count'
    },
    filters: {
      type: 'object',
      default: function() {
        return {};
      }
    }
  },
  derived: {
    repo_count: {
      deps: ['repos.length'],
      fn: function() {
        return this.repos.length;
      }
    }
  },
  children: {
    org: Organization
  },
  // @todo: send patch for ampersand-state so changes on collections recalculate
  // derived properties.
  _initCollections: function() {
    var coll;
    if (!this._collections) return;
    for (coll in this._collections) {
      this[coll] = new this._collections[coll](null, {
        parent: this
      });
      this.listenTo(this[coll], 'all', this._getEventBubblingHandler(coll));
    }
  },
  initialize: function() {
    this.org.set(config.Organization);
    this.org.fetch();

    this.listenTo(this.repos, 'change:facet', function() {
      console.log('repos now have facets', this.repos.facets);
    });
    this.listenTo(this, 'change:layout', this.onLayoutChanged);
    this.listenTo(this, 'change:sort_key', this.onSortKeyChanged);
    this.listenTo(this, 'change:layout change:sort_key', this.updateUrlState);

    this.repos.sort_key = this.sort_key;
    this.repos.fetch();
  },
  applyFilters: function() {
    var keys = _.keys(this.filters);
    if (keys.length === 0) {
      this.repos.unfilter();
      return;
    }

    var values = _.values(this.filters);
    this.repos.filter(function(repo) {
      return _.every(keys, function(k, i) {
        return _.contains(values[i], repo[k]);
      });
    });
  },
  onCheckboxClicked: function(evt) {
    var el = evt.target,
      key = el.dataset.hook,
      op = el.checked ? 'add' : 'remove',
      value = el.value;

    if (op === 'add') {
      if (!this.filters[key]) {
        this.filters[key] = [];
      }
      this.filters[key].push(value);
    } else {
      this.filters[key] = _.without(this.filters[key], value);
      if (this.filters[key].length === 0) {
        this.filters = _.omit(this.filters, key);
      }
    }
    this.applyFilters();
  },
  template: require('./repos.jade'),
  render: function() {
    this.renderWithTemplate();
    this.switcher = new ViewSwitcher(this.queryByHook('repos-container'), {
      show: function() {},
      view: this.getListView()
    });
  },
  onSortKeyChanged: function() {
    this.repos.sort_key = this.sort_key;
    this.repos.sort();
  },
  updateUrlState: function() {
    window.app.url('repos/' + this.sort_key + '/' + this.layout);
  },
  onLayoutChanged: function() {
    this.switcher.set(this.getListView());
  },
  getListView: function() {
    if (this.layout === 'list') {
      return new RepoListView({
          collection: this.repos
        });
    }
    return new RepoGridView({
        collection: this.repos
      });
  },
  subviews: {
    controls: {
      hook: 'repo-controls',
      prepareView: function(el) {
        return new RepoControlsView({
            el: el,
            parent: this,
            collection: this.repos
          });
      }
    }
  }
});
