
var path = require('path');
var connect = require('connect');

var showReport;
var filterTest;
var debugMode;

process.argv.forEach(function(arg, i){
	if(arg === 'report'){
		showReport = true;
	}
	if(/^debug/.test(arg)){
		debugMode = true;
	}
	if(/^test=/.test(arg)){
		filterTest = arg.split('=')[1];
	}
});

var flow = require('../phantomflow').init({
	//earlyexit: true, // abort as soon as a test fails (also prevents report creation)
	debug: debugMode ? 2 : undefined,
	createReport: true,
	test: filterTest
});

if(showReport){

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