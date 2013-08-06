
/*

This example demonstrates integration of PhantomFlow with PhantomCSS (https://github.com/Huddle/PhantomCSS)

Run from the command line: phantomjs demo/initialiser.js

*/

var home = './demo/';
var fs = require('fs');

phantom.casperPath = './libs/CasperJs/';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');
var casper = require('casper').create({viewportSize: {width: 1027, height: 800}});

var phantomFlow = require('./phantomFlow.js');
var flowPathName;
var screenshotPath;

var css = require( './libs/phantomcss.js');
var css_screenshot = css.screenshot;

var url = initPageOnServer(home + 'coffeemachine.html');

css.init({
	casper: casper,
	libraryRoot: './libs/',
	screenshotRoot: home + 'screenshots/',
	fileNameGetter: fileNameGetter,
	addLabelToFailedImage: false
});

this.css = css;

phantomFlow.init({
	casper: casper,
	scope: this,
	dataRoot: home + 'data/'
});

phantomFlow.
	listen('step.begin', disableScreenshots).
	listen('step.end', enableScreenshots).
	listen('uniqueStep.begin', function(e){
		screenshotPath = undefined;
		enableScreenshots();
		flowPathName = e.pathAsString;
	}).
	listen('uniqueStep.end', function(e){
		// extend node data with screenshot
		e.node.screenshot = screenshotPath;
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

function fileNameGetter(root, fileName){
	var file = root + flowPathName;

	screenshotPath = './screenshots/' + flowPathName+'.png';

	if(!fs.isFile(file+'.png')){
		return file+'.png';
	} else {
		return file+'.diff.png';
	}
}

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