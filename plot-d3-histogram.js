/**
* Helper function for visualising a histogram as SVG using d3js
*
* @param {Object}   container - D3 selection to HTML object acting as container of the svg
* @param {Float[]}  data      - array with bin values
* @param {Object}   [config]  - configuration object (optional)
* @param {Int}      [config.bar_spacing]   - gap between bars (optional)
* @param {Object}   [config.margin]        - specification of top/bottom/right/left margins (optional)
* @param {Callback} [config.onclick]       - callback function for clicking on histogram bars (optional)
* @param {d3.scale} [config.xscale]        - D3 scale object for x-axis (optional)
* @param {String}   [config.xtitle]        - x-axis title (optional)
* @param {Int}      [config.xtitle_offset] - offset x-axis title (optional)
* @param {d3.scale} [config.yscale]        - D3 scale object for y-axis (optional)
* @param {String}   [config.ytitle]        - y-axis title (optional)
* @param {Int}      [config.ytitle_offset] - offset x-axis title (optional)
*
* This function requires the d3.js library and jQuery to be loaded.
*
* This function takes an array of bin values and plots these as a histogram in
* a SVG inside the given HTML object/container. If the container contains a SVG
* element, it is overwritten and replaced by the histogram SVG. The config
* object allows to customize the appearance and behaviour of the plot.
* The margin object must have bottom/top/left/right attributes specifying the
* individual margins. The x(y)scale objects should be pre-configured d3-scale
* objects with their domain and ticks already set (if needed). The range is
* overwritten by the function to match the size of the SVG figure.
* A callback function for onClick events from the histogram barscan be provided.
* It receives the index of the bar (zero-based) and the bin value as input.
* Offsets for axis titles as well as the spacing between the histogram bars can
* specified as well.
* 
* The SVG elements can be styled using CSS. To this end, the following class
* tags are assigned:
* - The paths representing the axes are classed as 'axis'.
* - The path representing the x(y)-axis is classed as 'axis--x(y)'.
* - Text objects for axis titles are classed as 'axis-title'.
* - Group object representing the histogram bars are classed as 'bar'.
* - Text object for bin values are classed 'bin-values-above'/'bin-values-below'
*   if the text is displayed above/below the upper end of the bar.
*/
function plotHistogram(container, data, config) {

  // define some default settings
  var defaults = {
    bar_spacing: 1,
    margin: {top: 20, right: 20, bottom: 40, left: 50},
    onclick: undefined,
    xscale: d3.scaleLinear().domain([0,data.length]),
    xtitle: "x-axis",
    xtitle_offset: 30,
    yscale: d3.scaleLinear().domain([0,d3.max(data)]),
    ytitle: "y-axis",
    ytitle_offset: 30
  };

  // augment user-defined input with default settings
  config = $.extend({}, defaults, config);

  // redraw whole histogram instead of updating it
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

  // setup axis
  config.xscale.range([0, innerWidth]);
  config.yscale.range([innerHeight, 0]);
  var xAxis = d3.axisBottom(config.xscale);
  var yAxis = d3.axisLeft(config.yscale);

  // draw axis
  canvas.append("g")
  .classed("axis", true)
  .classed("axis--x", true)
  .attr("transform", "translate(0," + innerHeight + ")")
  .call(xAxis)
  .append("text")
  .attr("x", innerWidth / 2)
  .attr("y", config.xtitle_offset)
  .classed("axis-title", true)
  .style("text-anchor", "middle")
  .text(config.xtitle);

  canvas.append("g")
  .classed("axis", true)
  .classed("axis--y", true)
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90 " + (- config.ytitle_offset) + " " + (innerHeight / 2) +")")
  .attr("x", -config.ytitle_offset)
  .attr("y", innerHeight / 2)
  .classed("axis-title", true)
  .style("text-anchor", "middle")
  .text(config.ytitle);


  // determine bar width
  var step = innerWidth / data.length;
  var barWidth = Math.round(innerWidth / data.length - config.bar_spacing);

  var bars = canvas.selectAll(".bar")
  .data(data)
  .enter().append("g")
  .classed("bar", true)
  .attr("transform",function (d,i) {return "translate(" + (i *step) +"," + config.yscale(d) + ")";});

  if(typeof(onclick) !== undefined) {
    bars.on("click", function (d,i) {config.onclick(i,d);});
  }

  bars.append("rect")
  .attr("width", barWidth)
  .attr("height", function (d) {return (innerHeight - config.yscale(d));});

  if(barWidth > 20) {
    bars.append("text")
    .attr("x", barWidth / 2)
    .attr("y", function (d) {return (innerHeight - config.yscale(d) > 20) ? 10 : -10;})
    .attr("dy", "0.5em")
    .attr("class", function (d) {return (innerHeight - config.yscale(d) > 20) ? "bin-values-below" : "bin-values-above";})
    .text(function(d) { return d; });
  }
}