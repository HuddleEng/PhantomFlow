/* global phantom, require */

var fs = require( 'fs' );
var shouldAbort = true;

/*
	Parse parameters
*/

var casper = require( 'casper' ).create( {
	verbose: false,
	logLevel: 'debug',
	onStepTimeout: function _onStepTimeout(timeout, stepNum) {
		this.warn("Maximum step execution timeout exceeded for step " + stepNum);
	},
	onTimeout: function _onTimeout(timeout) {
		this.warn("Script timeout of " + timeout + "ms reached, exiting.");
	},
	onWaitTimeout: function _onWaitTimeout(timeout) {
		this.warn("Wait timeout of " + timeout + "ms expired, exiting.");
	},
	waitTimeout: 10000
} );

var debug = Number( casper.cli.get( 'flowdebug' ) ) || 0; //0|1|2

var includes = casper.cli.get( 'flowincludes' ) || "";
var testRoot = casper.cli.get( 'flowtestsroot' ) || "";
var libraryRoot = casper.cli.get( 'flowlibraryroot' ) || "";
var phantomCSSRoot = casper.cli.get( 'flowphantomcssroot' ) || "";
var files = casper.cli.get( 'flowtests' ) || "";
var novisuals = casper.cli.get( 'novisuals' );
var hideElements = casper.cli.get('hideelements');
var mismatchTolerance = casper.cli.get('mismatchTolerance');

var treeOutputRoot = casper.cli.get( 'flowoutputroot' ); // see phantomFlowAdaptor
var xUnitOutputRoot = casper.cli.get( 'flowxunitoutputroot' ); // see xUnit.js

var visualDebugRoot = casper.cli.get( 'flowvisualdebugroot' ); // see phantomFlowAdaptor

var visualTestsRoot = casper.cli.get( 'flowvisualstestroot' ); // see phantomCSSAdaptor
var visualResultsRoot = casper.cli.get( 'flowvisualsoutputroot' ); // see phantomCSSAdaptor

var emptyPage = pathJoin( [ libraryRoot, 'empty.html' ] );

/*
	Setup CasperJS
*/

casper.options.pageSettings = {
	loadImages: true, // Must be true for PhantomCSS to work
	loadPlugins: false,
	XSSAuditingEnabled: true,
	localToRemoteUrlAccessEnabled: true
};

casper.on( 'page.error', function( msg, trace ) {
    this.echo( 'FAIL Page JS Error: ' + JSON.stringify( msg ), 'ERROR');
});

if( debug >= 1 ) {
    casper.on( 'remote.message', function( msg ) {
        this.echo( 'Log: ' + JSON.stringify( msg ) );
    });

    casper.on( 'resource.error', function( resourceError ){
       this.echo( 'Resource Error: ' + JSON.stringify( resourceError, null, 2 ), 'ERROR');
    });

    casper.on( 'url.changed', function( newUrl ){
        this.echo( 'URL Changed:' + JSON.stringify( newUrl ) );
    });
}

/*
	Include core dependencies
*/

console.log( pathJoin( [ libraryRoot, 'phantomFlow.js' ] ) );

var phantomCSS = require( pathJoin( [ phantomCSSRoot, 'phantomcss.js' ] ) );
var phantomFlow = require( pathJoin( [ libraryRoot, 'phantomFlow.js' ] ) );

phantom.injectJs( pathJoin( [ libraryRoot, 'phantomCSSAdaptor.js' ] ) );
phantom.injectJs( pathJoin( [ libraryRoot, 'phantomFlowAdaptor.js' ] ) );
phantom.injectJs( pathJoin( [ libraryRoot, 'xUnit.js' ] ) );

/*
	Include custom dependencies
*/

findIncludes( includes );

/*
	Start Casper
*/

casper.start( /* 'http://localhost:9001/empty.html' */); // start before all else

casper.thenOpen( emptyPage );


/*
	Inject tests
*/

if ( files ) {
	injectTests( files );
} else {
	//findTests( testRoot );
	console.log( 'FAIL there are no tests to run!' );
}


casper.then( function () {

	console.log( 'TESTFILE', 'PhantomCSS' );
	casper.emit( 'test.source', {
		name: 'PhantomCSS'
	} );

	shouldAbort = false;

	if ( !novisuals ) {
		phantomCSS.compareSession();
	}

} );

/*
	Run the tests
*/

casper.
run( function () {
	console.log( '\n' );
	console.log( '\nFini.' );
	phantom.exit( 0 );
} );


/*
	Helper methods
*/

function associateFileNameWithTest( path ) {
	casper.then( function () {
		console.log( 'TESTFILE', path );
		casper.emit( 'test.source', {
			name: path
		} );
	} );
}

function correctSeparators( str ) {
	return str.replace( /\//g, fs.separator );
}

function injectTests( files ) {
	files = files.split( ',' );
	if ( files.length !== 0 ) {
		files.forEach( function ( file ) {
			var rootedFile = testRoot + '/' + file;
			if ( fs.isFile( rootedFile ) ) {
				associateFileNameWithTest( file );
				phantom.injectJs( rootedFile );
			}
		} );
	}
}

function findIncludes( root ) {
	fs.list( root ).forEach( function ( item ) {
		var path = root + '/' + item;
		if ( ( item === '.' ) || ( item === '..' ) ) {
			return;
		}
		if ( fs.isDirectory( path ) ) {
			findIncludes( path );
			return;
		}
		if ( /.js/.test( item.toLowerCase() ) ) {
			phantom.injectJs( path );
			return;
		}
	} );
}


function pathJoin( arr ) {
	return arr.join( '/' /*fs.separator*/ );
}