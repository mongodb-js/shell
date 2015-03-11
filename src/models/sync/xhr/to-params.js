var qs = require('qs'),
  _result = require('amp-result'),
  _defaults = require('amp-defaults'),
  debug = require('debug')('ampersand-sync-xhr:to-params');

// Throw an error when a URL is needed, and none is supplied.
var urlError = function() {
  throw new Error('A "url" property or function must be specified');
};

// Ensure that we have a URL.
function _url(model, options) {
  return options.url || _result(model, 'url') || urlError();
}

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var METHODS = {
  'create': 'POST',
  'update': 'PUT',
  'patch': 'PATCH',
  'delete': 'DELETE',
  'read': 'GET'
};

var WRITE_METHODS = ['create', 'update', 'patch'];


module.exports = function(method, model, options) {
  // Default options, unless specified.
  _defaults(options || (options = {}), {
    emulateHTTP: false,
    emulateJSON: false,
    timeout: 30000,
    headers: {},
    error: function(resp, type, message) {
      console.warn('REST Error: %s', message, resp);
    }
  });

  _defaults(options.headers, {
    Accept: 'application/json'
  });

  // Default request options.
  var params = {
    type: METHODS[method],
    method: METHODS[method],
    url: _url(model, options)
  };
  if (options.method) {
    options.method = METHODS[options.method];
  }

  // Ensure that we have the appropriate request data.
  if (options.data === null && model && WRITE_METHODS.indexOf(method) > -1) {
    params.json = options.attrs || model.toJSON(options);
  }

  // If passed a data param, we add it to the URL or body depending on request type
  if (options.data && params.type === 'GET') {
    // make sure we've got a '?'
    params.url += _.contains(params.url, '?') ? '&' : '?';
    params.url += qs.stringify(options.data);
  }

  // Start setting ajaxConfig options (headers, xhrFields).
  // var config = (_result(model, 'ajaxConfig') || {});
  // // Combine generated headers with user's headers.
  // if (config.headers) {
  //   _.extend(params.headers, config.headers);
  // }
  // //Set XDR for cross domain in IE8/9
  // if (config.useXDR) {
  //   params.useXDR = true;
  // }
  // // Set raw xhr options.
  // if (config.xhrFields) {
  //   var beforeSend = config.beforeSend;
  //   params.beforeSend = function(req) {
  //     for (var key in config.xhrFields) {
  //       req[key] = config.xhrFields[key];
  //     }
  //     if (beforeSend) return beforeSend.apply(this, arguments);
  //   };
  //   params.xhrFields = config.xhrFields;
  // }

  debug('params now', params);
  return params;
};
