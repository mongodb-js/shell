// Thesis: we can hoist all of the JS for kernel out of the kernel,
// clean it up and make it even more valuable and robust.
//
// `Cursor` and `Mongo` are mostly like binary add-on's: all of their
// functionality is in C++. Here we can just provide stubs, which is
// that strategy to make this work.
var assert = require('assert'),
  print = console.log;

assert.eq = assert.equal;

function Cursor(){}
Cursor.prototype.next = function(){};
Cursor.prototype.hasNext = function(){};
Cursor.prototype.objsLeftInBatch = function(){};
Cursor.prototype.readOnly = function(){};

// Constructor called by engine_v8.cpp and then sets the global `db` var
// using it.
// exec("_mongo = new Mongo();", "local connect 2", false, true, true, 0);
// exec((string)"db = _mongo.getDB(\"" + dbName + "\");", "local connect 3", false, true, true, 0);
function Mongo(host){
  this.host = host;
}

// native add-ons
Mongo.prototype.find = function(){
  return new Cursor();
};
Mongo.prototype.insert = function(){};
Mongo.prototype.remove = function(){};
Mongo.prototype.update = function(){};
Mongo.prototype.auth = function(){};
Mongo.prototype.logout = function(){};
Mongo.prototype.cursorFromId = function(){};

// oh c++ developers...
Mongo.prototype.getDB = function( name ){
  return new DB(this, name);
};

Mongo.prototype.setSlaveOk = function( value ) {
  if( value === undefined ) value = true;
  this.slaveOk = value;
};

Mongo.prototype.getSlaveOk = function() {
  return this.slaveOk || false;
};

Mongo.prototype.adminCommand = function( cmd ){
  return this.getDB("admin").runCommand(cmd);
};

Mongo.prototype.getReadPrefMode = function () {
    return this._readPrefMode;
};

Mongo.prototype.getReadPrefTagSet = function () {
    return this._readPrefTagSet;
};

function DB( mongo , name ){
  this._mongo = mongo;
  this._name = name;
}
DB.prototype.getMongo = function(){
  assert( this._mongo , "why no mongo!" );
  return this._mongo;
};

DB.prototype.setSlaveOk = function( value ) {
    if( value == undefined ) value = true;
    this._slaveOk = value;
}

DB.prototype.getSlaveOk = function() {
    if (this._slaveOk != undefined) return this._slaveOk;
    return this._mongo.getSlaveOk();
}

DB.prototype.getSisterDB = DB.prototype.getSiblingDB = function( name ){
  return this.getMongo().getDB( name );
};

DB.prototype.getName = function(){
  return this._name;
};

DB.prototype.stats = function(scale){
  return this.runCommand( { dbstats : 1 , scale : scale } );
};

DB.prototype.getCollection = function( name ){
  return new DBCollection( this._mongo , this , name , this._name + "." + name );
};

DB.prototype._dbCommand = DB.prototype.runCommand = function( obj ){
  if ( typeof( obj ) === "string" ){
    var n = {};
    n[obj] = 1;
    obj = n;
  }
  return this.getCollection( "$cmd" ).findOne( obj );
};

DB.prototype.adminCommand = function( obj ){
  if ( this._name === "admin" )
    return this.runCommand( obj );
  return this.getSiblingDB( "admin" ).runCommand( obj );
};

function DBCollection( mongo , db , shortName , fullName ){
  this._mongo = mongo;
  this._db = db;
  this._shortName = shortName;
  this._fullName = fullName;
  this.verify();
}

DBCollection.prototype.verify = function(){
  assert( this._fullName , "no fullName" );
  assert( this._shortName , "no shortName" );
  assert( this._db , "no db" );

  assert.eq( this._fullName , this._db._name + "." + this._shortName , "name mismatch" );

  assert( this._mongo , "no mongo in DBCollection" );
  assert( this.getMongo() , "no mongo from getMongo()" );
};

DBCollection.prototype.getName = function(){
  return this._shortName;
};

