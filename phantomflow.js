/*ignore jshint console*/

/*
 * phantomflow
 * Copyright (c) 2014 Huddle
 * Licensed under The MIT License (MIT).
 */
require('console.table');
var path = require( 'path' );
var util = require( 'util' );
var fs = require( 'fs' );
var _ = require( 'lodash' );
var colors = require( 'colors' );
var connect = require( 'connect' );
var open = require( 'open' );
var datauri = require( 'datauri' );
var eventEmitter = new( require( 'events' ).EventEmitter )();
var glob = require( "glob" );
var cp = require( 'child_process' );
var wrench = require( 'wrench' );
var async = require( 'async' );
var log = console.log;
var optionDebug;

var grunt_fatal_original;

module.exports = {};

module.exports.init = function ( options ) {

	var time = Date.now();

	var filterTests = options.test;

	var bootstrapPath = path.join( __dirname, 'lib' );

	var casperPath = getCasperPath();

	var createReport = options.createReport;

	var includes = path.resolve( options.includes || 'include' );
	var tests = path.resolve( options.tests || 'test' ) + '/';
	var testFileExtension = options.testFileExtension || '.test.js';
	var results = path.resolve( options.results || 'test-results' );
	var reports = path.resolve( options.reports || results + '/report/' );

	var remoteDebug = options.remoteDebug || false;
	var remoteDebugAutoStart = options.remoteDebugAutoStart || false;
	var remoteDebugPort = options.remoteDebugPort || 9000;

	var numProcesses = options.threads || 4;

	/*
	 Set to false if you do not want the tests to return on the first failure
	 */
	var earlyExit = typeof options.earlyexit === 'undefined' ? false : options.earlyexit;

	// Dashboard mode?
	var errorLog = console.error;
	var updateTableAndStats = _.noop;
	var dashboardDone = _.noop;
	if(options.dashboard){
		var dashboardLogger = require('./dashboard-logger');
		dashboardLogger.init();
		log = dashboardLogger.log;
		errorLog = dashboardLogger.error;
		updateTableAndStats = dashboardLogger.update;
		dashboardDone = dashboardLogger.finish;

		function handleException(e){
			errorLog('[PhantomFlow Error]\n' + e.toString() + ' ' + (e.stack ?  e.stack : ''));
		}

		if(options.grunt && options.grunt.fail){
			grunt_fatal_original = options.grunt.fail.fatal;
			options.grunt.fail.fatal = handleException
		} else {
			process.on('uncaughtException', handleException);
		}
	}

	var processIdleTimeout = _.isFinite(+options.processIdleTimeout) ? +options.processIdleTimeout : 0;

	var threadCompletionCount = 0;
	var fileGroups;

	var dontDoVisuals = options.skipVisualTests;
	var hideElements = options.hideElements || [];
	var mismatchTolerance = options.mismatchTolerance || '';
	var casperArgs = options.casperArgs || [];

	var args = [];

	var visualTestsPath = changeSlashes( tests + '/visuals/' );

	var dataPath = changeSlashes( results + '/data/' );
	var xUnitPath = changeSlashes( results + '/xunit/' );
	var debugPath = changeSlashes( results + '/debug/' );
	var reportPath = changeSlashes( reports );

	var visualResultsPath = changeSlashes( results + '/visuals/' );

	optionDebug = parseInt( options.debug, 10 ) < 3 ? parseInt( options.debug, 10 ) : void 0;

	if ( earlyExit ) {
		log( 'The earlyExit parameter is set to true, PhantomFlow will abort of the first failure. \n'.yellow );
		log( 'If a failure occurs, a report will not be generated. \n'.yellow );
	}

	return {
		event: eventEmitter,
		report: function report() {
			if ( showReport( reportPath, options.port || 9001, {
					src: visualTestsPath,
					res: visualResultsPath
				} ) ) {
				eventEmitter.emit( 'exit' );
			}
			return;
		},
		run: function ( done ) {

			var loggedErrors = [];
			var failCount = 0;
			var passCount = 0;
			var isFinished = false;
			var files;

			var exitCode = 1;

			glob.sync(
				visualResultsPath + '/**/*.fail.png, ' +
				xUnitPath + '/*.xml, ' +
				dataPath + '/**/*.js' )
				.forEach(
				function ( file ) {
					deleteFile( file ); // delete
				}
			);

			/*
			 Get the paths for all the tests
			 */
			files = _.filter(
				glob.sync( tests + '/**/*' + testFileExtension ),
				function ( file ) {
					return isFile( file );
				}
			).map( function ( file ) {
					return path.relative( tests, file );
				} );

			/*
			 Filter tests down to match specified string
			 */
			if ( filterTests ) {
				files = _.filter( files, function ( file ) {
					return file.toLowerCase().indexOf( filterTests.toLowerCase() ) !== -1;
				} );
			}

			/*
			 Stop if there are no tests
			 */
			var numTests = files.length;
			if ( numTests === 0 ) {
				eventEmitter.emit( 'exit' );
			}

			if ( numTests < numProcesses ) {
				numProcesses = numTests;
			}

			if ( optionDebug > 0 || remoteDebug ) {
				numProcesses = 1;
			}

			/*
			 Enable https://github.com/ariya/phantomjs/wiki/Troubleshootingremote-debugging
			 */
			if ( remoteDebug ) {
				args.push(
					'--remote-debugger-port=' + remoteDebugPort +
					( remoteDebugAutoStart ? ' --remote-debugger-autorun=yes' : '' ) );
			}

			/*
			 Setup arguments to be sent into PhantomJS
			 */

			args.push( changeSlashes( path.join( bootstrapPath, 'start.js' ) ) );
			args.push( '--flowincludes=' + changeSlashes( includes ) );
			args.push( '--flowtestsroot=' + changeSlashes( tests ) );
			args.push( '--flowphantomcssroot=' + changeSlashes(path.dirname(require.resolve( 'phantomcss' )) ));
			args.push( '--flowlibraryroot=' + changeSlashes( bootstrapPath ) );
			args.push( '--flowoutputroot=' + changeSlashes( dataPath ) );
			args.push( '--flowxunitoutputroot=' + changeSlashes( xUnitPath ) );
			args.push( '--flowvisualdebugroot=' + changeSlashes( debugPath ) );
			args.push( '--flowvisualstestroot=' + changeSlashes( visualTestsPath ) );
			args.push( '--flowvisualsoutputroot=' + changeSlashes( visualResultsPath ) );

			if ( optionDebug !== void 0 ) {
				args.push( '--flowdebug=' + optionDebug );
			}

			if ( optionDebug === 2 ) {
				earlyExit = false;
			}

			if ( dontDoVisuals ) {
				args.push( '--novisuals=' + dontDoVisuals );
			}

			if ( hideElements ) {
				args.push( '--hideelements=' + hideElements.join( ',' ) );
			}

			if (mismatchTolerance) {
				args.push('--mismatchTolerance=' + mismatchTolerance);
			}

			if ( casperArgs ) {
				args = args.concat( casperArgs );
			}

			if ( filterTests ) {
				deleteFolderRecursive( reportPath );
				_.forEach( files, function( file ){
					deleteFolderRecursive( dataPath + file );
					deleteFolderRecursive( debugPath + file );
					deleteFolderRecursive( visualResultsPath + file );
				});
			}
			else {
				deleteFolderRecursive ( results );
			}

			log( 'Parallelising ' + numTests + ' test files on ' + numProcesses + ' processes.\n' );
			if(processIdleTimeout && !remoteDebug){
				log( 'Processes that are idle for more than ' + processIdleTimeout + 'ms will be terminated.\n' );
			}
			var testStatuses = {};
			_.forEach(files, function(file){
				testStatuses[file] = {testStatus: 'PENDING', numPasses: 0, numFails: 0};
			});
			var children = [];

			var childrenGraveyard = [];

			updateTableAndStats(testStatuses, passCount, failCount, 0, 0, numTests);
			function pickUpJob(){
				var fileIndex = files.length;
				if( !fileIndex || children.length >= numProcesses){
					return;
				}

				var file = files.pop();

				log('Picking up job: '.green + file);
				var child = cp.spawn(
					changeSlashes( casperPath ),
					args.slice( 0 ).concat( [ '--flowtests=' + changeSlashes( file ) ] ), {
						stdio: false
					}
				);

				child.hasErrored = false;
				child.dead = false;
				child.startedTime = new Date().getTime();
				child.endTime = Infinity;
				child.lastOutputTime = child.startedTime;
				child.logsWritten = false;
				child.exitCode = null;
				child.testFile = file;
				child.failFileName = 'error_' + fileIndex + '.log';
				child.fileIndex = fileIndex;
				child.logPrefix = '[' + child.testFile + '] ';
				child.stdoutStr = '';
				child.numFails = 0;
				child.numPasses = 0;
				children.push(child);

				testStatuses[child.testFile] = child;
				child.testStatus = 'RUNNING';

				function onChildExit ( code ) {
					child.dead = true;
					child.exitCode = code;
					child.endTime = new Date().getTime();

					if(child.logsWritten) return;
					child.logsWritten = true;

					if ( code !== 0 ) {
						log(child.logPrefix + ( 'It broke, sorry. Process aborted. Non-zero code (' + code + ') returned.' ).red );
						errorLog(child.logPrefix + ( 'It broke, sorry. Process aborted. Non-zero code (' + code + ') returned.\n' ).red );
						writeLog( results, child.failFileName, child.stdoutStr, log );
						child.testStatus = 'FAIL';
						return;
					}

					child.testStatus = child.numFails > 0 ? 'FAIL' : 'SUCCESS';
					var processCompletedMessage = 'process has completed in '+ ((child.endTime - child.startedTime) / 1000) +'s\n';
					log( '\n' + child.logPrefix + processCompletedMessage.yellow );
				}

				child.on( 'close', onChildExit);
				child.on( 'exit', onChildExit);
				child.on( 'disconnect', onChildExit);

				child.stdout.on( 'data', function ( buf ) {
					var timeNow = new Date().getTime();
					var lineDuration = timeNow - child.lastOutputTime;
					child.lastOutputTime = timeNow;

					var bufstr = String( buf );

					if ( /^execvp\(\)/.test( buf ) ) {
						log( child.logPrefix + 'Failed to start CasperJS' );
						errorLog( child.logPrefix + '\n  Failed to start CasperJS\n' );
					}

					if ( /Error:/.test( bufstr ) ) {
						child.hasErrored = true;
					}

					var firstLine = true;
					bufstr.split( /\n/g ).forEach( function ( line ) {
							lineDuration = firstLine ? lineDuration : 0;
							firstLine = false;

						line = child.logPrefix + '(' + lineDuration + 'ms) ' + line;

						if ( /FAIL|\[PhantomCSS\] Screenshot capture failed/.test( line ) ) {
							log( line.bold.red );
							errorLog(child.logPrefix + '\n' + line.bold.red);
							child.numFails++;

							loggedErrors.push( {
								file: child.testFile,
								msg: line
							} );

							failCount++;

							if ( earlyExit === true ) {
								writeLog( results, child.failFileName, child.stdoutStr, log );
								child.kill();
							}

						} else if ( /PASS/.test( line ) ) {
							passCount++;
							child.numPasses++;
							log( line.green );
						} else if ( /DEBUG/.test( line ) ) {
							log( ( '\n' + line.replace( /DEBUG/, '' ) + '\n' ).yellow );
						} else if ( child.hasErrored ) {
							log( line.bold.red );
							errorLog(child.logPrefix + '\n  '+line.bold.red +'\n');
							if ( earlyExit === true ) {
								writeLog( results, child.failFileName, child.stdoutStr, log );
								child.kill();
							}
						} else if ( numProcesses === 1 && optionDebug > 0 ) {
							log( line.white );
						}

						child.stdoutStr += line;
					} );
				} );

			}

			if ( remoteDebug ) {
				log( "Remote debugging is enabled.  Web Inspector interface will show shortly.".bold.green );
				log( "Please use ctrl+c to escape\n".bold.green );
				log( "https://github.com/ariya/phantomjs/wiki/Troubleshooting#remote-debugging\n".underline.bold.grey );

				if ( !remoteDebugAutoStart ) {
					log( "Click 'about:blank' to see the PhantomJS Inspector." );
					log( "To start, enter the '__run()' command in the Web Inspector Console.\n" );
				}

				setTimeout( function () {
					//log(("If Safari or Chrome is not your default browser, please open http://localhost:"+remoteDebugPort+" in a compatible browser.\n").bold.yellow);
					open( 'http://localhost:' + remoteDebugPort, "chrome" );
				}, 3000 );
			}

			async.until(
				function () {
					var timeNow = new Date().getTime();
					var allDead = true;
					var someDead = false;
					var testsDone = files.length === 0;
					var logMessage = '';

					var deadChildren = [];
					children.forEach(function (child) {
						var idleTime = Math.abs(timeNow - child.lastOutputTime);
						logMessage += (child.dead ? 'DEAD'.red : 'ALIVE'.green) + ' (' + Math.ceil(idleTime/1000) + 's)\t';
						if (processIdleTimeout && !child.dead && idleTime > processIdleTimeout) {
							log('[PID '+child.pid+'] ' + 'The process has been idle for more than ' + processIdleTimeout + 'ms.');
							errorLog(child.logPrefix + '\n  The process has been idle for more than ' + processIdleTimeout + 'ms.\n');
							if(!remoteDebug){
								child.dead = true;
								child.kill();
							}
						}

						if( child.dead ) {
							deadChildren.push(child);
						}

						allDead = allDead && child.dead;
						someDead = someDead || child.dead;
					});

					children = _.difference(children, deadChildren); // remove dead children
					childrenGraveyard = childrenGraveyard.concat(deadChildren);

					var numSuccessChildren = 0;
					var numFailedChildren = 0;
					childrenGraveyard.forEach(function (child) {
						if(child.exitCode === 0 && child.numFails === 0){
							numSuccessChildren++;
						} else {
							numFailedChildren++;
						}
					});

					pickUpJob();
					updateTableAndStats(testStatuses, passCount, failCount, numSuccessChildren, numFailedChildren, numTests);


					//log(logMessage);

					// wait until all children dead or early exit and some have died.
					return (earlyExit && someDead) || (testsDone && allDead);
				},
				function ( callback ) {
					setTimeout( callback, 100 );
				},
				function () {
					// restore grunt fatal
					if(options.grunt && options.grunt.fail && options.grunt.fail.fatal && grunt_fatal_original){
						options.grunt.fail.fatal = grunt_fatal_original;
					}
					dashboardDone();

					if(options.dashboard){
						// keep process alive
						process.stdin.resume();
						dashboardDone();
						return;
					}

					var allZero = true;
					var exitCodesOutputString = '';
					var graveyardTable = [];
					childrenGraveyard.forEach(function (child) {
						exitCodesOutputString +=  child.logPrefix + (child.exitCode === 0 ? '[exit code 0]'.green : ('[exit code ' + child.exitCode + ']').red) + '\t' + (child.numPasses + " passes").green + '\t' + (child.numFails + " fails").red + '\tin ' + ((child.endTime - child.startedTime) / 1000) + 's\n';
						graveyardTable.push({
							'Test name': child.logPrefix,
							'Exit code': child.exitCode,
							'Passed assertions': child.numPasses + " passes",
							'Failed assertions': child.numFails + " fails",
							'Process time /s': ((child.endTime - child.startedTime) / 1000) + 's'
						});
						allZero = allZero && child.exitCode === 0;
					});

					if(allZero){
						console.log( '\n All the threads have completed (all process exit codes 0). \n'.grey );
					} else {
						console.log('\nSome processes exited with errors:\n'.red);
					}

					console.table(graveyardTable);

					loggedErrors.forEach( function ( error ) {
						console.log( error.msg.bold.red );
					} );

					console.log(
						( 'Completed ' + ( failCount + passCount ) + ' assertions in ' + Math.round( ( Date.now() - time ) / 1000 ) + ' seconds. ' ) +
						( failCount + ' assertions failed, ' ).bold.red +
						( passCount + ' assertions passed. ' ).bold.green );



					if (allZero && failCount === 0 ) {
						exitCode = 0;
					}

					if ( createReport ) {

						mergedData = concatData( dataPath, visualTestsPath, visualResultsPath );

						copyReportTemplate(
							mergedData,
							reportPath,
							createReport
						);
					}


					if ( done ) {
						done( exitCode, { passCount: passCount, failCount: failCount, loggedErrors: loggedErrors });
					}
				}
			);

		}
	};
};

