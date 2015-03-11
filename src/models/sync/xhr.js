var _ = require('underscore'),
  xhr = require('xhr'),
  qs = require('qs'),
  debug = require('debug')('mongodb-js:models:xhr:sync'),
  toParams = require('./xhr/to-params'),
  request = require('./xhr/request');

module.exports = function(options, fn) {
  var model = options.model || {},
    method = options.method || 'GET',
    parse = options.parse || createJSONParser(method, model, options),
    params = toParams(method, model, options);

  request(model, params, options, function(err, body) {
    if (err) return fn(err);

    parse(body, {
      model: model
    }, fn);
  });
};

var createJSONParser = function(method, model, options) {
  return function(body, opts, fn) {
    process.nextTick(function() {
      fn(null, JSON.parse(body));
    });
  };
};

module.exports.errback = function(method, model, options) {
  return function(err, res) {
    if (err) {
      options.err = err;
      return options.error('', 'error', err.message);
    }

    options.success(res, 'success');
  };
};

/**
 * @param {Function} parse Takes `(req_id, model, body, done)`
 */
module.exports.use = function(parse) {
  return function(method, model, options) {
    options.parse = parse;
    options.model = model;
    options.method = method;

    module.exports(options, module.exports.errback(method, model, options));
  };
};

