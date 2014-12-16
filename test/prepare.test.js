var mongodb = require('../'),
  assert = require('assert');

describe('Prepare', function(){
  it('es6 proxy hack for collection names', function(done){
    mongodb.prepare('db.runs.find()', function(err, _code){
      assert.ifError(err);
      assert.equal(_code, 'db.getCollection(\'runs\').find()');
      done();
    });
  });
});
