PhantomFlow
===========

**Describe and visualise user flows through tests**. An *experimental* approach to Web user interface testing, based on [Decision Trees](http://en.wikipedia.org/wiki/Decision_tree). Using [PhantomJS](http://github.com/ariya/phantomjs/), [CasperJS](http://github.com/n1k0/casperjs) and [PhantomCSS](http://github.com/Huddle/PhantomCSS), PhantomFlow tries to enable a fluent way of describing user flows in code whilst generating structured tree data for [visualisation](http://huddle.github.com/PhantomFlow/demo/phantomFlowReport.html).

### Why?

Because user interfaces are complex, and not just UI code, user interactions can create an endless number of testable scenarios despite apparent UI simplicity. Representing such complexity in existing behaviour-driven frameworks can often feel clumsy, hard to interpret, and provide no clear way to gage UI complexity (and associated costs).

People have been representing complex information in graphs for a long time - so why don't we?

### How?

PhantomFlow builds up an in memory tree from your tests and then executes each unique path as a series of sequential steps. The tree is augmented with information about test failures and the location of screenshots used for visual regression testing.  The tree is then stringified as JSON and stored in a file which can be read, parsed and visualised at a later point.

By default PhantomFlow will supress Casper asserts on steps that have already been executed.

### Example

The [demo](http://github.com/Huddle/PhantomFlow/tree/master/demo) describes a fictional Coffee machine application, An example [PhantomFlow Report](http://huddle.github.com/PhantomFlow/demo/phantomFlowReport.html) shows how these tests can be visualised using [d3.js](http://d3js.org/).

```javascript

flow("Get a coffee", function(){
	step("Go to the kitchen", goToKitchen);
	step("Go to the coffee machine", goToMachine);
	decision({
		"Wants Latte": function(){
			chance({
				"There is no milk": function(){
					step("Request Latte", requestLatte_fail);
					decision({
						"Give up": function(){
							step("Walk away from the coffee machine", walkAway);
						},
						"Wants Espresso instead": wantsEspresso
					});
				},
				"There is milk": function(){
					step("Request Latte", requestLatte_success);
				}
			});
		},
		"Wants Cappuccino": function(){
			chance({
				"There is no milk": function(){
					step("Request Cappuccino", requestCappuccino_fail);
					decision({
						"Request Espresso instead": wantsEspresso
					});
				},
				"There is milk": function(){
					step("Request Cappuccino", requestCappuccino_success);
				}
			});
		},
		"Wants Espresso": wantsEspresso
	});
});

```

To try out the demo for yourself run `phantomjs demo/runTests.js` from the command line., Note that I have included the PhantomJS executable for convenience, if you're not on Windows you'll need to [download](http://phantomjs.org/download.html) PhantomJS for your OS.

Below is an example of the required setup code.

```javascript

var phantomFlow = require('./phantomFlow.js');

phantomFlow.init({
	casper: casper, // the instance of Casper
	
	scope: this, // Most of the time you want the methods (flow|step|decision|chance) available on the global scope, but you can tack them on to any object
	
	dataRoot: '/data' // Where you want your data to go
});

// Useful events to allow you to create your own reports and augment tree data for visualisation

phantomFlow.
	listen('flow.begin', function(e){}).
	listen('flow.end', function(e){}).
	listen('path.begin', function(e){}).
	listen('path.end', function(e){}).
	listen('step.begin', function(e){}).
	listen('step.end', function(e){}).
	listen('uniqueStep.begin', function(e){}).
	listen('uniqueStep.end', function(e){});

```

--------------------------------------

Created by [James Cryer](http://github.com/jamescryer) and the Huddle development team.