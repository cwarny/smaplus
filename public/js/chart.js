d3.sma = {};

d3.sma.network = function module() {
	var width = 600,
		height = 400;

	var svg;
		
	function exports(_selection) {
		_selection.each(function(_data) {

			var force = d3.layout.force()
				.nodes(_data.nodes)
				.links(_data.links)
				.gravity(.05)
				.distance(100)
				.charge(-100)
				.size([width, height])
				.start();

			var colorScale = d3.scale.ordinal().domain(["hashtag","user_mention","url"]).range(["#1f77b4","#ff7f0e","#2ca02c"]);
			var lineThicknessScale = d3.scale.linear().domain([1,d3.max(_data.links,function(d) {return d.weight;})]).range([1,5]);

			svg = d3.select(".network");
			if (!svg[0][0]) {
				svg = d3.select("#network")
					.append("svg")
					.classed("network", true)
					.attr("width", width)
					.attr("height", height);
			}

			var link = svg.selectAll(".link")
				.data(_data.links, function(d) { return d.target.id; });

			link.exit().remove();

			link.enter().insert("line", ".node")
				.attr("class","link")
				.append("line")
				.style("stroke","#ccc")
				.style("stroke-width",1);

			var node_drag = d3.behavior.drag()
				.on("dragstart", dragstart)
				.on("drag", dragmove)
				.on("dragend", dragend);

			function dragstart(d, i) {
				d.fixed = true;
				force.stop() // stops the force auto positioning before you start dragging
			}

			function dragmove(d, i) {
				d.px += d3.event.dx;
				d.py += d3.event.dy;
				d.x += d3.event.dx;
				d.y += d3.event.dy; 
				tick(); // this is the key to make it work together with updating both px,py,x,y on d !
			}

			function dragend(d, i) {
				tick();
				force.resume();
			}

			var node = svg.selectAll(".node")
				.data(_data.nodes, function(d) { return d.id; })
				.attr("class", function(d) {
					if (d.selected) return "node selected clickable";
					else return "node clickable";
				});

			node.exit().remove();
			var nodeEnter = node.enter()
				.append("g")
				.attr("class",function(d) {
					if (d.selected) return "node selected clickable";
					else return "node clickable";
				})
				.call(node_drag);

			nodeEnter.append("circle")
				.attr("r", 10);

			// nodeEnter.on("mouseover", function(d) {
			// 		d3.select(this)
			// 			.append("text")
			// 			.attr("class", "nodetext")
			// 			.attr("dx", 12)
			// 			.attr("dy", ".35em")
			// 			.text(function(d) { return d.id });
			// 	})
			// 	.on("mouseout", function(d) {
			// 		d3.select(this)
			// 			.select("text")
			// 			.remove()
			// 	});

			node.select("circle")
				.attr("data-toggle","tooltip")
				.attr("data-placement","top")
				.attr("title", function(d) {
					return d.id;
				})
				.style("fill",function(d,i) { return colorScale(d.type); });

			$(document).ready(function () {
				$("svg circle").tooltip({
					"container": "body",
					"placement": "top"
				});
			});

			force.on("tick", tick);

			function tick() {
				link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; })
					.style("stroke-width", function(d) { return lineThicknessScale(d.weight); });

				node.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});

				node.attr("x", function(d) { 
						if (d.selected && !d.fixed) return d.x = width/2;
						else return d.x = Math.max(16, Math.min(width - 16, d.x));
					})
					.attr("y", function(d) { 
						if (d.selected && !d.fixed) return d.y = height/2;
						else return d.y = Math.max(16, Math.min(height - 16, d.y)); 
					});
			
			}
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

d3.sma.barChart = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 40},
		height = 500,
		width = 450,
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

			svg = d3.select(".bar-chart");
			if (!svg[0][0]) {
				svg = d3.select("#bar-chart")
					.append("svg")
					.classed("bar-chart", true);
			
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

d3.sma.treeMap = function module() {
	var margin = {top: 20, right: 20, bottom: 40, left: 60},
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
					console.log(d._id);
					dispatch.customClick(d._id);
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

			var circle = svg.selectAll("circle")
				.data(data);

			circle.exit().remove();
			
			circle.enter()
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
			console.log("hey");

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

