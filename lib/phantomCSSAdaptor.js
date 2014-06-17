/* global phantom, require, casper, phantomCSS, phantomFlow, visualTestsRoot */

(function(){
	
	var fs = require('fs');
	var currentWhen;
	var currentDescribe;
	var currentFilename;
	var count = 0; // because you might want to take multiple captures per each 'when'

	casper.on('test.source', function(e){
		if(!e.name){
			console.log('PhantomCSS: Suite name does not exist');
			return;
		}
		currentFilename = e.name;
	});

	casper.on('test.context', function(e){
		if(!e.name){
			console.log('PhantomCSS: Describe name does not exist');
			return;
		}
		currentDescribe = e.name;
	});

	casper.on('test.step', function(e){
		if(!e.name){
			console.log('PhantomCSS: When name does not exist');
			return;
		}
		currentWhen = e.name;
		count = 0; // reset capture count
	});

	phantomCSS.init({
		libraryRoot: phantomCSSRoot,
		hideElements: 'img, select',
		screenshotRoot: visualTestsRoot,
		comparisonResultRoot: visualResultsRoot,
		fileNameGetter: fileNameGetter,
		addLabelToFailedImage: false,
		onComplete: onComplete,
		failedComparisonsRoot: false,
		onPass: function(){},
		onFail: function(){},
		onTimeout: function(){}
	});

	phantomCSS.temporarilyEnableImages = function (callback){
		casper.
		then(function(){
			casper.evaluate(function(s){ $('img').css('visibility', 'visible'); });
			phantomCSS.update({hideElements:null});
			callback();
		}).
		then(function(){
			phantomCSS.update({hideElements:'img,select'});
		});
	};

	function fileNameGetter(root, fileName){
		var diffDir, origFile, diffFile;

		var increment = count ? '.'+count : '';
		diffDir =  root + '/' + currentFilename + '/' + currentDescribe;
		origFile =  diffDir + '/' + currentWhen + increment +'.png';
		diffFile =  diffDir + '/' + currentWhen + increment +'.diff.png';
	
		if ( !fs.isDirectory(diffDir) ){
			fs.makeDirectory(diffDir);
		}

		casper.emit('phantomcss.screenshot', {path:origFile.replace(visualTestsRoot,'')});

		if(!fs.isFile(origFile)){
			casper.test.info("return origfile");
			casper.test.info("New screenshot created for " + currentWhen);
			return origFile;
		} else {
			casper.test.info("return diffile");
			return diffFile.replace(/\/\//g, '/');
		}
	}

	function onComplete(all){
		console.log('DEBUG There are ' + all.length + ' visual tests to check\n');

		all.forEach(function(test){

			var dir = test.filename.replace(visualTestsRoot, '').split('/');
			var when = dir.pop().split('.').shift();
			var describe = dir.pop();
			dir = dir.join('/');
			
			casper.emit('test.report',{
				suite: dir + '.phantomcss',
				describe: describe,
				when: when
			});

			if(test.fail){
				console.log('DEBUG PhantomCSS Detected visual mismatch of ' + test.mismatch + '%');
				casper.test.fail('PhantomCSS ' + test.filename );
			} else if(test.error){
				console.log('');
				casper.test.fail('PhantomCSS Error, diff without original? ' + test.filename);
			} else {
				console.log('');
				casper.test.pass('PhantomCSS ' + test.filename);
			}

		});
	}

}());