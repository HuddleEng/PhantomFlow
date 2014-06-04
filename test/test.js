
var path = require('path');
var connect = require('connect');

var flow = require('../phantomflow').init({
	//earlyexit: true, // abort as soon as a test fails (also prevents report creation)
	//debug: 2,
	createReport: true,
	//test: 'coffee'
});

if(process.argv[2] && process.argv[2] == 'report'){

	flow.report();

} else {

	connect(
		connect.static(  path.join(__dirname, '..', 'ui_for_tests') ) // Serve the system under test for this example
	).listen(9001);

	// flow.event.on('exit', function(){
	// 	process.exit(0);
	// });

	flow.run(function(){
		process.exit(0);
	});	
}