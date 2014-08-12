mongodb = require '../'

describe 'Run', ->
  it 'should run hello', (done) ->
    mongodb.script "#{__dirname}/fixtures/hello.js", (err, res) ->
      return done(err) if err?
      console.log 'result', res
      done()

  it 'should run the simple foundation', (done) ->
    mongodb.script "#{__dirname}/fixtures/simple.js", (err, res) ->
      return done(err) if err?
      console.log 'result', res
      done()

  it.skip 'should run a real test script', (done) ->
    mongodb.script "#{__dirname}/fixtures/jstests-all.js", (err, res) ->
      return done(err) if err?
      console.log 'result', res
      done()


