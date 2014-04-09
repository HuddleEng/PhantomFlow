var flow = require('../lib/phantomflow').init({
	earlyexit: true
});

flow.event.on('exit', function(){
	console.log('Complete');
});

flow.run();
