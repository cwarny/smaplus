d3.sma.barChart = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 40},
		height = 500,
		width = 400,
		gap = 0,
		ease = "bounce";

	var svg;

	var dispatch = d3.dispatch("customClick");

	function exports(_selection) {
		_selection.each(function(_data) {
			var maxLength = d3.max(_data, function(d) { return d.id.length; });
			margin.left = maxLength * 5;

			var chartW = width - margin.left - margin.right,
				chartH = height - margin.top - margin.bottom;

			var yScale = d3.scale.ordinal()
				.domain(_data.map(function(d, i) { return d.id; }))
				.rangeRoundBands([0, chartH], .1);

			var xScale = d3.scale.linear()
				.domain([0, d3.max(_data, function(d, i) { return d.count; })])
				.range([chartW, 0]);

			var barH = chartH / _data.length;

			svg = d3.select(".entities-barchart");
			if (!svg[0][0]) {
				svg = d3.select("#entities-barchart")
					.append("svg")
					.classed("entities-barchart", true);
			
				var container = svg.append("g")
					.classed("container-group", true);

				container.append("g")
					.classed("chart-group", true);

				// container.append("g").classed("x-axis-group axis", true);
				// container.append("g").classed("y-axis-group axis", true);
			}

			svg.transition().attr({ width: width, height: height });

			svg.select(".container-group")
				.attr({ transform: "translate(" + margin.left + "," + margin.top + ")" });

			var gapSize = yScale.rangeBand() / 100 * gap;
			var barH = yScale.rangeBand() - gapSize;

			var bar = svg.select(".chart-group")
				.selectAll(".bar")
				.data(_data, function(d) { return d.id; })
				.attr("class",function(d) {
					if (d.selected) return "bar selected clickable";
					else return "bar clickable";
				});

			bar.exit().remove();

			barEnter = bar.enter()
				.append("g");

			barEnter.attr("transform", function(d, i) { return "translate(" + 0 + "," + i * barH + ")"; });

			barEnter.append("rect")
				.attr({
					class: function(d) {
						if (d.selected) return "bar selected clickable";
						else return "bar clickable";
					},
					height: barH-1,
					width: function(d, i) { 
						return chartW - xScale(d.count); 
					}
				})
				.on("click", function(d, i) {
					dispatch.customClick(d);
				});

			bar.append("text")
				.attr("x", function(d) { return chartW - xScale(d.count) - 3; })
				.attr("y", barH / 2)
				.attr("dy", ".35em")
				.text(function(d) { return d.count; });

			bar.append("text")
				.attr("x", function(d) { return -5; })
				.attr("y", barH / 2)
				.attr("dy", ".35em")
				.style("fill","black")
				.text(function(d) { return d.id; });

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

