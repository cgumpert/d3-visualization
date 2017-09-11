function plotSankey(container, data, config) {
  // define some default settings
  var color = d3.scaleOrdinal(d3.schemeCategory20); 
  var defaults = {
    link_text: function (d) {
      return d.source.name + " -> " + d.target.name + "\n" + d3.format(",")(d.value);
    },
    margin: {top: 20, right: 20, bottom: 20, left: 20},
    node_color: function(d) { return color(d.category); },
    node_id: function (d) {return d.index;},
    node_padding: 10,
    node_text: function(d) { return d.name + "\n" + d.value; },
    node_width: 15,
  };

  // augment user-defined input with default settings
  config = $.extend({}, defaults, config);

  // redraw whole sankey plot instead of updating it
  container.select("svg").remove();

  // setup svg image with padding and margins
  var width = container.node().getBoundingClientRect().width;
  var height = container.node().getBoundingClientRect().height;
  var innerWidth = width - config.margin.left - config.margin.right;
  var innerHeight = height - config.margin.top - config.margin.bottom;

  var svg = container.append("svg")
  .attr("width", width)
  .attr("height", height);

  var canvas = svg.append("g")
  .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");

  // create the main sankey object
  var sankey = d3.sankey()
  .nodeId(config.node_id)
  .nodePadding(config.node_padding)
  .nodeWidth(config.node_width)
  .extent([[0, 0], [innerWidth, innerHeight]]);

  // generate the link template
  var link = canvas.append("g")
  .classed("link", true)
  .attr("fill", "none")
  .attr("stroke", "#000")
  .attr("stroke-opacity", 0.2)
  .selectAll("path");

  // generate the node template
  var node = canvas.append("g")
  .classed("node", true)
  .selectAll("g");

  // calculate the layout
  sankey(data);

  // insert links and associate titles
  link = link
    .data(data.links)
    .enter().append("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", function(d) { return Math.max(1, d.width); });

  link.append("title")
      .text(config.link_text);

  // insert nodes and set titles
  node = node
    .data(data.nodes)
    .enter().append("g")
    // add dragging behaviour
    .call(d3.drag()
      .on("start", function(d) { 
          d.startX = d3.event.x;
          d.startY = d3.event.y;
          this.parentNode.appendChild(this); })
      .on("drag", function (d) {
          d.x0 += d3.event.dx;
          d.x1 += d3.event.dx;
          d.y0 += d3.event.dy;
          d.y1 += d3.event.dy;
          d3.select(this).attr("transform", "translate(" + (d3.event.x - d.startX) + "," + (d3.event.y - d.startY) + ")");
          sankey.update(data);
          link.attr("d",  d3.sankeyLinkHorizontal());
}));

  node.append("rect")
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("fill", config.node_color)
      .attr("stroke", "#000");

  node.append("text")
      .attr("x", function(d) { return d.x0 - 6; })
      .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x0 < width / 2; })
      .attr("x", function(d) { return d.x1 + 6; })
      .attr("text-anchor", "start");

  node.append("title")
      .text(config.node_text);
}
