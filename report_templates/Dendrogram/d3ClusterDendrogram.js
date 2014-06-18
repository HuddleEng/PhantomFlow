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
	
	var currentScale = 1;

	var zoom = d3.behavior.zoom().x(x).y(y)
		.scaleExtent([0.1, 2.5])
		.on("zoom", function(a, b, c) {
			var t = zoom.translate();
			svg.attr("transform", "translate(" + (t[0]) + "," + (t[1]) + ") scale( " + zoom.scale() + ")");
		});

	var svg = d3
		.select("body")
		.append("svg")
		.call(zoom)
		.attr("width", width)
		.attr("height", height)
		.append("g");
		
	var nodes = cluster.nodes(root);

    var link = svg.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter()
        .append("path")
        .attr("class", "link-subtle")
        .attr("d", diagonal);

	var node = svg.selectAll("g.node")
		.data(nodes)
		.enter().append("g")
		.attr("class", "step")
		.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

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
			return mousemove(tooltip);
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

	d3.select(self.frameElement).style("height", radius * 2 + "px");

	pie( width, height, svg, getLeafInfo(root) );

	zoom.scale(1);
	zoom.translate([width/2, height/2]);
	zoom.event(svg);

}

function get_random_color() {
	function c() {
	return Math.floor((Math.random()*128) + 128).toString(16);
	}
	return "#"+c()+c()+c();
}

function pie(w,h,svg,data){

	var radius = Math.min(w, h) / 2 + 40;

	var color = d3.scale.ordinal()
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(radius - 70);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.leafs; });

	var g = svg.selectAll(".arc")
		.data(pie(data))
		.enter()
		.append("g")
		.attr("class", "arc");

	g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.name); });

	var tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip-label")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.text("");

	var tooltipText = tooltip.append("div");

	g.on("mouseover", function(e){
		if( tooltip.style("visibility") === "hidden" ){
			tooltipText.text(e.data.name.replace('.json', ''));
		}
		return tooltip.style("visibility", "visible");
	})
	.on("mousemove", function(){
		return mousemove(tooltip);
	})
	.on("mouseout", function(){
		return tooltip.style("visibility", "hidden");
	})
	.on("click", function(e){
		window.location.hash = e.data.name;
	});

}

function mousemove(tooltip){
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
}

function getLeafInfo(obj){
	var roots = [];

	function recurse(obj, root, isRoot){
		var newRootRef;
		var i;
		var len;

		if(obj.children){
			i=0;
			len = obj.children.length;
			for (;i<len;i++){
				if(isRoot){
					newRootRef = {
						name: obj.children[i].name,
						leafs: 0,
						deep: 0
					};
					roots.push(newRootRef);
				}
				recurse(obj.children[i], newRootRef || root, false);
			}
		} else {
			root.leafs += 1;
		}
	}

	recurse(obj, {}, true);

	return roots;
}

function applyClass(steps, prop, className){
	steps.filter(function(d, i){
		return d[prop];
	}).classed(className,true);
}