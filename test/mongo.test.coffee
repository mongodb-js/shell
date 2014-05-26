assert = require 'assert'
mongodb = require '../'
Mongo = mongodb.Mongo


describe 'Mongo', ->
  it 'should have the basic interface', ->
    _mongo = new Mongo 'localhost'
    _mongo.setSlaveOk();
    _mongo.setSlaveOk(false);
    _mongo.setSlaveOk(true);
    assert(_mongo.getSlaveOk());
