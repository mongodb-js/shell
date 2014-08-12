var assert = require('assert'),
  runtime = require('../').runtime;

assert(runtime.print, 'Missing print');
assert(runtime.load, 'Missing load');
assert(runtime.gc, 'Missing gc');
assert(runtime.MinKey, 'Missing MinKey');
assert(runtime.MaxKey, 'Missing MaxKey');
assert(runtime.Mongo, 'Missing Mongo');
assert(runtime.NumberInt, 'Missing NumberInt');
assert(runtime.NumberLong, 'Missing NumberLong');
assert(runtime.ObjectId, 'Missing ObjectId');
assert(runtime.DBPointer, 'Missing DBPointer');
assert(runtime.UUID, 'Missing UUID');
assert(runtime.BinData, 'Missing BinData');
assert(runtime.HexData, 'Missing HexData');
assert(runtime.MD5, 'Missing MD5');
assert(runtime.Map, 'Missing Map');
assert(runtime.Timestamp, 'Missing Timestamp');
assert(runtime.JSON, 'Missing JSON');
