d3.sma = {};

d3.sma.barChart = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 40},
		width = 800,
		height = 25000,
		gap = 0,
		ease = "bounce";

	var svg;

	var dispatch = d3.dispatch("customHover");

	function exports(_selection) {
		_selection.each(function(_data) {

			var maxHashtagLength = d3.max(_data, function(d) { return d.get("id").length; });
			margin.left = maxHashtagLength * 5;

			var chartW = width - margin.left - margin.right,
				chartH = height - margin.top - margin.bottom;

			var y = d3.scale.ordinal()
				.domain(_data.map(function(d, i) { return d.get("id"); }))
				.rangeRoundBands([0, chartH], .1);

			var x = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.get("count"); })])
				.range([chartW, 0]);

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var barH = chartH / _data.length;

			if (!svg) {
				svg = d3.select(this)
					.append("svg")
					.classed("chart", true);

				var container = svg.append("g").classed("container-group", true);
				container.append("g").classed("chart-group", true);
				container.append("g").classed("x-axis-group axis", true);
				container.append("g").classed("y-axis-group axis", true);
			}

			svg.transition().attr({ width: width, height: height });

			svg.select(".container-group")
				.attr({ transform: "translate(" + margin.left + "," + margin.top + ")" });

			var gapSize = y.rangeBand() / 100 * gap;
			var barH = y.rangeBand() - gapSize;

			var bar = svg.select(".chart-group")
				.selectAll("g")
				.data(_data)
				.enter()
				.append("g")
				.attr("transform", function(d, i) { return "translate(" + 0 + "," + i * barH + ")"; });

			bar.append("rect")
				.classed("bar", true)
				.attr({
					height: barH-1,
					width: function(d, i) { return chartW - x(d.get("count")); }
				})
				.on("mouseover", dispatch.customHover);

			bar.append("text")
				.attr("x", function(d) { return chartW - x(d.get("count")) - 3; })
				.attr("y", barH / 2)
				.attr("dy", ".35em")
				.text(function(d) { return d.get("count"); });

			bar.append("text")
				.attr("x", function(d) { return -5; })
				.attr("y", barH / 2)
				.attr("dy", ".35em")
				.style("fill","black")
				.text(function(d) { return d.get("id"); });

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

	d3.rebind(exports, dispatch, "on");

	return exports;
}

