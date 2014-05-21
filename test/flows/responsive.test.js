
(function(){

	flow("My first responsive webpage", function(){
		decision({
			"View in 990px": function(){
				step('Look at the page', lookAtIt990);
			},
			"View in 480px": function(){
				step('Look at the page', lookAtIt480);
			}
		});
	});

	function lookAtIt990 (){
		lookAtIt(990);
	}

	function lookAtIt480 (){
		lookAtIt(480);
	}

	function lookAtIt(w){

		casper.page.viewportSize = {
			width: w,
			height: 768
		};

		casper.thenOpen("http://localhost:9001/responsive", function(){
			phantomCSS.screenshot('body');
		});
	}

}());