function concatData( dataPath, imagePath, imageResultPath ) {
	// do concatination and transform here to allow parallelisation in PhantomFlow

	var data = {};
	var stringifiedData;

	glob.sync( dataPath + '/**/*.json' ).forEach(
		function ( file ) {
			var json = readJSON( file );
			var filename = file.replace( dataPath, '' ).replace( '.json', '' );

			if ( data[ filename ] && data[ filename ].children && json && json.children ) {
				data[ filename ].children = data[ filename ].children.concat( json.children );
			} else {
				data[ filename ] = json;
			}
		}
	);

	stringifiedData = JSON.stringify( data, function ( k, v ) {
		return dataTransform( k, v, imagePath, imageResultPath );
	}, 2 );

	return stringifiedData;
}

function copyReportTemplate( data, dir, templateName ) {

	templateName = typeof templateName == 'string' ? templateName : 'Dendrogram';

	var templates = path.join( __dirname, 'report_templates' );
	var template = path.join( templates, templateName );
	var datafilename = path.join( dir, 'data.js' );

	if ( isDir( template ) ) {

		wrench.copyDirSyncRecursive( template, dir, {
			forceDelete: true
		} );

		if ( isFile( datafilename ) ) {
			deleteFile( datafilename );
		}
		fs.writeFileSync( datafilename, data );
	}
}

