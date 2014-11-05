/*
	Example visualisation based on http://bl.ocks.org/mbostock/4063570
	
	D3.js and jQuery are dependencies

*/

function createD3Tree(root, config){

	config = config || {};

	var fileRoot = config.root || '';

	var width = $(window).width();
	var height = $(window).height();
	var cluster = d3.layout.cluster().size([height , width - 220]);
	var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

	var nodes = cluster.nodes(root);
	var links = cluster.links(nodes);

	var x = d3.scale.linear().domain([0, width]).range([width, 0]);
	var y = d3.scale.linear().domain([0, height]).range([height, 0]);
	
	var zoom = d3.behavior.zoom().x(x).y(y)
		.scaleExtent([0.1, 2.5])
		.on("zoom", function(a, b, c) {
			var t = zoom.translate();
			svg.attr("transform", "translate(" + (t[0]) + "," + (t[1]) + ") scale( " + zoom.scale() + ")");
		});

	var svg = d3
		.select("#canvas")
		.append("svg")
		.call(zoom)
		.attr("width", width)
		.attr("height", height)
		.append("g");

	d3.select(self.frameElement).style("height", height + "px");

	var link = svg.selectAll(".link")
		.data(links)
		.enter().append("path")
		.attr("class", "link")
		.attr("d", diagonal);

	svg.selectAll(".link").filter(function(d, i){
		return !d.target.isDecision && !d.target.isChance && !d.target.name;
	}).remove();

	var node = svg.selectAll(".node")
		.data(nodes)
		.enter().append("g")
		.attr("class", "step")
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	svg.selectAll(".step").filter(function(d, i){
		return !d.isDecision && !d.isChance && !d.name;
	}).remove();

	svg.selectAll(".step").filter(function(d, i){
		return d.isDecision;
	}).attr("class", "decision");

	svg.selectAll(".step").filter(function(d, i){
		return d.isChanceRoot;
	}).attr("class", "chanceRoot");

	svg.selectAll(".step").filter(function(d, i){
		return d.isDecisionRoot;
	}).attr("class", "decisionRoot");

	svg.selectAll(".step").filter(function(d, i){
		return d.isChance;
	}).attr("class", "chance");

	svg.selectAll(".step").filter(function(d, i){
		return d.isActive;
	}).classed('active',true);

	svg.selectAll(".active")
		.filter(function(d, i){
			return d.isFailed;
		})
		.classed('fail',true);

	var tooltip = d3.select("#canvas")
		.append("div")
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.text("");

	var tooltipText = tooltip.append("div");
	var tooltipImg = tooltip.append("img");

	node.append("circle").attr("r", 8);

	svg.selectAll(".step")
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
			$( "body" ).trigger({
				type:"screenshot",
				name: e.name,
				src: e.screenshot.src,
				diff: e.failedScreenshot,
				latest: e.latestScreenshot,
				original: e.originalScreenshot,
				element: this
			});
		});

	var dy = !!window.chrome ? 6 : 22;

	node.append("text")
		.attr("dx", function(d,e, f) { return d.isBranchRoot ? 8 : d.children ? -15 : 15; })
		.attr("dy", function(d) { return d.isBranchRoot ? 22 : d.children ? dy  : dy ; })
		.attr("class", function(d) { return d.isDecisionRoot ? 'text decisiontext' : d.isChanceRoot ? 'text chancetext' : d.children ? 'text steptext' : 'text endtext'; })
		.attr("transform",  function(d) { return (d.children && !d.isBranchRoot) ? "rotate(330)" : "rotate(0)"; })
		.text(function(d) { return d.name.replace('.json', ''); });

	zoom.scale(1);
	zoom.translate([50, 50]);
	zoom.event(svg);
}