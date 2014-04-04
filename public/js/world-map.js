d3.sma.worldMap = function module() {
	var width = 500,
		height = 250;

	var projection = d3.geo.mercator()
		.scale((width + 1) / 2.7 / Math.PI)
		.translate([width / 2, height / 2+50])
		.precision(.1);

	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule();

	var svg;

	function exports(_selection) {

		_selection.each(function(_data) {
			var world = _data[0];
			var data = _data[1];

			console.log(data);

			svg = d3.select(".world-map");
			if (!svg[0][0]) {
				svg = d3.select("#world-map")
					.append("svg")
					.attr("width", width)
					.attr("height", height)
					.classed("world-map", true);
			}

			svg.append("path")
				.datum(graticule)
				.attr("class", "graticule")
				.attr("d", path);

			svg.insert("path", ".graticule")
				.datum(topojson.feature(world, world.objects.land))
				.classed("land", true)
				.attr("d", path);

			svg.selectAll("circle")
				.data(data)
				.enter()
				.append("circle")
				.attr("cx", function(d) {
					return projection(d.coords)[0];
				})
				.attr("cy", function(d) {
					return projection(d.coords)[1];
				})
				.attr("r", 2)
				.style("fill", "red");

		});

	}

	return exports;
}