var scope = require('mongoscope-client');

module.exports = function(hostport, db){
  // var mongoscope = scope({seed: hostport});
  var mongoscope = {
    mongo: {
      find: function *(ns, query, fields, limit, skip, batchSize, options) {
        throw new Error('Mock backend');
      },
      insert: function *(ns, obj) {
        throw new Error('Mock backend');
      },
      remove: function *(ns, pattern) {
        throw new Error('Mock backend');
      },
      update: function *(ns, query, obj, upsert) {
        throw new Error('Mock backend');
      },
      auth: function *(db, user, password) {
        throw new Error('Mock backend');
      },
      logout: function *(db) {
        throw new Error('Mock backend');
      },
      cursorFromId: function *(ns, cursorId, batchSize) {
        throw new Error('Mock backend');
      }
    }
  }

  var runtime = {};
  runtime.DBCollection = require('./collection');
  runtime.DB = require('./db');
  runtime.Mongo = require('./mongo');
  runtime.DBQuery = require('./query');
  runtime.DBCommandCursor = require('./query').DBCommandCursor;

  var types = require('./types');
  Object.keys(types).map(function(k){
    runtime[k] = types[k];
  });

  runtime.mongo = new runtime.Mongo(hostport);
  runtime.db = new runtime.DB(runtime.mongo, db);

  // Use mongoscope as the transport.
  runtime.mongo.find = function *(ns, query, fields, limit, skip, batchSize, options) {
    return yield mongoscope.mongo.find(ns, query, fields, limit, skip, batchSize, options);
  };

  runtime.mongo.insert = function *(ns, obj) {
    return yield mongoscope.mongo.insert(ns, obj);
  };
  runtime.mongo.remove = function *(ns, pattern) {
    return yield mongoscope.mongo.remove(ns, pattern);
  };
  runtime.mongo.update = function *(ns, query, obj, upsert) {
    return yield mongoscope.mongo.update(ns, query, obj, upsert);
  };
  runtime.mongo.auth = function *(db, user, password) {
    return yield mongoscope.mongo.auth(db, user, password);
  };
  runtime.mongo.logout = function *(db) {
    return yield mongoscope.mongo.logout(db);
  };
  runtime.mongo.cursorFromId = function *(ns, cursorId, batchSize) {
    return yield mongoscope.mongo.cursorFromId(ns, cursorId, batchSize);
  };

  return runtime;
};