DBCollection.prototype.help = function () {
  var shortName = this.getName();
  print("DBCollection help");
  print("\tdb." + shortName + ".find().help() - show DBCursor help");
  print("\tdb." + shortName + ".count()");
  print("\tdb." + shortName + ".copyTo(newColl) - duplicates collection by copying all documents to newColl; no indexes are copied.");
};

DBCollection.prototype.getFullName = function(){
    return this._fullName;
}
DBCollection.prototype.getMongo = function(){
    return this._db.getMongo();
}
DBCollection.prototype.getDB = function(){
    return this._db;
}

DBCollection.prototype.find = function( query , fields , limit , skip, batchSize, options ){
  var cursor = new DBQuery( this._mongo , this._db , this ,
    this._fullName , this._massageObject( query ) , fields , limit ,
    skip , batchSize , options || this.getQueryOptions() );

  var connObj = this.getMongo();
  var readPrefMode = connObj.getReadPrefMode();
  if (readPrefMode != null) {
      cursor.readPref(readPrefMode, connObj.getReadPrefTagSet());
  }
  return cursor;
};

DBCollection.prototype.findOne = function( query , fields, options ){
    var cursor = this.find(query, fields, -1 /* limit */, 0 /* skip*/,
        0 /* batchSize */, options);

    if ( ! cursor.hasNext() )
        return null;
    var ret = cursor.next();
    if ( cursor.hasNext() ) throw "findOne has more than 1 result!";
    if ( ret.$err )
        throw "error " + tojson( ret );
    return ret;
};

DBCollection.prototype._massageObject = function( q ){
    if ( ! q )
        return {};

    var type = typeof q;

    if ( type == "function" )
        return { $where : q };

    if ( q.isObjectId )
        return { _id : q };

    if ( type == "object" )
        return q;

    if ( type == "string" ){
        if ( q.length == 24 )
            return { _id : q };

        return { $where : q };
    }
    throw "don't know how to massage : " + type;
};

DBCollection.prototype.setSlaveOk = function( value ) {
    if( value == undefined ) value = true;
    this._slaveOk = value;
};

DBCollection.prototype.getSlaveOk = function() {
    if (this._slaveOk != undefined) return this._slaveOk;
    return this._db.getSlaveOk();
};

DBCollection.prototype.getQueryOptions = function() {
    var options = 0;
    if (this.getSlaveOk()) options |= 4;
    return options;
};

function DBQuery( mongo , db , collection , ns , query , fields , limit , skip , batchSize , options ){
  this._mongo = mongo; // 0
  this._db = db; // 1
  this._collection = collection; // 2
  this._ns = ns; // 3

  this._query = query || {}; // 4
  this._fields = fields; // 5
  this._limit = limit || 0; // 6
  this._skip = skip || 0; // 7
  this._batchSize = batchSize || 0;
  this._options = options || 0;

  this._cursor = null;
  this._numReturned = 0;
  this._special = false;
  this._prettyShell = false;
}

DBQuery.prototype.hasNext = function(){
  this._exec();
  if ( this._limit > 0 && this._cursorSeen >= this._limit )
      return false;
  var o = this._cursor.hasNext();
  return o;
};

DBQuery.prototype._exec = function(){
  if ( ! this._cursor ){
    assert.eq( 0 , this._numReturned );
    this._cursor = this._mongo.find( this._ns , this._query , this._fields ,
      this._limit , this._skip , this._batchSize , this._options );
    this._cursorSeen = 0;
  }
  return this._cursor;
};




var _mongo = new Mongo();
_mongo.setSlaveOk();
_mongo.setSlaveOk(false);
_mongo.setSlaveOk(true);
assert(_mongo.getSlaveOk());

var db = _mongo.getDB('github');
console.log('test db', db);

assert(db.getMongo());
assert.equal(db.getName(), 'github');
assert(db.getSiblingDB('admin'));
assert(db.getSisterDB('admin'));

db.stats();
db.getCollection('users');
