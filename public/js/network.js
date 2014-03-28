d3.sma.network = function module() {
	var width = 400,
		height = 500;

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
				.attr("class",function(d) {
					if (d.selected) return "node selected";
					else return "node";
				});

			node.exit().remove();
			var nodeEnter = node.enter()
				.append("g")
				.attr("class",function(d) {
					if (d.selected) return "node selected";
					else return "node";
				})
				.call(node_drag);

			nodeEnter.append("circle")
				.attr("r", 10);

			nodeEnter.on("mouseover", function(d) {
					d3.select(this)
						.append("text")
						.attr("class", "nodetext")
						.attr("dx", 12)
						.attr("dy", ".35em")
						.text(function(d) { return d.id });
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.select("text")
						.remove()
				});

			node.select("circle")
				.style("fill",function(d,i) { return colorScale(d.type); });

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

