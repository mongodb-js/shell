#!/usr/bin/env node

var esformatter = require('esformatter'),
  spawn = require('child_process').spaw,
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require(__dirname + '/../package.json'),
  glob = require('glob');

var argv = docopt(fs.readFileSync(__dirname + '/format.docopt', 'utf-8'), {version: pkg.version});

glob(argv['<src>'], function (err, files) {
  files.map(function(src){
    var contents = fs.readFileSync(src, 'utf-8'),
      res = esformatter.format(contents);
    fs.writeFileSync(src, res);
    spawn('./node_modules/.bin/jsfmt -w ' + src);
  });
});
