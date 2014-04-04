d3.sma.pieChart = function module() {
	var margin = { top: 20, right: 20, bottom: 40, left: 40 },
		width = 750,
		height = 500;

	function exports(_selection) {
		_selection.each(function(_data) {

			var radius = Math.min(width, height) / 2;

			var chartW = width - margin.left - margin.right,
				chartH = height - margin.top - margin.bottom;

			var cScale = d3.scale.ordinal()
				.domain(_data.map(function(d, i) { return d.type; }))
				.range(["#1f77b4","#ff7f0e","#2ca02c"]);

			var arc = d3.svg.arc()
				.outerRadius(radius - 10)
				.innerRadius(0);

			var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) { return d.rValue; });

			svg = d3.select(".pie-chart");
			if (!svg[0][0]) {
				svg = d3.select("#pie-chart")
					.append("svg")
					.classed("pie-chart", true);
					.attr({
						width: width,
						height: height
					});

				svg.append("g");
			}

			svg.select("g").attr("transform", "translate(" + width/2 + "," + height/2 + ")");

			var arc = svg.select("g").selectAll(".arc")
				.data(pie(_data));
			
			.enter()
				.append("g")
				.attr("class", "arc");

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

