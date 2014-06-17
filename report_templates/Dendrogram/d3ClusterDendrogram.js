/*
	Example visualisation based on http://bl.ocks.org/mbostock/4063423
	
	D3.js and jQuery are dependencies

*/

function createD3ClusterDendrogram(root, config){

	config = config || {};

	var familyNames = {};

	var fileRoot = config.root || '';

	var width = $(window).width();
	var height = $(window).height();
	var radius = $(window).width()/2;

	var cluster = d3.layout.cluster()
		.size([360, radius - 240]);

	var diagonal = d3.svg.diagonal.radial()
		.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

	var x = d3.scale.linear().domain([0, width]).range([width, 0]);
	var y = d3.scale.linear().domain([0, height]).range([height, 0]);
	var zoom = d3.behavior.zoom().x(x).y(y)
		.scaleExtent([0.1, 2.5])
		.on("zoom", function() {
			var t = zoom.translate();
			svg.attr("transform", "translate(" + (t[0]+radius) + "," + (t[1]+radius) + ") scale( " + zoom.scale() + ")");
		});

	var svg = d3
		.select("body")
		.append("svg")
		.call(zoom)
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + radius + "," + radius + ")");
		
	var nodes = cluster.nodes(root);

	var node = svg.selectAll("g.node")
		.data(nodes)
		.enter().append("g")
		.attr("class", "step")
		.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

	function applyClass(steps, prop, className){
		steps.filter(function(d, i){
			return d[prop];
		}).classed(className,true);
	}

	var steps = svg.selectAll(".step");

	applyClass(steps, 'isDecision', 'decision');
	applyClass(steps, 'isChanceRoot', 'chanceRoot');
	applyClass(steps, 'isDecisionRoot', 'decisionRoot');
	applyClass(steps, 'isChance', 'chance');
	applyClass(steps, 'isActive', 'active');
	
	applyClass(svg.selectAll(".active"), 'isFailed', 'fail');

	node.append("circle")
		.attr("r", 4);

	var tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.text("");

	var tooltipText = tooltip.append("div");
	var tooltipImg = tooltip.append("img");

	steps
		.filter(function(d, i){
			var _this = this;
			var failedScreenshot;

			if(d.screenshot && d.screenshot.original){

				d.originalScreenshot = d.screenshot.original;

				if(d.screenshot.failure){
					d.failedScreenshot = d.screenshot.failure;
					d.latestScreenshot = d.screenshot.latest;
					_this.setAttribute("class", _this.className.baseVal + ' screenshotFail');
				}
			}
			return !!d.screenshot;
		})
		.classed('screenshot',true)
		.on("mouseover", function(e){
			if( tooltip.style("visibility") === "hidden" ){
				if(e.failedScreenshot){
					tooltipText.text('Failed diff image.');
					tooltipImg.attr("src", e.failedScreenshot);
				} else {
					tooltipText.text('Original/good image');
					tooltipImg.attr("src", e.originalScreenshot);
				}
			}
			return tooltip.style("visibility", "visible");
		})
		.on("mousemove", function(){

			var width = Number(tooltip.style("width").replace('px', ''));
			var height = Number(tooltip.style("height").replace('px', ''));
			var right = d3.event.pageX + 10 + width;
			var top = d3.event.pageY-10 + height;

			if(right > document.body.clientWidth){
				right = d3.event.pageX-10 - width;
			} else {
				right = d3.event.pageX+10;
			}

			if( top > document.body.clientHeight){
				top = d3.event.pageY-10 - height;
			} else {
				top = d3.event.pageY-10;
			}

			return tooltip.style("top", top +"px").style("left", right+"px");

		})
		.on("mouseout", function(){
			return tooltip.style("visibility", "hidden");
		})
		.on("click", function(e){
			if( !e.failedScreenshot ){
				return;
			}

			if( tooltipImg.attr("src") === e.failedScreenshot ){
				tooltipText.text('Original/good image');
				tooltipImg.attr("src", e.originalScreenshot);

			} else if ( tooltipImg.attr("src") === e.originalScreenshot ){
				tooltipText.text('Latest/bad image');
				tooltipImg.attr("src", e.latestScreenshot);

			} else {
				tooltipText.text('Failed diff image.');
				tooltipImg.attr("src", e.failedScreenshot);
			}
		});

	steps
		.filter(function(d, i){
			return !d.children;
		})
		.append("text")
		.attr("dy", ".31em")
		.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
		.attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
		.text(function(d) { 
			var name;
			var o = d;

			while (d.parent){
				name = d.name;
				d = d.parent;
			}

			o.familyName = name || d.name;

			if( !familyNames[o.familyName] ){
				familyNames[o.familyName] = get_random_color();
			}

			d3.select(this).attr("class", "familyname");
			d3.select(this).style("stroke", familyNames[o.familyName]);

			return o.familyName;
		})
		.on("click", function(e){
			window.location.hash = e.familyName;
		});
	
	d3.select(self.frameElement).style("height", radius * 2 + "px");

	// later on
	zoom.scale(1);
	zoom.event(svg);

}

function get_random_color() {
	function c() {
	return Math.floor((Math.random()*128) + 128).toString(16);
	}
	return "#"+c()+c()+c();
}