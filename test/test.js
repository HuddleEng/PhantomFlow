
var path = require('path');
var connect = require('connect');

var flow = require('../lib/phantomflow').init({
	earlyexit: true,
	createReport: true
});

if(process.argv[2] && process.argv[2] == 'report'){

	flow.report();
	
} else {

	connect(
		connect.static(__dirname) // Serve the system under test for this example
	).listen(9001);

	// flow.event.on('exit', function(){
	// 	process.exit(0);
	// });

	flow.run(function(){
		process.exit(0);
	});	
}