d3.sma.treeMap = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 40},
		height = 500,
		width = 1000;

	var chartW = width - margin.left - margin.right,
		chartH = height - margin.top - margin.bottom;

	var treemap = d3.layout.treemap()
		.size([width, height])
		.sticky(true)
		.value(function(d) { return d.size; });

	var div;

	var dispatch = d3.dispatch("customClick");

	function position() {
		this.style("left", function(d) { return d.x + "px"; })
			.style("top", function(d) { return d.y + "px"; })
			.style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
			.style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
	};

	function exports(_selection) {
		_selection.each(function(_data) {

			_data = _data[0];

			div = d3.select(".tree-map");
			if (!div[0][0]) {
				div = d3.select("#tree-map")
					.append("div")
					.attr("class", "tree-map")
					.style("position", "relative")
					.style("width", (width + margin.left + margin.right) + "px")
					.style("height", (height + margin.top + margin.bottom) + "px")
					.style("left", margin.left + "px")
					.style("top", margin.top + "px");
			}

			var node = div.datum(_data).selectAll(".tree-node")
				.data(treemap.nodes)
				.enter().append("div")
				.attr("class", "tree-node clickable")
				.call(position)
				.style("background-image", function(d) { return "url(" + d.pic + ")"; })
				.on("click", function(d, i) {
					dispatch.customClick(d);
				});

		});
	};

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

