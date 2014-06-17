
(function(){

	flow("My first responsive webpage", function(){
		decision({
			"View in 1500px": function(){
				step('Look at the page', lookAtIt1500);
			},
			"View in 990px": function(){
				step('Look at the page', lookAtIt990);
			},
			"View in 440px": function(){
				step('Look at the page', lookAtIt440);
			}
		});
	});

	function lookAtIt1500 (){
		lookAtIt(1500);
	}

	function lookAtIt990 (){
		lookAtIt(990);
	}

	function lookAtIt440 (){
		lookAtIt(440);
	}

	function lookAtIt(w){
		casper.viewport(w, 768).thenOpen("http://localhost:9001/responsive", function(){
			casper.test.pass('Responsive page has loaded');
			phantomCSS.screenshot('body');
		});
	}

}());