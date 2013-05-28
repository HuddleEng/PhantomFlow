
/*

This example demonstrates integration of PhantomFlow with PhantomCSS (https://github.com/Huddle/PhantomCSS)

Run from the command line: phantomjs demo/coffeeMachineVisualRegressionSuite/initialiser.js

*/

var home = './demo/coffeeMachineVisualRegressionSuite/';
var fs = require('fs');

phantom.casperPath = './libs/CasperJs/';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');
var casper = require('casper').create({viewportSize: {width: 1027, height: 800}});

var phantomFlow = require('./phantomFlow.js');
var flowPathName;

var css = require( home + '/libs/phantomcss.js');
var css_screenshot = css.screenshot;

var url = initPageOnServer(home + 'demo.html');

css.init({
	casper: casper,
	libraryRoot: home + 'libs/',
	screenshotRoot: home + 'screenshots/',
	failedComparisonsRoot: home + 'failures/',
	testRunnerUrl: url.emptyPage,
	fileNameGetter: fileNameGetter,
	addLabelToFailedImage: false
});

this.css = css;

phantomFlow.
	listen('step.begin', disableScreenshots).
	listen('step.end', enableScreenshots).
	listen('uniqueStep.begin', function(e){
		screenshot = undefined;
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
	scope: this,
	jsonFlowDataRoot: home
});

casper.start(url.emptyPage);

phantom.injectJs(home + 'coffeemachine.test.js');

casper.then(function(){
	css.compareAll();
});

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
	var file = root + flowPathName;

	casper.emit('phantomcss.screenshot', {path: '/screenshots/' + flowPathName+'.png'});

	if(!fs.isFile(file+'.png')){
		return file+'.png';
	} else {
		return file+'.diff.png';
	}
}