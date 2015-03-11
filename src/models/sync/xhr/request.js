var xhr = require('xhr'),
  debug = require('debug')('ampersand-sync-xhr:request'),
  _extend = require('amp-extend');

module.exports = function _request(model, params, options, done) {
  var ajaxSettings = _extend(params, options);
  // Make the request. The callback executes functions that are compatible
  // with jQuery.ajax's syntax.
  debug('making request', ajaxSettings);
  var request = options.xhr = xhr(ajaxSettings, function(err, resp, body) {
    if (err) return done(err);
    done(null, body);
  });
  request.ajaxSettings = ajaxSettings;

  model.trigger('request', model, request, options, request.ajaxSettings);
  return request;
};
