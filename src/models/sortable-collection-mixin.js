var _result = require('amp-result');

module.exports = {
  DESCENDING: -1,
  ASCENDING: 1,
  comparator: function(model) {
    var key = _result(this, 'sort_key') || this._id,
      direction = _result(this, 'sort_direction') || -1,
      val = model[key];
    return val * direction;
  }
};
