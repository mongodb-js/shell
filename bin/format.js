#!/usr/bin/env node

var esformatter = require('esformatter'),
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require(__dirname + '/../package.json');

var argv = docopt(fs.readFileSync(__dirname + '/format.docopt', 'utf-8'), {version: pkg.version});

var src = argv['<src>'],
  contents = fs.readFileSync(src, 'utf-8'),
  res = esformatter.format(contents);

fs.writeFileSync(src, res);
