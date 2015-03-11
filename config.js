module.exports = {
  title: 'mongodb-js',
  org: 'mongodb-js',
  facetBy: ['language', 'category'],
  columns: {
    language: {
      type: 'string',
      name: 'Language'
    },
    stargazers_count: {
      type: 'string',
      icon: 'star'
    },
    category: {
      type: 'string',
      name: 'Category'
    },
    travis: {
      type: 'image',
      src: 'travis_badge_url',
      href: 'travis_url'
    },
  },
  category: function(repo) {
    // Dynamically assign a category to a repo
    if (repo.name === 'mongo') {
      return 'Database';
    }
    var d = repo.name + ' ' + repo.description;
    if (/driver/i.test(d)) {
      return 'Driver';
    }

    if (/docs/i.test(d)) {
      return 'Docs';
    }

    if (/bson/i.test(d)) {
      return 'BSON';
    }
    if (/hadoop/i.test(d)) {
      return 'Hadoop';
    }
    return 'n/a';
  },
  avatar_url: function(repo) {
    return 'https://robohash.org/' + repo._id + '.png';
  },
  language: function(repo, resp) {
    return resp.language;
  },
  homepage: function(repo) {
    if (repo.name === 'mongo') {
      return 'http://mongodb.com';
    }
  },
  travis_url: function(repo) {
    return 'https://travis-ci.org/' + repo._id;
  },
  travis_badge_url: function(repo) {
    return 'https://travis-ci.org/' + repo._id + '.svg';
  },
  npm_downloads_url: function(repo) {
    return 'https://img.shields.io/npm/dm/mongodb-' + repo.name + '.svg';
  }
};
