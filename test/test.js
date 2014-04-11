
var path = require('path');
var connect = require('connect');

connect(
	connect.static(__dirname)
).listen(9001);

var flow = require('../lib/phantomflow').init({
	earlyexit: true
});

// flow.event.on('exit', function(){
// 	process.exit(0);
// });

flow.run(function(){
	process.exit(0);
});