
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


	var tooltipText = tooltip.append("div");
	var tooltipImg = tooltip.append("img");

	node.append("circle").attr("r", 10);

	svg.selectAll(".step")
		.filter(function(d, i){
			var _this = this;
			var failedScreenshot;

			if(d.screenshot){
				failedScreenshot = d.screenshot.replace('.png', '.fail.png');

				$.get(failedScreenshot)
					.success(function(){
						d.failedScreenshot = failedScreenshot;
						d.latestScreenshot = d.screenshot.replace('.png', '.diff.png');

						_this.setAttribute("class", _this.className.baseVal + ' screenshotFail');
					});
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
					tooltipImg.attr("src", e.screenshot);
				}
			}
			return tooltip.style("visibility", "visible");
		})
		.on("mousemove", function(){

			var width = Number(tooltip.style("width").replace('px', ''));
			var height = Number(tooltip.style("height").replace('px', ''));
			var right = event.pageX + 10 + width;
			var top = event.pageY-10 + height;

			if(right > document.body.clientWidth){
				right = event.pageX-10 - width;
			} else {
				right = event.pageX+10;
			}

			if( top > document.body.clientHeight){
				top = event.pageY-10 - height;
			} else {
				top = event.pageY-10;
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
				tooltipImg.attr("src", e.screenshot);
			} 
			else if ( tooltipImg.attr("src") === e.screenshot ){
				tooltipText.text('Latest/bad image');
				tooltipImg.attr("src", e.latestScreenshot);	
			}
			else {
				tooltipText.text('Failed diff image.');
				tooltipImg.attr("src", e.failedScreenshot);	
			}
		});

	node.append("text")
		.attr("dx", function(d) { return d.isBranchRoot ? 9 : d.children ? -12 : 12; })
		.attr("dy", function(d) { return d.isBranchRoot ? 20 : d.children ? 6 : 6; })
		.attr("class", function(d) { return d.isDecisionRoot ? 'text decisiontext' : d.isChanceRoot ? 'text chancetext' : d.children ? 'text steptext' : 'text endtext'; })
		.attr("transform",  function(d) { return (d.children && !d.isBranchRoot) ? "rotate(320)" : "rotate(0)"; })
		.text(function(d) { return d.name; });
  }