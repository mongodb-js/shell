var debug = require('debug')('mongodbjs'),
  vm = require('vm'),
  fs = require('fs');

function run(code, context, filename, fn){
  debug('running', code, context, filename);
  var err, result, script;
  try {
    script = vm.createScript(code, {
      filename: filename,
      displayErrors: false
    });
  } catch (err) {
    debug('parse error %j', code, err);
    return fn(err);
  }

  try {
    result = script.runInContext(context);

    debug('Got result', result);
  }
  catch (err) {
    debug('execution error');
    console.error('Error', err.stack);

    if (err && process.domain) {
      debug('not recoverable, send to domain');
      process.domain.emit('error', err);
      process.domain.exit();
      return;
    }
  }

  fn(err, result);
}

module.exports = function(code, opts, fn){
  opts = opts || {};
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts.filename = opts.filename || '<main>';

  // var DB = require('./lib/db'),
  //   Mongo = require('./lib/mongo'),
  //   mongo = new Mongo();

  var ctx = vm.createContext({
    // db: new DB(mongo, 'test'),
    print: function(){
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift('<'+opts.filename+'>');
      console.log.apply(console, args);
    },
  });
  run(code, ctx, '<main>', fn);
};

module.exports.script = function(src, opts, fn){
  fs.readFile(src, 'utf-8', function(err, code){
    if(err) return fn(err);
    opts.filename = src;
    module.exports(code, opts, fn);
  });
};

process.__mongo__ = {
  find: function (ns, query, fields, limit, skip, batchSize, options){
    debug('find', ns, query, fields, limit, skip, batchSize, options);
    throw new Error('not implemented');
  },
  insert: function (ns, obj) {
    debug('insert', ns, obj);
    throw new Error('not implemented');
  },
  remove: function (ns, pattern) {
    debug('remove', ns, pattern);
    throw new Error('not implemented');
  },
  update: function (ns, query, obj, upsert) {
    debug('update', ns, query, obj, upsert);
    throw new Error('not implemented');
  },
};
