function plotSunburst(container, data, config) {

	var defaults = {
		color: d3.scaleOrdinal(d3.schemeCategory20c),
		margin: {top: 20, right: 20, bottom: 20, left: 20},
    size_accessor: function (d) {return d.size;}
	};
	config = $.extend({}, defaults, config);

  // redraw whole histogram instead of updating it
  container.select("svg").remove();

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

  // generate partition of data
  var partition = d3.partition()
  .size([2 * Math.PI, radius * radius]);

  // generate hierarchy
  var root = d3.hierarchy(data)
    .sum(config.size_accessor)
    .sort(function(a, b) { return b.value - a.value; });

  // get nodes with visible contribution
  var nodes = partition(root).descendants()
    .filter(function(d) {
      return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
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
    .style("stroke", "#fff")
    .style("fill", function(d) {return config.color(d.data.name); });

  // add legend
  var legend = canvas.append("g")
    .attr("transform", "translate(" + (-innerWidth/2) + "," + (-innerHeight/2) + ")");
      //.attr("height", d3.keys(colors).length * (li.h + li.s));

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {w: 75, h: 30, s: 3, r: 3};

  var entries = legend.selectAll("g")
    .data(uniqueNames.slice(1,uniqueNames.length))
    .enter()
      .append("g")
        .attr("transform", function(d, i) {return "translate(0," + i * (li.h + li.s) + ")";});

  entries.append("rect")
    .attr("rx", li.r)
    .attr("ry", li.r)
    .attr("width", li.w)
    .attr("height", li.h)
    .style("fill", function(d) { return config.color(d); });

  entries.append("text")
    .attr("x", li.w / 2)
    .attr("y", li.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

}