function getImageResultDiffFromSrc( src ) {
	return src.replace( /.png$/, '.diff.png' );
}

function getImageResultFailureFromSrc( src ) {
	return src.replace( /.png$/, '.fail.png' );
}

function dataTransform( key, value, imagePath, imageResultPath ) {
	var obj, ori, latest, fail, img;
	if ( key === 'screenshot' ) {

		img = changeSlashes( value );
		ori = path.join( imageResultPath, img );

		if ( isFile( ori ) ) {

			latest = getImageResultDiffFromSrc( ori );
			fail = getImageResultFailureFromSrc( ori );

			obj = {
				original: datauri( ori ),
				src: img
			};

			if ( isFile( fail ) ) {
				obj.failure = datauri( fail );
				if ( isFile( latest ) ) {
					obj.latest = datauri( latest );
				}
			}

			return obj;
		} else {
			if ( optionDebug > 0 ) {
				log( ( "Expected file does not exist! " + value ).grey );
			}
			return null;
		}
	}

	return value;
}

function showReport( dir, port, paths ) {
	if ( isDir( dir ) ) {
		log( "Please use ctrl+c to escape".bold.green );
		var server = connect( connect.static( dir ) );

		server.use( '/rebase', reqHandler( paths ) ).listen( port );

		open( 'http://localhost:' + port );
		return false;
	} else {
		log( "A report hasn't been generated.  Maybe you haven't set the createReport option?".bold.yellow );
		return true;
	}
}

