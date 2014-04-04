d3.sma.barChart = function module() {
	var margin = { top: 20, right: 20, bottom: 40, left: 40 },
		width = 500,
		height = 500,
		gap = 0,
		ease = "bounce";

	function exports(_selection) {
		_selection.each(function(_data) {

			var chartW = width - margin.left - margin.right,
				chartH = height - margin.top - margin.bottom;

			var yScale = d3.scale.ordinal()
				.domain(_data.map(function(d, i) { return d.id; }))
				.rangeRoundBands([0, chartH], .1);

			var xScale = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.value; })])
				.range([chartW, 0]);

			var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left");

			var xAxis = d3.svg.axis()
				.scale(xScale)
				.orient("bottom");

			var barH = chartH / _data.length;

			svg = d3.select(".bar-chart");
			if (!svg[0][0]) {
				svg = d3.select("#bar-chart")
					.append("svg")
					.classed("bar-chart", true);
			
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

			var gapSize = yScale.rangeBand() / 100 * gap;
			var barH = yScale.rangeBand() - gapSize;

			var bar = svg.select(".chart-group")
				.selectAll(".bar")
				.data(_data, function(d) { return d.id; });

			bar.exit().remove();

			barEnter = bar.enter()
				.append("g");

			barEnter.attr("transform", function(d, i) { return "translate(" + 0 + "," + i * barH + ")"; });

			barEnter.append("rect")
				.attr({
					class: "bar",
					height: barH-1,
					width: function(d, i) { 
						return chartW - xScale(d.value); 
					}
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

	exports.gap = function(_x) {
		if (!arguments.length) return gap;
		gap = _x;
		return this;
	};
	
	exports.ease = function(_x) {
		if (!arguments.length) return ease;
		ease = _x;
		return this;
	};

	return exports;
}

