d3.sma.bubbleChart = function module() {
	var margin = { top: 20, right: 20, bottom: 40, left: 40 },
		width = 750,
		height = 500;

	function exports(_selection) {
		_selection.each(function(_data) {

			var chartW = width - margin.left - margin.right,
				chartH = height - margin.top - margin.bottom;

			var yScale = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.yValue; })])
				.range([chartH, 0]);

			var xScale = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.xValue; })])
				.range([0, chartW]);

			var rScale = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.rValue; })])
				.range([0, 20]);

			var cScale = d3.scale.ordinal()
				.domain(_data.map(function(d, i) { return d.type; }))
				.range(["#1f77b4","#ff7f0e","#2ca02c"]);

			var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left");

			var xAxis = d3.svg.axis()
				.scale(xScale)
				.orient("bottom");

			svg = d3.select(".bubble-chart");
			if (!svg[0][0]) {
				svg = d3.select("#bubble-chart")
					.append("svg")
					.classed("bubble-chart", true);
			
				var container = svg.append("g")
					.classed("container-group", true);

				container.append("g")
					.classed("chart-group", true);

				container.append("g").classed("x-axis-group axis", true);
				container.append("g").classed("y-axis-group axis", true);
			}

			svg.transition().attr({ width: width, height: height });

			svg.select(".container-group")
				.attr({ transform: "translate(" + margin.left + "," + margin.top + ")" });

			svg.select(".x-axis-group.axis")
				.attr({transform: "translate(0," + (chartH) + ")"})
				.call(xAxis);

			svg.select(".y-axis-group.axis")
				.call(yAxis);

			var bubble = svg.select(".chart-group")
				.selectAll(".bubble")
				.data(_data, function(d) { return d.id; });

			bubble.transition().duration(500)
				.attr("class", "bubble")
				.attr("cx", function(d) {
					return xScale(d.xValue);
				})
				.attr("cy", function(d) {
					return yScale(d.yValue);
				})
				.attr("r", function(d) {
					return rScale(d.rValue);
				})
				.style("fill", function(d) {
					return cScale(d.type);
				});

			bubble.exit().remove();

			bubble.enter()
				.append("circle")
				.attr("cx", chartW/2)
				.attr("cy", chartH/2)
				.attr("r", 0)
				.transition().duration(500)
				.attr("class", "bubble")
				.attr("cx", function(d) {
					return xScale(d.xValue);
				})
				.attr("cy", function(d) {
					return yScale(d.yValue);
				})
				.attr("r", function(d) {
					return rScale(d.rValue);
				})
				.style("fill", function(d) {
					return cScale(d.type);
				});

		});
	}

	exports.width = function(_x) {
		if (!arguments.length) return width;
		width = _x;
		return this;
	};

	exports.height = function(_x) {
		if (!arguments.length) return height;
		height = parseInt(_x);
		return this;
	};

	return exports;
}