function reqHandler( paths ) {
	return function ( req, res, next ) {
		if ( req.method === 'POST' ) {
			req.on( 'data', function ( chunk ) {
				var image = decodeURIComponent( chunk.toString().split( "img=" ).pop() ).replace( /\+/g, ' ' );
				var origImage;
				var resImage;

				if ( image ) {
					origImage = changeSlashes( paths.src + image );
					resImage = changeSlashes( paths.res + getImageResultDiffFromSrc( image ) );

					if ( isFile( origImage ) && isFile( resImage ) ) {
						log( ( 'Rebasing... ' + origImage ).bold.yellow );
						deleteFile( origImage );
						moveFile( resImage, origImage );
					}
				}

			} );
			res.writeHead( 202, {
				'Content-Type': 'text/plain',
				'Content-Length': 0
			} );
			res.end();
		} else if ( req.method === 'GET' ) {
			res.writeHead( 202, {
				'Content-Type': 'text/plain',
				'Content-Length': 0
			} );
			log( ( 'UI can make POST for image rebase' ).bold.yellow );
			res.end();
		} else {
			next();
		}
	};
}

function moveFile( oldPath, newPath ) {
	fs.renameSync( oldPath, newPath );
}

function changeSlashes( str ) {
	return path.normalize( str ).replace( /\\/g, '/' );
}

