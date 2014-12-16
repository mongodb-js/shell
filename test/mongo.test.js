var assert = require('assert'),
  mongodb = require('../'),
  Mongo = mongodb.Mongo;


describe.skip('Mongo', function(){
  it('should have the basic interface', function(){
    var _mongo = new Mongo('localhost');
    _mongo.setSlaveOk();
    _mongo.setSlaveOk(false);
    _mongo.setSlaveOk(true);
    assert(_mongo.getSlaveOk());
  });
});
