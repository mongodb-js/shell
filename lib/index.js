var runtime = {};

module.exports.DBCollection = require('./collection');
module.exports.DB = require('./db');
module.exports.Mongo = require('./mongo');
module.exports.DBQuery = require('./query');
module.exports.DBCommandCursor = require('./query').DBCommandCursor;

var types = require('./types');
Object.keys(types).map(function(k){
  module.exports[k] = types[k];
});

module.exports.mongo = new module.exports.Mongo('localhost');
module.exports.db = new module.exports.DB(module.exports.mongo, 'test');