function writeLog( resultsDir, filename, log, logger ) {
	var path = resultsDir + '/log/';

	if ( !isDir( path ) ) {
		fs.mkdir( path, function () {
			writeLogFile( path + filename, log, logger );
		} );
	} else {
		writeLogFile( path + filename, log, logger );
	}
}

function writeLogFile( path, log, logger ) {
	fs.writeFile( path, log, function () {
		logger( ( " Please take a look at the error log for more info '" + path + "'" ).bold.yellow );
	} );
}

function deleteFolderRecursive( path ) {
	var files = [];

	if ( isDir( path ) ) {
		files = fs.readdirSync( path );
		files.forEach( function ( file, index ) {
			var curPath = path + "/" + file;
			if ( isDir( curPath ) ) {
				deleteFolderRecursive( curPath );
			} else {
				deleteFile( curPath );
			}
		} );
		try {
			fs.rmdirSync( path );
		} catch ( e ) {
			log( ( 'Could not remove ' + path + ' is there a file lock?' ).bold.red );
		}
	}
}

function isFile( path ) {
	if ( fs.existsSync( path ) ) {
		return fs.lstatSync( path ).isFile();
	} else {
		return false;
	}
}

function isDir( path ) {
	if ( fs.existsSync( path ) ) {
		return fs.lstatSync( path ).isDirectory();
	} else {
		return false;
	}
}

