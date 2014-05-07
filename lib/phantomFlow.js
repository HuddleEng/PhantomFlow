/*
Author: James Cryer
Company: Huddle
Last updated date: 26 Feb 2014
URL: https://github.com/Huddle/PhantomFlow
*/

var casper;
var tree = {};
var cStep;
var pathCount;
var doneSteps;

var hasFailure;
var hasTest;
var casperAssert;
var jsonRoot;

var libraryRoot;

var currentFlowName;

exports.init = init;
exports.listen = listen;
exports.updateJsonRoot = updateJsonRoot;

function listen(event, callback){
	casper.on('phantomflow.'+event, callback);
	return this;
}

function patchTester(casper){
	var patchedTester = require( libraryRoot +'/casperjs-modified-tester.js' );

	casper.__defineGetter__('test', function() {
	    if (!this._test) {
	        this._test = patchedTester.create(this);
	    }
	    return this._test;
	});

	casperAssert = casper.test.assert;
	
	listen('step.begin', disableAsserts);
	listen('step.end', enableAsserts);
}

function init(options){
	casper = options.casper;
	jsonRoot = options.dataRoot || './flowData';

	libraryRoot = options.libraryRoot || '.';

	patchTester(casper);

	casper.test.on('fail', onCasperFail);
	casper.test.on('success', onCasperSuccess);

	listen('flow.begin', getCurrentFlowName);
	listen('flow.end', writeJson);
	listen('uniqueStep.begin', onUniqueStepBegin);
	listen('uniqueStep.end', onUniqueStepEnd);

	var obj = options.scope || {};
	return extend( obj );
}

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

function updateJsonRoot(root){
	jsonRoot = root;
}

function onCasperFail(){
	hasFailure = true;
	hasTest = true;
}
function onCasperSuccess(){
	hasTest = true;
}

function getCurrentFlowName(e){
	currentFlowName = safe(e.name);
}
function safe(str){
	return str.replace(/\/|\<|\>|\?|\:|\*|\||\"/g, '');
}
function writeJson(e){
	fs.write( jsonRoot + '/' + currentFlowName + '.json', JSON.stringify(e.tree, null, 2) , 'w');
}
function disableAsserts(){
	casper.test.assert = function(){};
}
function enableAsserts(){
	casper.test.assert = casperAssert;
}
function onUniqueStepBegin(){
	hasFailure = void 0;
	hasTest = void 0;
	enableAsserts();
}
function onUniqueStepEnd(e){
	e.node.isFailed = hasFailure;
	e.node.isActive = hasTest;
}

function extend( scopedContext ){
	scopedContext.flow = createFlow;
	scopedContext.step = createStep;
	scopedContext.decision = createDecision;
	scopedContext.chance = createChance;
	return scopedContext;
}

function then(func){
	casper.then(func);
}

function emit(event, data){
	casper.emit('phantomflow.'+event, data);
}

function createFlow(name, func){
	then(function(){
		emit('flow.begin', {name: name});

		tree.name = name;
		tree.isBranchRoot = true;
		tree.isDecisionRoot = true;
		tree.children = [];

		cStep = tree;

		func();
	});

	then(function(){
		doneSteps = [];
		pathCount = 0;

		console.log('\n~ Phantom Flow.  Running all paths for: ' + currentFlowName);

		runAllThePaths(tree, []);
	});

	then(function(){
		emit('flow.end',{name: name, pathCount: pathCount, tree: tree});
	});
}

function createStep(name, func){
	var i;
	var newStep = {};

	newStep.name = name;
	newStep.action = func;
	newStep.isStep = true;
	newStep.children = [];

	cStep.children.push(newStep);

	cStep = newStep;
}

function createDecision(object){
	createBranch(object, 'decision');
}

function createChance(object){
	createBranch(object, 'chance');
}

function createBranch(object, type){
	var i;
	var newStep;
	var branchedStep = cStep;

	for (i in object){
		if(object.hasOwnProperty(i)){

			newStep = {
				name: i,
				isBranchRoot: true,
				isDecisionRoot: type === 'decision',
				isChanceRoot: type === 'chance',
				children: []
			};

			branchedStep.children.push(newStep);

			cStep = newStep;

			object[i]();
		}
	}
}

function runAllThePaths(node, path){
	var i;
	var isLeaf = true;
	path = path.slice(0); // copy array

	path.push(node);

	if(node.children.length){
		node.children.forEach(function(node){
			runAllThePaths(node, path);
		});
	} else {
		runPath(path);
	}
}

function runPath(path){
	var pathBranchRootNodeNames = [];
	var contextForFlow = {};

	then(function(){
		pathCount++;
		emit('path.begin', {index: pathCount });
		console.log('');
	});

	path.forEach(function(node){
		var unique = true;

		if(node.isBranchRoot){
			then(function(){
				pathBranchRootNodeNames.push(node.name);
			});
		}

		then(function(){
			if(node.name){
				console.log('~ ' + node.name);
			}
		});

		if(node.action){
			then(function(){
				var pathAsString = pathBranchRootNodeNames.map(function(i){return safe(i);}).join('/') + '/' + safe(node.name);
				var e = {name:node.name, decisions: pathBranchRootNodeNames, pathIndex: pathCount, pathAsString: pathAsString };
				var id = pathBranchRootNodeNames.join('')+node.name;

				emit('step.begin',e);

				unique = doneSteps.indexOf(id) === -1;

				if(unique){
					doneSteps.push(id);
					emit('uniqueStep.begin',e);
				}

				node.action(contextForFlow);
			});
			then(function(){
				var pathAsString = pathBranchRootNodeNames.map(function(i){return safe(i);}).join('/') + '/' + safe(node.name);
				var id = pathBranchRootNodeNames.join('')+node.name;
				var e = {name:node.name, decisions: pathBranchRootNodeNames, pathIndex: pathCount, node: node, pathAsString: pathAsString };

				emit('step.end', e);

				if(unique){
					emit('uniqueStep.end', e);
				}
			});
		}
	});

	then(function(){
		emit('path.end', {pathIndex: pathCount, decisions: pathBranchRootNodeNames });
	});
}