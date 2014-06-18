/*
	Example visualisation based on http://bl.ocks.org/mbostock/4063570
	
	D3.js and jQuery are dependencies

*/

function appendKey(){
	$('body').append('<div class="key">' +
		'  <span class="unimplemented"/>&nbsp;</span> Step without a test<br/><br/>' +
		'  <span class="passed"/>&nbsp;</span> Passed step<br/><br/>' +
		'  <span class="failed"/>&nbsp;</span> Failed step<br/><br/>' +
		'  <span class="decision"/>&nbsp;</span> Decision <br/><br/>' +
		'  <span class="chance"/>&nbsp;</span> Chance event<br/><br/>' +
		'  <span class="screenshot"/>&nbsp;</span> Successful visual regression test<br/><br/>' +
		'  <span class="failedScreenshot"/>&nbsp;</span> Failed visual regression test<br/>' +
		'</div>');
}

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
		.select("body")
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

	var tooltip = d3.select("body")
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