var Stream = require('stream'),
  util = require('util');

function StringStream(init) {
  if(!(this instanceof StringStream)) return new StringStream(init);
  StringStream.super_.call(this);
  this._data = init || '';
}
util.inherits(StringStream, Stream.Readable);

StringStream.prototype._read = function(n) {
  var chunk;
  n = (n === null || n === -1) ? undefined : n;
  chunk = this._data.slice(0, n);
  this._data = this._data.slice(n);
  if (n >= this._data.length || n === -1) {
    this.push(null);
    return false;
  }
  this.push(chunk);
  return true;
};

module.exports = StringStream;
