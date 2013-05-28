
/*

This example demonstrates integration of PhantomFlow with PhantomCSS (https://github.com/Huddle/PhantomCSS)

*/

(function(){

	/*
		User flows described in one decision tree
	*/

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

	function wantsEspresso(){
		step("Request Espresso", requestEspresso);
		decision({
			"Wants single shot": function(){
				step("Request single shot", requestSingleShot);
			},
			"Wants double shot": function(){
				step("Request double shot", requestDoubleShot);
			}
		});
	}


	/*
		Steps
	*/

	function goToKitchen(){
		casper.thenOpen(url.testPage, function(){
			css.turnOffAnimations();
		});
	}

	function goToMachine (){

		casper.click('#coffeemachinebutton');
		casper.waitForSelector(
			'#myModal:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should see coffee machine');
			},
			function timeout(){
				casper.test.fail('Should see coffee machine');
			}
		);
	}
	function requestLatte_fail (){

		fakeNoMilk();

		casper.click('#latte-button');
		casper.waitForSelector(
			'.alert-danger:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should see no milk warning');
			},
			function timeout(){
				casper.test.fail('Should see no milk warning');
			}
		);
	}
	function requestLatte_success (){

		fakePlentifulMilk();

		casper.click('#latte-button');
		casper.waitForSelector(
			'.alert-success:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should get latte');
			},
			function timeout(){
				casper.test.fail('Should get latte');
			}
		);
	}

	function requestCappuccino_fail (){

		fakeNoMilk();

		casper.click('#cappuccino-button');
		casper.waitForSelector(
			'.alert-danger:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should see no milk warning');
			},
			function timeout(){
				casper.test.fail('Should see no milk warning');
			}
		);
	}
	function requestCappuccino_success (){

		fakePlentifulMilk();

		casper.click('#cappuccino-button');
		casper.waitForSelector(
			'.alert-success:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should get cappuccino');
			},
			function timeout(){
				casper.test.fail('Should get cappuccino');
			}
		);
	}
	function requestEspresso (){
		casper.click('#espresso-button');
		casper.waitForSelector(
			'.alert:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should see espresso choice');
			},
			function timeout(){
				casper.test.fail('Should see espresso choice');
			}
		);
	}
	function requestSingleShot (){
		casper.click('#single-is-fine');
		casper.waitForSelector(
			'.alert-success:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should get single shot Espresso');
			},
			function timeout(){
				casper.test.fail('Should get single shot Espresso');
			}
		);
	}
	function requestDoubleShot (){
		casper.click('#make-that-a-double');
		casper.waitForSelector(
			'.alert-success:not([style*="display: none"])', 
			function success(){
				css.screenshot('#myModal');
				casper.test.pass('Should get double shot Espresso');
			},
			function timeout(){
				casper.test.fail('Should get double shot Espresso');
			}
		);
	}
	function walkAway (){
		casper.click('#close');

		casper.waitForSelector(
			'#myModal[style*="display: none"]',
			function success(){
				casper.test.pass('Should be able to walk away from the coffee machine');
			},
			function timeout(){
				casper.test.fail('Should be able to walk away from the coffee machine');
			}
		);
	}

	/*
		Test helpers
	*/

	function fakeNoMilk(){
		casper.evaluate(function(){
			window.async_isThereMilk = function(callback){
				callback(false);
			};
		});
	}

	function fakePlentifulMilk(){
		casper.evaluate(function(){
			window.async_isThereMilk = function(callback){
				callback(true);
			};
		});
	}

}());