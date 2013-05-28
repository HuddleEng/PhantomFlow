
 function createD3Tree(root){
	var width = $(window).width() ,
		height = 1200;

	var cluster = d3.layout.cluster()
		.size([height , width - 400]);

	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
	  .append("g")
		.attr("transform", "translate(160,-10)");

	d3.select(self.frameElement).style("height", height + "px");

	var nodes = cluster.nodes(root),
		links = cluster.links(nodes);

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

	var tooltipImg = tooltip.append("img");

	node.append("circle").attr("r", 10);

	svg.selectAll(".step")
		.filter(function(d, i){
			return !!d.screenshot;
		})
		.classed('screenshot',true)
		.on("mouseover", function(e){
			if( tooltip.style("visibility") === "hidden" ){
				tooltipImg.attr("src", e.screenshot);
			}
			return tooltip.style("visibility", "visible");
		})
		.on("mousemove", function(){

			var width = Number(tooltip.style("width").replace('px', ''));
			var right = event.pageX + 10 + width;

			if(right > document.body.clientWidth){
				return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX-20 - width)+"px");
			} else {
				return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
			}

		})
		.on("mouseout", function(){
			return tooltip.style("visibility", "hidden");
		});

	node.append("text")
		.attr("dx", function(d) { return d.isBranchRoot ? 9 : d.children ? -12 : 12; })
		.attr("dy", function(d) { return d.isBranchRoot ? 20 : d.children ? 6 : 6; })
		.attr("class", function(d) { return d.isDecisionRoot ? 'text decisiontext' : d.isChanceRoot ? 'text chancetext' : d.children ? 'text steptext' : 'text endtext'; })
		.attr("transform",  function(d) { return (d.children && !d.isBranchRoot) ? "rotate(320)" : "rotate(0)"; })
		.text(function(d) { return d.name; });
  }