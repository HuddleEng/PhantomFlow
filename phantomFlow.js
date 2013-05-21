var tree = {};
var cStep;
var pathCount;
var doneSteps;

var hasFailure;
var hasTest;
var casperAssert;
var jsonRoot;

var currentFlowName;

exports.init = init;
exports.listen = listen;

function listen(event, callback){
	casper.on('phantomflow.'+event, callback);
	return this;
}

function init(options){
	casper = options.casper;
	jsonRoot = options.jsonRoot || './flowData';

	casperAssert = casper.test.assert;

	casper.test.on('fail', onCasperFail);
	casper.test.on('success', onCasperSuccess);

	listen('flow.begin', getCurrentFlowName);
	listen('flow.end', writeJson);
	listen('step.begin', disableAsserts);
	listen('step.end', enableAsserts);
	listen('uniqueStep.begin', onUniqueStepBegin);
	listen('uniqueStep.end', onUniqueStepEnd);

	var obj = options.scope || {};
	return extend( obj );
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
	fs.write( jsonRoot + '/' + currentFlowName + '.json', JSON.stringify(e.tree) , 'w');
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

		cStep = {};
		tree.name = name;
		tree.children = [cStep];
		func();
	});

	then(function(){
		doneSteps = [];
		pathCount = 0;
		runAllThePaths(tree, []);
	});

	then(function(){
		emit('flow.end',{name: name, pathCount: pathCount, tree: tree});
	});
}

function createStep(name, func){
	var i;
	var newStep = {};
	cStep.name = name;
	cStep.action = func;
	cStep.isStep = true;
	cStep.children = [newStep];
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

	branchedStep.children = [];
	branchedStep.isDecision = type === 'decision',
	branchedStep.isChance = type === 'chance';

	for (i in object){
		if(object.hasOwnProperty(i)){

			newStep = {
				name: i,
				isBranchRoot: true,
				isDecisionRoot: type === 'decision',
				isChanceRoot: type === 'chance'
			};

			branchedStep.children.push(newStep);

			cStep = {};
			newStep.children = [cStep];

			object[i]();
		}
	}
}

function runAllThePaths(node, path){
	var i;
	var isLeaf = true;
	path = path.slice(0); // copy array

	path.push(node);

	if(node.children && !node.children[0].children){
		// prune empty nodes for visualisation
		node.children = void 0;
	}

	if(node.children){
		node.children.forEach(function(node){
			runAllThePaths(node, path);
		});
	} else {
		runPath(path);
	}
}

function runPath(path){
	var pathBranchRootNodeNames = [];

	then(function(){
		pathCount++;
		emit('path.begin', {index: pathCount });
	});

	path.forEach(function(node){
		var unique = true;

		if(node.isBranchRoot){
			then(function(){
				pathBranchRootNodeNames.push(node.name);
			});
		}

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

				node.action();
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