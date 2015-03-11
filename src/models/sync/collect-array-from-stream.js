var es = require('event-stream');

module.exports = function(fn){
  var res = [];
  return es.through(function(data) {
    res.push(data);
    this.emit('data', data);
  }, function(){
    fn(null, res);
    this.emit('end');
  });
};
