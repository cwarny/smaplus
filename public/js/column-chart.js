d3.sma.columnChart = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 40},
		height = 200,
		width = 500;

	var chartW = width - margin.left - margin.right,
		chartH = height - margin.top - margin.bottom;

	var yScale = d3.scale.linear()
		.range([chartH, 0]);

	var xScale = d3.time.scale()
		.range([0, chartW]);

	var xAxis = d3.svg.axis()
		.scale(xScale)
		.ticks(d3.time.hour, 2)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");	

	var svg;

	var dispatch = d3.dispatch("customClick");

	function exports(_selection) {
		_selection.each(function(_data) {

			_data.forEach(function(d) {
				d.time = new Date(d.time);
			});

			var barW = (d3.max(_data, function(d, i) { return d.time; }) - d3.min(_data, function(d, i) { return d.time; })) / (1000*60*60);
			var dateMin = d3.min(_data, function(d, i) { return d.time; });
			var dateMax = d3.max(_data, function(d, i) { return d.time; });

			xScale.domain([d3.min(_data, function(d, i) { return d.time; }), d3.max(_data, function(d, i) { return d.time; })])
			yScale.domain([0, d3.max(_data, function(d, i) { return d.count; })])

			svg = d3.select(".column-chart");
			if (!svg[0][0]) {
				svg = d3.select("#column-chart")
					.append("svg")
					.classed("column-chart", true);
			
				var container = svg.append("g")
					.classed("container-group", true);

				container.append("g")
					.classed("chart-group", true);

				container.append("g").classed("x-axis-group axis", true);
				container.append("g").classed("y-axis-group axis", true);
			}

			svg.select(".x-axis-group.axis")
				.attr({transform: "translate(0," + (chartH) + ")"})
				.call(xAxis);

			svg.select(".y-axis-group.axis")
				.transition().duration(500)
				.call(yAxis);

			svg.transition().attr({ width: width, height: height });

			svg.select(".container-group")
				.attr({ transform: "translate(" + margin.left + "," + margin.top + ")" });

			var bar = svg.select(".chart-group")
				.selectAll(".bar")
				.data(_data, function(d) { return d.time; });

			bar.exit().remove();

			bar.transition().duration(500)
				.attr({
					x: function(d) {
						return xScale(d.time);
					},
					y: function(d) {
						return chartH - yScale(d.count);
					},
					height: function(d, i) {
						return yScale(d.count);
					},
					width: barW
				});

			bar.enter()
				.append("rect")
				.classed("bar", true)
				.attr({
					x: function(d) {
						return xScale(d.time);
					},
					y: function(d) {
						return chartH - yScale(d.count);
					},
					height: function(d, i) {
						return yScale(d.count);
					},
					width: barW
				})
				.on("click", function(d, i) {
					dispatch.customClick(d);
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

	d3.rebind(exports, dispatch, "on");

	return exports;
}

