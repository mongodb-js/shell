module.exports = {
  DBCollection: require('./lib/collection'),
  DB: require('./lib/db'),
  Mongo: require('./lib/mongo'),
  DBQuery: require('./lib/query'),
  DBCommandCursor: require('./lib/query').DBCommandCursor,
};

var debug = require('debug')('mongodbjs');

process.__mongo__ = {
  find: function (ns, query, fields, limit, skip, batchSize, options){
    debug('find', ns, query, fields, limit, skip, batchSize, options);
    throw new Error('not implemented');
  },
  insert: function (ns, obj) {
    debug('insert', ns, obj);
    throw new Error('not implemented');
  },
  remove: function (ns, pattern) {
    debug('remove', ns, pattern);
    throw new Error('not implemented');
  },
  update: function (ns, query, obj, upsert) {
    debug('update', ns, query, obj, upsert);
    throw new Error('not implemented');
  },
};
