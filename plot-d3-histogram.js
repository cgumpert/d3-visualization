/**
* Helper function for visualising a histogram as SVG using d3js
*
* @param {Object}   container - D3 selection to HTML object acting as container of the svg
* @param {Object}   margin    - specification of top/bottom/right/left margins
* @param {d3.scale} xscale    - D3 scale object for x-axis
* @param {d3.scale} yscale    - D3 scale object for y-axis
* @param {Float[]}  values    - array with bin values
* @param {String}   xtitle    - x-axis title
* @param {String}   ytitle    - y-axis title
* @param {Callback} onclick   - callback function for clicking on histogram bars   
*
* This function takes an array of bin values and plots these as a histogram in
* a SVG inside the given HTML object/container. If the container contains a SVG
* element, it is overwritten and replaced by the histogram SVG. The margin
* object must have bottom/top/left/right attributes specifying the individual
* margins. The x(y)scale objects should be pre-configured d3-scale objects with
* their domain and ticks already set (if needed). The range is overwritten by
* the function to match the siye of the SVG figure.
* The callback function is triggered by onClick events from the histogram bars.
* It receives the index of the bar (zero-absed) and the bin value as input.
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
function plotHistogram(container,
                       margin,
                       xscale,
                       yscale,
                       values,
                       xtitle,
                       ytitle,
                       onclick) {
    // redraw whole histogram instead of updating it
    container.select("svg").remove();

    // setup svg image with padding and margins
    var width = container.node().getBoundingClientRect().width;
    var height = container.node().getBoundingClientRect().height;
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

    var canvas = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // setup axis
    xscale.range([0, innerWidth]);
    yscale.range([innerHeight, 0]);
    var xAxis = d3.axisBottom(xscale);
    var yAxis = d3.axisLeft(yscale);

    // draw axis
    canvas.append("g")
    .classed("axis", true)
    .classed("axis--x", true)
    .attr("transform", "translate(0," + innerHeight + ")")
    .call(xAxis)
    .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 0.7 * margin.bottom)
      .classed("axis-title", true)
      .style("text-anchor", "middle")
      .text(xtitle);

    canvas.append("g")
    .classed("axis", true)
    .classed("axis--y", true)
    .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90 " + (- 0.7 * margin.left) + " " + (innerHeight / 2) +")")
      .attr("x", -0.7 * margin.left)
      .attr("y", innerHeight / 2)
      .classed("axis-title", true)
      .style("text-anchor", "middle")
      .text(ytitle);


    // determine bar width
    var barWidth = innerWidth / values.length;

    var bars = canvas.selectAll(".bar")
    .data(values)
    .enter().append("g")
      .classed("bar", true)
      .attr("transform",function (d,i) {return "translate(" + (i * barWidth) +"," + yscale(d) + ")";});

    if(typeof(onclick) !== "undefined") {
      bars.on("click", function (d,i) {onclick(i,d);});
    }

    bars.append("rect")
    .attr("width", barWidth - 1)
    .attr("height", function (d) {return (innerHeight - yscale(d));});

    if(barWidth > 20) {
      bars.append("text")
      .attr("x", barWidth / 2)
      .attr("y", function (d) {return (innerHeight - yscale(d) > 20) ? 3 : -10;})
      .attr("dy", ".75em")
      .attr("class", function (d) {return (innerHeight - yscale(d) > 20) ? "bin-values-below" : "bin-values-above";})
      .text(function(d) { return d; });
    }}