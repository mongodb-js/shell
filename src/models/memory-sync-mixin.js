// Replaces mongodb-dyno-fixture.
var _result = require('amp-result');

module.exports = function(method, model, options) {
  model.trigger('request', model, {}, options, {});
  var data = _result(this, 'data');
  options.success(data, 'success');
};
