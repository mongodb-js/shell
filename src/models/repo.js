var AmpersandState = require('ampersand-state');
var numeral = require('numeral');
var moment = require('moment');
var StateConfig = require('../config').Repo;

module.exports = AmpersandState.extend(StateConfig, {
  props: {
    _id: 'string', // username / reponame
    name: 'string',
    github_url: 'string',
    description: 'string',
    last_commit_at: 'date',
    last_activity_at: 'date',
    created_at: 'date',
    open_issues_count: 'number',
    stargazers_count: 'number',
    size: 'number'
  },
  derived: {
    last_activity_at_string: {
      deps: ['last_activity_at'],
      fn: function() {
        return moment(this.last_activity_at).fromNow();
      }
    },
    last_commit_at_string: {
      deps: ['last_commit_at'],
      fn: function() {
        return moment(this.last_commit_at).fromNow();
      }
    },
    created_at_string: {
      deps: ['created_at'],
      fn: function() {
        return moment(this.created_at).fromNow();
      }
    },
    open_issues: {
      deps: ['open_issues_count'],
      fn: function() {
        return numeral(this.open_issues_count).format('0,0');
      }
    },
    stargazers: {
      deps: ['stargazers_count'],
      fn: function() {
        return numeral(this.stargazers_count).format('0,0');
      }
    },
  },
  url: function() {
    return 'https://api.github.com/repos/' + this._id;
  },
  parse: function(d) {
    var repo = {
      _id: d.full_name,
      name: d.name.toLowerCase(),
      github_url: d.html_url,
      description: d.description || 'missing',
      language: d.language,
      last_commit_at: new Date(d.pushed_at),
      last_activity_at: new Date(d.updated_at),
      created_at: new Date(d.created_at),
      size: d.size,
      open_issues_count: d.open_issues_count,
      stargazers_count: d.stargazers_count
    };
    if (repo.language === 'JavaScript') {
      repo.language = 'JS';
    }
    this.parseExtra(repo, d);
    return repo;
  },
  _read: function(opts, fn) {
    async.parallel({
      github: xhr.bind(this, {
        url: 'https://api.github.com/repos/' + this._id
      }),
      npm_stats: '',
    }, function(err, result) {
        if (err) return fn(err);
        console.log('repo _read result', result);
        fn(null, result);
      });
  },
  sync: function(method, model, options) {
    var done = xhr.errback(method, model, options);
    this._read(options, done);
  }
});
