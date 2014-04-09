/*
	Example visualisation based on http://bl.ocks.org/mbostock/4063423
	
	D3.js and jQuery are dependencies

*/


function createD3ClusterDendrogram(root, config){

  config = config || {};

  var familyNames = {};

  var fileRoot = config.root || '';

  var radius = $(window).width()/2;

  var cluster = d3.layout.cluster()
      .size([360, radius - 120]);

  var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

  var svg = d3.select("body").append("svg")
      .attr("width", radius * 2)
      .attr("height", radius * 2)
    .append("g")
      .attr("transform", "translate(" + radius + "," + radius + ")");

  //d3.json("/d/4063550/flare.json", function(error, root) {
    var nodes = cluster.nodes(root);

    var link = svg.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    svg.selectAll(".link").filter(function(d, i){
      return !d.target.isDecision && !d.target.isChance && !d.target.name;
    }).remove();

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "step")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

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


    svg.selectAll(".step").filter(function(d, i){
      return !d.children;
    }).append("text")
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
        console.log();
        window.location.hash = e.familyName;
      });
  

  d3.select(self.frameElement).style("height", radius * 2 + "px");


}

function get_random_color() {
  function c() {
    return Math.floor((Math.random()*128) + 128).toString(16);
  }
  return "#"+c()+c()+c();
}