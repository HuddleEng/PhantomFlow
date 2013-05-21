var fs = require('fs');

// CasperJS library
phantom.casperPath = './libs/CasperJs';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');
phantom.injectJs('jquery.js');

// Populate global variables
var casper = require('casper').create({
	viewportSize: {width: 1027, height: 800}
});

var css = require('./libs/phantomcss.js');
var phantomFlow = require('./phantomFlow.js');

var css_screenshot = css.screenshot;

var url = initPageOnServer('demo/demo.html');

var flowPathName;

css.init({
	casper: casper,
	libraryRoot: './libs/',
	screenshotRoot: './screenshots',
	failedComparisonsRoot: './failures',
	testRunnerUrl: url.emptyPage,
	fileNameGetter: fileNameGetter
});

this.css = css;

phantomFlow.
	listen('step.begin', disableScreenshots).
	listen('step.end', enableScreenshots).
	listen('uniqueStep.begin', function(e){
		screenshot = void 0;
		enableScreenshots();
		flowPathName = e.pathAsString;
	}).
	listen('uniqueStep.end', function(e){
		// extend node data with screenshot
		e.node.screenshot = screenshot;
	});

casper.on('phantomcss.screenshot', function(e){
	screenshot = e.path;
});

phantomFlow.init({
	casper: casper,
	scope: this
});

casper.start(url.emptyPage);

phantom.injectJs('./demo/coffeemachine.js');

casper.
run(function() {
	console.log('\n');
	casper.test.done();
	console.log('\nFini.');
	casper.test.renderResults(true, 0);
});

function disableScreenshots(){
	css.screenshot = function(){};
}
function enableScreenshots(){
	css.screenshot = css_screenshot;
}

function initPageOnServer(path){
	var server = require('webserver').create();
	var fs = require("fs");
	var html = fs.read(path);
	
	var service = server.listen(1337, function(request, response) {
		response.statusCode = 200;
		
		if(request.url.indexOf('empty') != -1){
			response.write('<html><body>This blank page is used for processing the images with HTML5 magics</body></html>');
		} else {
			response.write(html);
		}

		response.close();
	});

	return {
		testPage: 'http://localhost:1337',
		emptyPage: 'http://localhost:1337/empty'
	};
}

function fileNameGetter(root, fileName){
	var file = root + '/' + flowPathName;

	//casper.emit('phantomcss.screenshot', {path:origFile.replace(screenshotRoot,'')});

	if(!fs.isFile(file+'.png')){
		return file+'.png';
	} else {
		return file+'.diff.png';
	}
}