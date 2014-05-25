// Thesis: we can hoist all of the JS for kernel out of the kernel,
// clean it up and make it even more valuable and robust.
//
// `Cursor` and `Mongo` are mostly like binary add-on's: all of their
// functionality is in C++. Here we can just provide stubs, which is
// that strategy to make this work.
var assert = require('assert'),
  util = require('util');

var co = require('co');

co(function *(){
assert.eq = assert.equal;
// @see `mongo/db/dbmessage.cpp`
function Message() {
}
function Batch() {
  this.message = new Message();
  this.nReturned = undefined;
  this.pos = undefined;
  this.data = undefined;
}
// @type {Message}
Batch.prototype.m = {};
// @type {Number}
Batch.prototype.nReturned = -1;
// @type {Number}
Batch.prototype.pos = -1;
// @type {Buffer}
Batch.prototype.data = null;
// A stub of the cursor mongo provides via c++.
// At the end of the day, this logic actually lives in `client/dbclientcursor.cpp`.
function ClientCursor(ns, query, nToReturn, nToSkip, fieldsToReturn, queryOptions) {
  this.ns = ns;
  this.query = query;
  this.nToReturn = nToReturn;
  this.nToSkip = nToSkip;
  this.fieldsToReturn = fieldsToReturn;
  this.queryOptions = queryOptions;
}
// @type {String}
ClientCursor.prototype.ns = undefined;
// @type {Object}
ClientCursor.prototype.query = undefined;
// @type {Number}
ClientCursor.prototype.nToReturn = undefined;
// @type {Number}
ClientCursor.prototype.nToSkip = undefined;
// @type {Object}
ClientCursor.prototype.fieldsToReturn = undefined;
// @type {Object}
ClientCursor.prototype.queryOptions = undefined;
// @type {Number}
ClientCursor.prototype.cursorId = -1;
// @type {Object}
ClientCursor.prototype.batch = {};
// stack< BSONObj > _putBack;
ClientCursor.prototype._putBack = [];
ClientCursor.prototype.next = function (fn) {
  process.nextTick(function () {
    fn(null, {});
  });
};
// If true, safe to call next().  Requests more from server if necessary.
ClientCursor.prototype.more = function (fn) {
  console.log('cursor:more');
  this.requestMore(function (err) {
    if (err)
      return fn(err);
    fn(null, false);
  });
};
// Oh hey!  we found some networking!
ClientCursor.prototype.requestMore = function (fn) {
  console.log('cursor:requestMore');
  process.nextTick(function () {
    fn(null, {});
  });
};
ClientCursor.prototype.hasNext = function () {
  console.log('cursor:hasNext');
  return true;
};
ClientCursor.prototype.objsLeftInBatch = function () {
  return 0;
};
// restore an object previously returned by next() to the cursor.
// @return {void}
// @api private
ClientCursor.prototype.putBack = function () {
};
// @return {Boolean}
// @api private
ClientCursor.prototype.moreInCurrentBatch = function () {
  return this.objsLeftInBatch() > 0;
};
ClientCursor.prototype.readOnly = function () {
};

function MockCursor(){}
util.inherits(MockCursor, ClientCursor);
MockCursor.prototype.use = function(n, data){
  var self = this;
  return function(fn){
    process.nextTick(function(){
      self.consumed = false;

      self.objsLeftInBatch = function(){
        return self.consumed ? 0 : n;
      };

      self.hasNext = function(){
        return function(fn){
          return fn(null, self.consumed ? false : true);
        };
      };

      self.next = function(){
        return function(fn){
          if(!self.consumed){
            self.consumed = true;
            return fn(null, data);
          }
          fn(new Error('DBClientCursor next() called but more() is false'));
        };
      };

      self.toJSON = function(){
        return {consumed: self.consumed};
      };
      fn(null, self);
    });
  };
};

// And that's it for cpp land.  From here on out we're in JS land and in
// order to do any of the above, we'll have to cross the process boundary
// so we should consider all of those operations asynchronous!
// By doing this, we can then use any backend we like:
//
// - wire protocol in node
// - REST calls
// - the usual process bindinds in the shell
//
// Constructor called by engine_v8.cpp and then sets the global `db` var using it.
function Mongo(host) {
  this.host = host;
}

var colStatsData = {
  "ns" : "github.users",
  "count" : 29,
  "size" : 2160,
  "avgObjSize" : 74,
  "storageSize" : 8192,
  "numExtents" : 1,
  "nindexes" : 1,
  "lastExtentSize" : 8192,
  "paddingFactor" : 1,
  "systemFlags" : 1,
  "userFlags" : 1,
  "totalIndexSize" : 8176,
  "indexSizes" : {
    "_id_" : 8176
  },
  "ok" : 1
};

Mongo.prototype.find = function(ns, query, fields, limit, skip, batchSize, options) {
  console.log('mongo:find', ns, query, fields, limit, skip, batchSize, options);
  // If in the shell we run
  // ```
  // db.getMongo().getDB('github').getCollection('users').stats();
  // ```
  //
  // `Mongo.prototype.find` gets the args:
  // ```
  // github.$cmd { collstats: 'users', scale: undefined } undefined -1 0 0 4
  // ```
  // So we can just run this directly:
  // ```
  // db.getMongo().find('github.$cmd', { collstats: 'users', scale: undefined }, undefined, -1, 0, 0, 4)
  // ```
  //
  // Which gives us the `ClientCursor` instance:
  // ```
  // {
  //   "next" : function next() { [native code] },
  //   "hasNext" : function hasNext() { [native code] },
  //   "objsLeftInBatch" : function objsLeftInBatch() { [native code] },
  //   "readOnly" : function readOnly() { [native code] }
  // }
  // ```
  // `cur.readOnly()` is a setter only operation that returns:
  // ```
  // {
  //   "_ro" : true,
  //   "next" : function next() { [native code] },
  //   "hasNext" : function hasNext() { [native code] },
  //   "objsLeftInBatch" : function objsLeftInBatch() { [native code] },
  //   "readOnly" : function readOnly() { [native code] }
  // }
  // > cur.objsLeftInBatch()
  // 1
  // > cur.hasNext()
  // true
  // > cur.next()
  // {
  //   "ns" : "github.users",
  //   "count" : 29,
  //   "size" : 2160,
  //   "avgObjSize" : 74,
  //   "storageSize" : 8192,
  //   "numExtents" : 1,
  //   "nindexes" : 1,
  //   "lastExtentSize" : 8192,
  //   "paddingFactor" : 1,
  //   "systemFlags" : 1,
  //   "userFlags" : 1,
  //   "totalIndexSize" : 8176,
  //   "indexSizes" : {
  //     "_id_" : 8176
  //   },
  //   "ok" : 1
  // }
  // ```
  return function(fn){
    // process.nextTick(function(){
      new MockCursor().use(1, colStatsData)(function(err, ghColStatsCursor){
        console.log('made cursor', ghColStatsCursor);
        fn(null, ghColStatsCursor);
      });
    // });
  };
};
/* jshint ignore:start */
Mongo.prototype.insert = function (ns, obj) {
  throw new Error('insert not implemented');
};
Mongo.prototype.remove = function (ns, pattern) {
  throw new Error('remove not implemented');
};
Mongo.prototype.update = function (ns, query, obj, upsert) {
  throw new Error('update not implemented');
};
Mongo.prototype.auth = function (db, user, password) {
  throw new Error('auth not implemented');
};
Mongo.prototype.logout = function (db) {
  throw new Error('logout not implemented');
};
Mongo.prototype.cursorFromId = function (ns, cursorId, batchSize) {
  throw new Error('cursorFromId not implemented');
};
/* jshint ignore:end */
Mongo.prototype.getDB = function (name) {
  return new DB(this, name);
};
function DB(mongo, name) {
  this._mongo = mongo;
  this._name = name;
}
DB.prototype.getMongo = function () {
  return this._mongo;
};
DB.prototype.getSisterDB = DB.prototype.getSiblingDB = function (name) {
  return this.getMongo().getDB(name);
};
DB.prototype.getName = function () {
  return this._name;
};
DB.prototype.stats = function (scale) {
  var self = this;
  console.log('db.stats called');
  return co(function* (){
    return yield self.runCommand({
      dbstats: 1,
      scale: scale
    });
  })();
};
DB.prototype.getCollection = function (name) {
  return new DBCollection(this._mongo, this, name, this._name + '.' + name);
};
DB.prototype._dbCommand = DB.prototype.runCommand = function (obj) {
  if (typeof obj === 'string') {
    var n = {};
    n[obj] = 1;
    obj = n;
  }
  var self = this;
  return function(fn){
    co(function* (){
      console.log('db.runCommand ->', obj);
      var res = yield self.getCollection('$cmd').findOne(obj);
      console.log('db.runCommand -> ', 'got res', res);
      fn(null, res);
    })();
  };
};
DB.prototype.adminCommand = function (obj) {
  if (this._name === 'admin')
    return this.runCommand(obj);
  return this.getSiblingDB('admin').runCommand(obj);
};
function DBCollection(mongo, db, shortName, fullName) {
  this._mongo = mongo;
  this._db = db;
  this._shortName = shortName;
  this._fullName = fullName;
}
DBCollection.prototype.getName = function () {
  return this._shortName;
};
DBCollection.prototype.help = function () {
  var shortName = this.getName();
  console.log('DBCollection help');
  console.log('\tdb.' + shortName + '.find().help() - show DBCursor help');
  console.log('\tdb.' + shortName + '.count()');
  console.log('\tdb.' + shortName + '.copyTo(newColl) - duplicates collection by copying all documents to newColl; no indexes are copied.');
};
DBCollection.prototype.getFullName = function () {
  return this._fullName;
};
DBCollection.prototype.getMongo = function () {
  return this._db.getMongo();
};
DBCollection.prototype.getDB = function () {
  return this._db;
};
DBCollection.prototype.find = function (query, fields, limit, skip, batchSize, options) {
  var self = this;

  var cursor = new DBQuery(self._mongo, self._db, self, self._fullName, self._massageObject(query), fields, limit, skip, batchSize, options || self.getQueryOptions());
  return cursor;
};
DBCollection.prototype.findOne = function (query, fields, options) {
  var self = this;
  return function(fn){
    co(function* (){
      console.log('findOne ->', 'get cursor');
      var cursor = self.find(query, fields, -1, 0, 0, options);
      console.log('findOne ->', 'got cursor', cursor.toJSON());
      var hasNext = yield cursor.hasNext();
      if (!hasNext){
        console.log('findOne ->', 'cursor does not have next');
        return null;
      }
      var ret = yield cursor.next();
      console.log('findOne ->', 'returning!', ret);
      // if (cursor.hasNext())
      //   throw new Error('findOne has more than 1 result!');
      // if (ret.$err)
      //   throw new Error(JSON.stringify(ret));
      fn(null, ret);
    })();
  };
};
DBCollection.prototype._massageObject = function (q) {
  if (!q)
    return {};
  var type = typeof q;
  if (type === 'function')
    return { $where: q };
  if (q.isObjectId)
    return { _id: q };
  if (type === 'object')
    return q;
  if (type === 'string') {
    if (q.length === 24)
      return { _id: q };
    return { $where: q };
  }
  throw 'don\'t know how to massage : ' + type;
};
DBCollection.prototype.getQueryOptions = function () {
  var options = 0;
  options |= 4;
  return options;
};
DBCollection.prototype.stats = function (scale) {
  console.log('DBCollection.stats called');
  var self = this;
  return function(fn){
    self._db.runCommand({
      collstats: this._shortName,
      scale: scale
    })(fn);
  };
};
function DBQuery(mongo, db, collection, ns, query, fields, limit, skip, batchSize, options) {
  this._mongo = mongo;
  this._db = db;
  this._collection = collection;
  this._ns = ns;
  this._query = query || {};
  this._fields = fields;
  this._limit = limit || 0;
  this._skip = skip || 0;
  this._batchSize = batchSize || 0;
  this._options = options || 0;
  this._cursor = null;
  this._numReturned = 0;
  this._special = false;
  this._prettyShell = false;
}
DBQuery.prototype.hasNext = function () {
  var self = this;
  return function(fn){
    self._exec()(function(err){
      if(err) return fn(err);
      if (self._limit > 0 && self._cursorSeen >= self._limit){
        console.log('dbquery hasNext -> false');
        return fn(null, function(){return false;});
      }
      self._cursor.hasNext()(function(err, o){
        console.log('dbquery cursor hasNext -> ', o);
        return fn(null, function(){return o;});
      });
    });
  };
};
DBQuery.prototype._exec = function () {
  var self = this;
  return function(fn){
    console.log('_exec called');
    if (self._cursor){
      console.log('already have cursor');
      return fn(null, self._cursor);
    }

    assert.eq(0, self._numReturned);
    console.log('calling _mongo.find');
    self._mongo.find(self._ns, self._query, self._fields, self._limit, self._skip, self._batchSize, self._options)(function(err, cur){
      console.log('got new cursor', cur);
      self._cursor = cur;
      self._cursorSeen = 0;
      return fn(err, self._cursor);
    });
  };
};

DBQuery.prototype.next = function () {
  var self = this;
  return function(fn){
    self._exec()(function(err){
      if(err) return fn(err);

      self._cursor.hasNext()(function(err, o){
        if(err) return fn(err);

        if(!o) return fn(new Error('error hasNext: ' + o));
        self._cursorSeen++;

        self._cursor.next()(function(err, ret){
          if(err) return fn(err);
          if (ret.$err) return fn(new Error('error: ' + JSON.stringify(ret)));
          self._numReturned++;
          return fn(null, ret);
        });
      });
    });
  };
};

DBQuery.prototype.toJSON = function () {
  return this;
};

var _mongo = new Mongo();
var db = _mongo.getDB('github');
assert.deepEqual(yield db.getCollection('users').stats(), colStatsData);
})();
