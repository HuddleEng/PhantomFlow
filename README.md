PhantomFlow
===========

**UI testing with decision trees**. An experimental approach to UI testing, based on [Decision Trees](http://en.wikipedia.org/wiki/Decision_tree). Using [PhantomJS](http://github.com/ariya/phantomjs/), [CasperJS](http://github.com/n1k0/casperjs) and [PhantomCSS](http://github.com/Huddle/PhantomCSS), PhantomFlow enables a fluent way of describing user flows in code whilst generating [structured tree data](http://github.com/Huddle/PhantomFlow/tree/master/demo/data/Get a coffee.json) for visualisation.

![PhantomFlow Report: An exmample visualisation](http://huddle.github.com/PhantomFlow/visualisation-example-image.png)

### Note 

For now I have removed all code for visualisation.  Visualisation will appear in a seperate project in future.

### Aims

* Enable a more expressive way of describing user interaction paths within tests
* Fluently communicate UI complexity to stakeholders and team members
* Support TDD and BDD for web applications and components
* Generation of structured data, for reporting and visualisations

### Example

The [demo](http://github.com/Huddle/PhantomFlow/tree/master/demo) describes a fictional Coffee machine application.

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

To try out the demo for yourself run from the command line.
* On Windows `casperjs demo/runTests.js` (Using the bundled .bat file)
* On OSX `casperjs demo/runTests.js` (Using your locally installed CasperJS (See [Installing CasperJS from Homebrew](http://docs.casperjs.org/en/latest/installation.html#installing-from-homebrew-osx))

### What next?

We've been using this testing style for many months on Huddle's biggest UI application. It's still an evolving idea but for those of us that actively worked on it, it's making a huge difference to the way we think about UI, and how we communicate about UI. It supports TDD well, we use it for UI unit testing but it has great potential for end-to-end as well.

I'm working on a grunt plugin for PhantomFlow which will hopefully make setup a little less painful.  I'd also like to do more work around the visualisation.  Of course, this is an Open Source project and it would be great to see more contributions.

### Package management

I'm using [Bower](http://bower.io/) to maintain PhantomFlow's dependency on PhantomCSS. PhantomCSS bundles CasperJs and PhantomJs. I am however keeping PhantomCSS in the repo so that it is easier to get up and running.

PhantomFlow itself can be pulled via npm and bower.

* `npm install phantomflow`
* `bower install phantomflow`
* `git clone git://github.com/Huddle/PhantomFlow.git`

--------------------------------------

Created by [James Cryer](http://github.com/jamescryer) and the Huddle development team.