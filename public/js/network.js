d3.sma.network = function module() {
	var width = 800,
		height = 648;

	var svg;
		
	function exports(_selection) {
		_selection.each(function(_data) {
			console.log(_data);

			var force = d3.layout.force()
				.nodes(_data.nodes)
				.links(_data.links)
				.gravity(.05)
				.distance(100)
				.charge(-100)
				.size([width, height])
				.start();

			var colors = d3.scale.ordinal().domain(["hashtag","user_mention","url"]).range(["#1f77b4","#ff7f0e","#2ca02c"]);
			var lineThicknessScale = d3.scale.linear().domain([1,d3.max(_data.links,function(d) {return d.weight;})]).range([1,5]);

			if (!svg) {
				svg = d3.select("body")
					.append("svg")
					.attr("width", width)
					.attr("height", height);
			}

			var links = svg.selectAll("line")
				.data(_data.links)
				.enter()
				.append("line")
				.style("stroke","#ccc")
				.style("stroke-width",1);

			var node_drag = d3.behavior.drag()
				.on("dragstart", dragstart)
				.on("drag", dragmove)
				.on("dragend", dragend);

			function dragstart(d, i) {
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
				d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
				tick();
				force.resume();
			}

			var nodes = svg.selectAll("g.node")
				.data(_data.nodes)
				.enter().append("g")
				.attr("class","node")
				.call(node_drag);

			nodes.on("mouseover", function(d) {
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

			nodes.append("circle")
				.attr("r", 10)
				.style("fill",function(d,i) {return colors(d.type);})

			force.on("tick", tick);

			function tick() {

				links.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; })
					.style("stroke-width", function(d) { return lineThicknessScale(d.weight); });

				nodes.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});

				nodes.attr("x", function(d) {return d.x = Math.max(16, Math.min(width - 16, d.x));})
					.attr("y", function(d) {return d.y = Math.max(16, Math.min(height - 16, d.y));});
			
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

