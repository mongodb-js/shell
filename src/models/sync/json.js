/**
 * For patching over `ampersand-sync` as it:
 *
 * - has some silly performance bugs
 * - not intuitive that it's syncing via a REST api
 * - can't do json stream parsing
 */
var _ = require('underscore'),
  JSONStream = require('JSONStream'),
  EJSON = require('mongodb-extended-json'),
  es = require('event-stream'),
  assert = require('assert'),
  debug = require('debug')('mongodb-js:models:sync:json'),
  createStringStream = require('./string-stream'),
  createSync = require('./xhr').use,
  collect = require('./collect-array-from-stream');

function collectInto(res, key) {
  return es.map(function collectValues(data, fn) {
    if (res[key] === undefined) {
      debug('collectInto: set %s', key, data);
      res[key] = data;
    } else if (_.isArray(res[key])) {
      res[key].push(data);
    } else {
      res[key] = [res[key]];
    }
    fn(null, data);
  });
}

var streaming_enabled = false;

function parseJsonResponse(body, options, done) {
  var req_id = options.req_id,
    model = options.model;

  if (!_.isString(body)) {
    debug('%d: parsing noop: body not a string', req_id);
    return process.nextTick(function() {
      done(null, body);
    });
  }

  var paths = _.result(model, 'json_paths');
  if (paths) {
    debug('%d: model supports streaming json, but disabled by feature flag', req_id);
  }
  if (!paths || !streaming_enabled) {
    debug('%d: json_paths not specified or streaming not enabled so using synchronous parser', req_id);
    return process.nextTick(function() {
      done(null, EJSON.parse(body));
    });
  }

  debug('%d: %d json_paths provided so using streaming parser', req_id, paths.length);

  assert(_.isArray(paths), 'json_paths must be an array');

  if (paths.length === 1 && paths[0] === '*') {
    return createStringStream(body)
      .pipe(JSONStream.parse('*'))
      .pipe(collect(done))
      .on('error', done);
  }
  var res = [],
    src = createStringStream(body),
    pending = paths.length,
    ender = function() {
      pending--;
      if (pending === 0) {
        return done(null, res);
      }
    };

  paths.map(function(path) {
    var key, pattern;
    if (_.isArray(path)) {
      key = path[1];
      pattern = path[0];
    } else {
      key = pattern = path;
    }

    debug('%d: parse %s -> %s', req_id, pattern, key);
    src.pipe(JSONStream.parse([pattern]))
      .pipe(collectInto(res, key))
      .on('end', ender);
  });
}

module.exports = createSync(parseJsonResponse);
