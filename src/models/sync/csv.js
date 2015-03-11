var createSync = require('./xhr').use;

module.exports = createSync(function(body, options, done) {
  if (!body) return done(null, []);

  var lines = body.split('\n');
  lines.splice(lines.length - 1, 1);

  if (lines.length === 0) return done(null, []);

  process.nextTick(function() {
    var keys = lines.shift().split(',');
    var res = lines.map(function(line) {
      var cells = line.split(',');
      var doc = {};
      cells.forEach(function(cell, i) {
        doc[keys[i]] = cell;
      });
      return doc;
    });
    done(null, res);
  });
});
