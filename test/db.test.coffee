assert = require 'assert'
mongodb = require '../'

describe 'DB', ->
  before ->
    process.mongo = new mongodb.Mongo 'localhost'
    process.db = new mongodb.DB process.mongo, 'github'

  it 'should work', ->
    db = process.db

    assert db.getMongo()
    assert db.getSiblingDB('admin')
    assert db.getSisterDB('admin')
    assert.equal db.getName(), 'github'
    assert db.getCollection('users')

    assert db.stats()
