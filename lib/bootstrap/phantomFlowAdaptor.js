/* global phantom, require, casper, phantomCSS, phantomFlow, treeOutputRoot, visualDebugRoot, visualTestsRoot */

(function(){

	var fs = require('fs');
	var flowReportDir = treeOutputRoot || [fs.workingDirectory, 'flowReport'].join('/');

	var capture = phantomCSS.screenshot;

	var screenshotFolder = visualTestsRoot;
	var screenshotPath;

	phantomFlow.init({
		casper: casper,
		scope: global // add flow/step/decision/chance methods to global scope
	});

	var currentFlowName;
	var currentFilename;

	casper.on('test.source', function(e){
		currentFilename = e.name;
		phantomFlow.updateJsonRoot( [flowReportDir,currentFilename].join('/') );
	});

	phantomFlow.
		listen('flow.begin', function(e){
			currentFlowName = safe(e.name);
			casper.emit('test.context', {name: currentFlowName });
		}).
		listen('flow.end', function(e){
			casper.emit('test.context.complete', {name: currentFlowName });
		}).
		listen('step.begin', disableAsserts).
		listen('step.end', enableAsserts).
		listen('uniqueStep.begin', function(e){
			screenshotPath = void 0;
			var pathName = e.decisions.map(function(i){return safe(i);}).join('/') + '/' + safe(e.name);
			pathName = pathName.replace( currentFlowName + '/', '' );

			enableAsserts();
			casper.emit('test.step', {name: pathName });
		}).
		listen('uniqueStep.end', function(e){
			var pathName = e.decisions.map(function(i){return safe(i);}).join('/') + '/' + safe(e.name);
			pathName = pathName.replace( currentFlowName + '/', '' );

			e.node.screenshot = screenshotPath;
			casper.then(function(){debug(pathName);});
			casper.emit('test.step.complete', {name: pathName });
		});

	casper.on('phantomcss.screenshot', function(e){
		screenshotPath = e.path;
	});

	function safe(str){
		return str.replace(/[^\w|\s]/g, "").replace(/[\|]/g, "");
	}

	function debug(name){ // debug screenshots do not currently consider branches/decisons
		var debugDir;
		var pathName;
		if(global.debug >= 2){

			debugDir =  ( visualDebugRoot ) + currentFilename;

			if ( !fs.isDirectory( debugDir ) ){
				fs.makeDirectory( debugDir );
			}

			pathName = debugDir + '/' + name+'.png';

			console.log('Capturing Screenshot for debugging @ ' + pathName);
			casper.page.render(pathName);
		}
	}

	function disableAsserts(){
		phantomCSS.screenshot = function(){};
	}

	function enableAsserts(){
		phantomCSS.screenshot = capture;
	}

}());