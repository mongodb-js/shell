var mongodb = require('../'),
  assert = require('assert');

describe('Run', function(){
  it('should run hello', function(done){
    mongodb.script(__dirname + "/fixtures/hello.js", function(err){
      assert.ifError(err);
      done();
    });
  });
  it('should run the simple foundation', function(done){
    mongodb.script(__dirname + "/fixtures/simple.js", function(err){
      assert.ifError(err);
      done();
    });
  });
  it('@todo: need to do es6 proxy hack for collection dot access.  should run a real test script', function(done){
    mongodb.script(__dirname + "/fixtures/jstests-all.js", function(err){
      assert.ifError(err);
      done();
    });
  });
});