function readJSON( file ) {
	return JSON.parse( fs.readFileSync( file ) );
}

function deleteFile( file ) {
	fs.unlinkSync( file );
}

function getCasperPath() {
	var nodeModules = path.resolve( __dirname, 'node_modules', 'phantomcss', 'node_modules' );
	var isWindows = /^win/.test( process.platform );
	var casperEndPath = path.join('casperjs', 'bin', 'casperjs' + ( isWindows? ".exe" : "" ));
	var casperPath;

	var phantomIsRelative = resolvePhantomJS(nodeModules);

	try {
		casperPath =  require.resolve( casperEndPath );
	} catch (e) {

		if(phantomIsRelative){
			casperPath = path.resolve( __dirname, '..', casperEndPath);
		} else {
			casperPath = path.resolve( nodeModules, casperEndPath);
		}

		try {
			stats = fs.lstatSync(casperPath);
		}
		catch (e) {
			casperPath = path.resolve( __dirname, 'node_modules', casperEndPath);
		}
	}

	if ( !fs.existsSync( casperPath ) ) {
		log( "CasperJS is not installed? Try `npm install`".bold.red );
	}

	return casperPath;
}

function resolvePhantomJS(nodeModules){
	var phantomjsPath;

	try {
		phantomjsPath = require.resolve('phantomjs-prebuilt' );

	} catch(e){
		phantomjsPath = path.resolve( nodeModules, 'phantomjs-prebuilt' );
		try {
			fs.lstatSync(phantomjsPath);
		}
		catch (e) {
			phantomjsPath = 'phantomjs-prebuilt';
			return true; // is relative path
		}
	}

	var phantom = require(phantomjsPath);

	if ( fs.existsSync( phantom.path ) ) {
		process.env[ "PHANTOMJS_EXECUTABLE" ] = phantom.path;
	} else {
		log( "PhantomJS is not installed? Try `npm install`".bold.red );
	}

	return false;
}