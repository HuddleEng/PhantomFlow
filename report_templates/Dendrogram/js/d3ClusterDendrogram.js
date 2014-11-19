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
	var radius = Math.min(width, height)/1.8;

	var cluster = d3.layout.cluster()
		.size([360, radius]);

	var diagonal = d3.svg.diagonal.radial()
		.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

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

	var tooltip = d3.select("#canvas")
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

	var rootTests = getLeafInfo(root);
	var groups = getGroupInfo(rootTests);
	
	groupPie( radius, svg, groups );
	
	rootPie( radius, svg, rootTests );

	zoom.scale(.75);
	zoom.translate([width/2, height/2]);
	zoom.event(svg);
}

function getGroupInfo(array){
	var key;
	var tots = {};
	var newArray = [];

	array.forEach(function(item){
		var stem = item.name.split(/\/|\\/).shift();

		if(tots[stem] != void 0){
			tots[stem] += item.value;
		} else {
			tots[stem]=0;
		}
	});

	for (key in tots){
		newArray.push({
			value: tots[key],
			name: key
		});
	}

	return newArray;
}

function get_random_color() {
	function c() {
	return Math.floor((Math.random()*128) + 128).toString(16);
	}
	return "#"+c()+c()+c();
}

function groupPie(radius,svg,data){
	var color = d3.scale.ordinal()
		.range(["#DEDDDA",
			"#D6D6D2",
			"#BFBFBB",
			"#CCCBC8",
			"#C2C1BE"]);

	var g = pie('group-pie', radius, 46, color, svg, data);

	pieTooltip(g);
}

function rootPie(radius,svg,data){

	var color = d3.scale.ordinal()
		.range(["#CCD2E3",
			"#D5E1ED",
			"#CBD4D6",
			"#D5EDEC",
			"#CCE3DB"]);

	var g = pie('root-pie', radius, 8, color, svg, data);

	pieTooltip(g);

	g.on("click", function(e){
		window.location.hash = e.data.name;
	});
}

function pie(name, radius, offset, color, svg, data){
	var arc = d3.svg.arc()
		.outerRadius(radius + offset + 40)
		.innerRadius(radius + offset + 8 );

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.value; });

	var g = svg.selectAll(".arc"+name)
		.data(pie(data))
		.enter()
		.append("g")
		.attr("class", "arc");

	g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.name); });

	g.classed(name,true);

	return g;
}

function pieTooltip(g){
	var tooltip = d3.select("#canvas")
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
						value: 0,
						deep: 0
					};
					roots.push(newRootRef);
				}
				recurse(obj.children[i], newRootRef || root, false);
			}
		} else {
			root.value += 1;
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