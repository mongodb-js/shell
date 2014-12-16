var assert = require('assert'),
  mongodb = require('../');

describe.skip('DB', function(){
  // before(function(){
  //   process.mongo = new mongodb.Mongo('localhost');
  //   process.db = new mongodb.DB(process.mongo, 'github');
  // });
  it('should work', function(){
    var db = process.db;

    assert(db.getMongo());
    assert(db.getSiblingDB('admin'));
    assert(db.getSisterDB('admin'));
    assert.equal(db.getName(), 'github');
    assert(db.getCollection('users'));
    assert(db.stats());
  });
});
