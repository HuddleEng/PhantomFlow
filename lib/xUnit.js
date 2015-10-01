/* global phantom, require, casper, xUnitOutputRoot*/

(function(){

	var fs = require('fs');

	var _when = '';
	var _describe = '';
	var _suite = '';

	var report = {};
	var figures = {};

	casper.on('test.source', function( suite ){
		_suite = suite.name;

		if(!_suite){
			casper.log('XUNIT: Suite does not exist');
			return;
		}

		report[_suite] = {};
		figures[_suite] = {};
	});

	casper.on('test.context', function( describe ){
		_describe = describe.name;

		if( !report[_suite] ){
			casper.log('XUNIT: Suite does not exist for Describe ('+_describe+')');
			return;
		}

		report[_suite][_describe] = {};
		figures[_suite][_describe] = {
			tests: 0,
			failures:0
		};
	});

	casper.on('test.step', function( given ){
		_when = given.name || 'given';

		if( !(report[_suite] && report[_suite][_describe]) ){
			casper.log('XUNIT: Describe does not exist for When ('+_when+')');
			return;
		}

		report[_suite][_describe][_when] = [];
	});

	casper.on('test.report', function( event ){
		_when = event.when;
		_describe = event.describe;
		_suite = event.suite;

		if(!report[_suite]){
			report[_suite] = {};
			figures[_suite] = {};
		}

		if(!report[_suite][_describe]){
			report[_suite][_describe] = {};
			figures[_suite][_describe] = {
				tests: 0,
				failures:0
			};
		}

		if(!report[_suite][_describe][_when]){
			report[_suite][_describe][_when] = [];
		}
	});

	casper.test.on('success', function(test){

		if( !(report[_suite] && report[_suite][_describe] && report[_suite][_describe][_when]) ){
			casper.log('XUNIT: Context does not exist for test ('+test.message+')');
			return;
		}

		report[_suite][_describe][_when].push({type: 'pass', msg: test.message});
		figures[_suite][_describe].tests += 1;
	});

	casper.test.on('fail', function(test){

		if( !(report[_suite] && report[_suite][_describe] && report[_suite][_describe][_when]) ){
			casper.log('XUNIT: Context does not exist for test ('+test.message+')');
			return;
		}

		report[_suite][_describe][_when].push({type: 'fail', msg: test.message, reason: test.standard});
		figures[_suite][_describe].tests += 1;
		figures[_suite][_describe].failures += 1;
	});

	casper.on('run.complete', function(){

		var suite;
		var describe;
		var when;
		var xmlReport = '';
		var count;
		var directory = xUnitOutputRoot; // set in start.js
		var numberOfWrittenFiles = 0;

		//fs.write('_report/result.json', JSON.stringify(report), 'w');

		if ( !fs.isDirectory(directory) ){
			fs.makeDirectory(directory);
		}

		for (suite in report){

			count = 0;

			for (describe in report[suite]){
				xmlReport += '<testsuite name="['+makeXmlSafe(suite)+'] '+makeXmlSafe(describe)+'" tests="'+figures[suite][describe].tests+'" failures="'+figures[suite][describe].failures+'">\n';

				for (when in report[suite][describe]){

					report[suite][describe][when].forEach(function(test){
						xmlReport +='  <testcase classname="'+makeXmlSafe(when)+'" name="'+ makeXmlSafe(test.msg)+'">';
						if(test.type === 'fail'){
							xmlReport += '\n    <failure type="fail">'+makeXmlSafe(test.reason)+'</failure>\n  ';
						}
						xmlReport += '</testcase>\n';
					});

				}
				xmlReport += '</testsuite>';

				if(shouldWrite(xmlReport, suite)){
					fs.write(directory + suite.split('/').pop()+'.' + (count++) + '.xml', xmlReport, 'w');
					numberOfWrittenFiles++;
				}
				xmlReport = '';
			}
		}

		var filesList = filterFiles(directory);
		if(waitSeconds(function(){return filesList.length === numberOfWrittenFiles;},10000)){
			console.log('XUNIT: '+numberOfWrittenFiles+' reports have been written to ' + directory);
		} else {
			casper.warn('XUNIT: '+filesList.length+' reports have been found in '+directory+', expected '+numberOfWrittenFiles +'.');
		}

	});

	function filterFiles(directory){
		var i=0;
		var list = fs.list(directory);
		var len = list.length;
		var realFiles = [];
		var file;
		for(;i<list.length;i++){
			file = list[i];
			if( !(fs.isDirectory(file) || fs.isLink(file)) ){
				realFiles.push(file);
			}
		}
		return realFiles;
	}

	function waitSeconds(conditionFn, ms) {
		var counter= 0;
		var start = new Date().getTime();
		var end = 0;
		while ( !conditionFn() && (counter < ms)) {
			end = new Date().getTime();
			counter = end - start;
		}
		return conditionFn();
	}

	function makeXmlSafe(str){
		return (str || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}

	function shouldWrite(xml, name){
		var isXml = false;
		if(!/testcase/.test(xml)){
			console.log(xml);
			console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
			console.log('JUnit output: No test cases for ' + name);
			console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
			return false;
		}

		try {
			isXml = new XMLSerializer().serializeToString(new DOMParser().parseFromString(xml, 'text/xml')).indexOf('parsererror') === -1;
		} catch (e){
			isXml = false;
		}

		if(!isXml){
			console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
			console.log('JUnit output: Invalid XML report for ' + name);
			console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
			return false;
		}
		return true;
	}

}());
