/**
* Helper function for visualising a sunburst plot as SVG using d3js
*
* @param {Object}   container - D3 selection to HTML object acting as container of the svg
* @param {Float[]}  data      - array with tree information
* @param {Object}   [config]  - configuration object (optional)
* @param {Int}      [config.breadcrumb]   - definition of polygon for breadcrumb (optional)
* @param {Object}   [config.color]        - D3 scale object for color coding (optional)
* @param {Callback} [config.cutoff]       - minimum relative contribution for a contribution to be shown (optional)
* @param {d3.scale} [config.legend_entry] - definition of polygon for legend entry (optional)
* @param {String}   [config.margin]       - specification of top/bottom/right/left margins (optional)
*
* This function requires the d3.js library and jQuery to be loaded.
*
* This function takes a data object describing a tree structure. The data object
* must have the following layout:
*
* var data = {
*  name: "root",
*  children: [{
*    name: "A",
*    children: [...],
*    size: 3
*   },{
*    name: "B",
*    children: [...],
*    size: 5
*   }
*   ...
*  ],
*  size: 0
* };
*
* The size for each node should describe the size of this specific node NOT
* including the contributions from child nodes. The function then plots the data
* as a sunburst diagram in a SVG inside the given HTML object/container. If the
* container contains a SVG element, it is overwritten and replaced by the
* sunburst SVG. The config object allows to customize the appearance and
* behaviour of the plot.
* The margin object must have bottom/top/left/right attributes specifying the
* individual margins. The color object should be a pre-configured d3 ordinal
* scale object. The domain is overwritten by the function to match the list of
* unique node names.
* 
* The SVG elements can be styled using CSS. To this end, the following class
* tags are assigned:
* - The paths representing the sunburst nodes are classed as 'sunburst-node'.
* - Group objects representing the legend entries are classed as 'legend-entry'.
* - The text at the tip of the breadcrumb trail has the id 'endlabel'.
* - The text in the middle of the plot showing the relative percentage has the
*   id 'percentage'.
*/
function plotSunburst(container, data, config) {

  // define some default settings
  var defaults = {
    breadcrumb: {w: 75, h: 30, s: 3, t: 10},
    color: d3.scaleOrdinal(d3.schemeCategory20c),
    cutoff: 0.005,  
    legend_entry: {w: 75, h: 30, s: 3, r: 3},
    margin: {top: 20, right: 20, bottom: 20, left: 20}
  };

  // augment user-defined input with default settings
  config = $.extend({}, defaults, config);

  // redraw whole histogram instead of updating it
  container.select("svg").remove();

  // restore back to standard layout
  container.on("mouseleave", mouseleave);

  // setup svg image with padding and margins
  var width = container.node().getBoundingClientRect().width;
  var height = container.node().getBoundingClientRect().height;
  var innerWidth = width - config.margin.left - config.margin.right;
  var innerHeight = height - config.margin.top - config.margin.bottom;
  var radius = Math.min(innerWidth, innerHeight) / 2;

  var svg = container.append("svg")
  .attr("width", width)
  .attr("height", height);

  var canvas = svg.append("g")
  .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")")
  .append("g")
  .attr("transform", "translate(" + innerWidth / 2 + "," + innerHeight / 2 + ")");

  // setup partitioning of data
  var partition = d3.partition()
  .size([2 * Math.PI, radius * radius]);

  // generate hierarchy
  var root = d3.hierarchy(data)
  .sum(function (d) {return d.size;})
  .sort(function(a, b) { return b.value - a.value; });

  // get only nodes with visible contribution
  var nodes = partition(root).descendants()
    .filter(function(d) {
      return (d.x1 - d.x0 > config.cutoff);
    });

  // set domain for color scale to unique names in tree
  var uniqueNames = (function(graph) {
    var output = [];
    graph.forEach(function(node) {
      if (output.indexOf(node.data.name) === -1) {
        output.push(node.data.name);
      }
    });
    return output;
  })(nodes);

  config.color.domain(uniqueNames);

  // define generic template for circle segment
  var arc = d3.arc()
  .startAngle(function(d) { return d.x0; })
  .endAngle(function(d) { return d.x1; })
  .innerRadius(function(d) { return Math.sqrt(d.y0); })
  .outerRadius(function(d) { return Math.sqrt(d.y1); });
  
  // draw sunburst plot
  var path = canvas.selectAll("path")
  .data(nodes)
  .enter().append("path")
  .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
  .attr("d", arc)
  .classed("sunburst-node", true)
  .style("stroke", "#fff")
  .style("fill", function(d) {return config.color(d.data.name); })
  .on("mouseover", mouseover);

  // get total size of the tree = value of root node from partition.
  totalSize = path.datum().value;

  // add legend
  var legend = canvas.append("g")
  .attr("transform", "translate(" + (-innerWidth/2) + "," + (-innerHeight/2 + config.breadcrumb.h) + ")");
 
  // draw legend entries
  var entries = legend.selectAll("g")
  .data(uniqueNames.slice(1,uniqueNames.length))
  .enter()
  .append("g")
  .attr("transform", function(d, i) {return "translate(0," + i * (config.legend_entry.h + config.legend_entry.s) + ")";})
  .classed("legend-entry", true);

  entries.append("rect")
  .attr("rx", config.legend_entry.r)
  .attr("ry", config.legend_entry.r)
  .attr("width", config.legend_entry.w)
  .attr("height", config.legend_entry.h)
  .style("fill", function(d) { return config.color(d); });

  entries.append("text")
  .attr("x", config.legend_entry.w / 2)
  .attr("y", config.legend_entry.h / 2)
  .attr("dy", "0.35em")
  .attr("text-anchor", "middle")
  .text(function(d) { return d; });

  // initialize breadcrump trail
  var trail = svg.append("svg")
  .attr("width", innerWidth)
  .attr("height", 50)
  .attr("id", "trail");
  
  trail
  .append("text")
  .attr("id", "endlabel");

  canvas
  .append("text")
  .attr("id","percentage")
  .attr("text-anchor", "middle");

  canvas
  .append("text")
  .attr("id","counts")
  .attr("dy","1em")
  .attr("text-anchor", "middle");

  // fade all but the current sequence, and show it in the breadcrumb trail
  function mouseover(d) {
    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var percentageString = percentage + "%";
    if (percentage < 0.1) {
      percentageString = "< 0.1%";
    }

    d3.select("#percentage")
    .text(percentageString)
    .style("visibility","");

    d3.select("#counts")
    .text(d3.format(",")(d.value) + "/" + d3.format(",")(totalSize))
    .style("visibility","");

    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift(); // remove root node from the array
    updateBreadcrumbs(sequenceArray, percentageString);

    // fade all the segments
    d3.selectAll("path").style("opacity", 0.3);

    // then highlight only those that are an ancestor of the current segment.
    canvas.selectAll("path")
    .filter(function(node) {return (sequenceArray.indexOf(node) >= 0);})
    .style("opacity", 1);
  }

  // restore everything to full opacity when moving off the visualization.
  function mouseleave(d) {
    // hide the breadcrumb trail
    d3.select("#trail").style("visibility", "hidden");

    // deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
    .transition()
    .duration(500)
    .style("opacity", 1)
    .on("end", function() {d3.select(this).on("mouseover", mouseover);});

    d3.select("#percentage").style("visibility","hidden");
    d3.select("#counts").style("visibility","hidden");
  }

  // update the breadcrumb trail to show the current sequence and percentage.
  function updateBreadcrumbs(nodeArray, percentageString) {
    // data join; key function combines name and depth (= position in sequence).
    var trail = d3.select("#trail")
    .selectAll("g")
    .data(nodeArray, function(d) { return d.data.name + d.depth; });

    // remove exiting nodes.
    trail.exit().remove();

    // ddd breadcrumb and label for entering nodes.
    var entering = trail.enter().append("g");
    entering.append("polygon")
    .attr("points", breadcrumbPoints)
    .style("fill", function(d) { return config.color(d.data.name); });

    entering.append("text")
    .attr("x", (config.breadcrumb.w + config.breadcrumb.t) / 2)
    .attr("y", config.breadcrumb.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d.data.name; });

    // merge enter and update selections; set position for all nodes.
    entering.merge(trail).attr("transform", function(d, i) {return "translate(" + i * (config.breadcrumb.w + config.breadcrumb.s) + ", 0)";});

    // now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
    .attr("x", (nodeArray.length + 0.5) * (config.breadcrumb.w + config.breadcrumb.s))
    .attr("y", config.breadcrumb.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail").style("visibility", "");
  }  

  // generate a string that describes the points of a breadcrumb polygon.
  function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(config.breadcrumb.w + ",0");
    points.push(config.breadcrumb.w + config.breadcrumb.t + "," + (config.breadcrumb.h / 2));
    points.push(config.breadcrumb.w + "," + config.breadcrumb.h);
    points.push("0," + config.breadcrumb.h);

    // leftmost breadcrumb -> don't include 6th vertex.
    if (i > 0) { 
      points.push(config.breadcrumb.t + "," + (config.breadcrumb.h / 2));
    }

    return points.join(" ");
  }
}
