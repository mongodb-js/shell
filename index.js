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

var dbMethods = new RegExp('db\\.(?!' + Object.keys(require('./lib/db').prototype).join('|') + ').+\\(?', 'g');

module.exports = function(code, opts, fn){
  opts = opts || {};
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts.filename = opts.filename || '<main>';
  var ctx = vm.createContext(require('./lib')('localhost:27017', 'test'));
  module.exports.prepare(code, function(err, _code){
    run(_code, ctx, '<main>', fn);
  });
};

module.exports.prepare = function(code, fn){
  var safeCode = code.replace(dbMethods, function(prefix, offset, string){
    return string.replace(/db\.([a-zA-Z0-9\_]+)/, 'db.getCollection(\'$1\')');
  });
  // @todo: insert yields...
  // @todo: parse and transform with regenerator
  // console.log('safe code', safeCode);
  fn(null, safeCode);
};

module.exports.script = function(src, opts, fn){
  fs.readFile(src, 'utf-8', function(err, code){
    if(err) return fn(err);
    opts.filename = src;
    module.exports(code, opts, fn);
  });
};

module.exports.createContext = require('./lib');
