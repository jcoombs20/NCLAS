function makeGraph() {
	
	margin = {top: 20, right: 50, bottom: 150, left: 100},
		width = 1000,
		height = 500;

	y = d3.scale.linear()
		.range([height, 0]);

	yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(5);

	chart = d3.select(".chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	minXNum = document.getElementById("minXNum");
	maxXNum = document.getElementById("maxXNum");
	minYNum = document.getElementById("minYNum");
	maxYNum = document.getElementById("maxYNum");

	}

function updateChar(data) {
	tmpData = data;
	document.getElementById("regraph").style.display = "none";
	modCnt += 1;

	if (modCnt == 1) {
		minXNum.value = 0;
		maxXNum.value = data.length;
		partData = data.slice(+minXNum.value, +maxXNum.value);

		x = d3.scale.ordinal()
			.rangeRoundBands([0, width], 0.3)
			.domain(partData.map(function(d) { return d.a; }));
		}
	else {
		partData = data.slice(+minXNum.value, +maxXNum.value);

		x = d3.scale.ordinal()
			.rangeRoundBands([0, width], 0.3)
			.domain(partData.map(function(d) { return d.a; }));
		}

	xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	if (modCnt == 1) {
		minYNum.value = 0;
		maxYNum.value = d3.max(data, function(d) { return +d.b; })

		y.domain([+minYNum.value, +maxYNum.value]);
		}
	else {
		y.domain([+minYNum.value, +maxYNum.value]);
		}		


	chart.selectAll(".axis").remove();

	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("transform", function(d) { return "rotate(-45)" });
			
	chart.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	chart.append("text")
		.attr("class", "txtLabels")
		.attr("transform", "rotate(-90)")
		.attr("x", -(height/2))
		.attr("y", -margin.left)
		.attr("dy", "0.75em")
		.text("Count");

	chart.append("text")
		.attr("class", "txtLabels")
		.attr("x", (width/2))
		.attr("y", height + margin.bottom)
		.text("Class");

	selection = chart.selectAll(".bar")
		.data(partData)
			.attr("x", function(d) { return x(d.a); })
			.attr("y", function(d) { return y(d.b); })
			.attr("height", function(d) { return height - y(d.b); })
			.attr("width", x.rangeBand())
			.attr("id", function(d) { return d.b; })
			.on("mouseenter", function() {showVal(this.id, d3.mouse(this)) })
			.on("mouseleave", function() {hideVal() });

	selection.enter()
		.append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.a); })
			.attr("y", function(d) { return y(d.b); })
			.attr("height", function(d) { return height - y(d.b); })
			.attr("width", x.rangeBand())
			.attr("id", function(d) { return d.b; })
			.on("mouseenter", function() {showVal(this.id, d3.mouse(this)) })
			.on("mouseleave", function() {hideVal() });

	selection.exit().remove();

	document.getElementById("bins").style.display = "none";
	document.getElementById("refresh").setAttribute("onclick", "updateChar(tmpData)");
	}

function updateVal(values) {
	tmpData = values;
	valArray = values.map(function (i) { return +i.a; });
	document.getElementById("regraph").style.display = "none";
	modCnt += 1;

	if (modCnt == 1) {
		minXNum.value = d3.min(values, function(d) {return +d.a; })
		maxXNum.value = d3.max(values, function(d) { return +d.a; })
		}
		
	bins = +document.getElementById("binNum").value;

	binData = d3.layout.histogram()
		.bins(bins)
		(valArray);

	i = 0;
	while (binData[i].x <= +minXNum.value) {
		i += 1;
		}
	lowX = i - 1;

	i = binData.length -1;
	while (binData[i].x > +maxXNum.value) {
		i -= 1;
		}
	highX = i + 1;

	x = d3.scale.linear()
		.range([0, width])
		.domain([binData[lowX].x, (binData[highX-1].x + binData[highX-1].dx)]);

	partData = binData.slice(lowX, highX);

	xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	if (modCnt == 1) {
		minYNum.value = 0;
		maxYNum.value = d3.max(binData, function(d) { return +d.y; })

		y.domain([+minYNum.value, +maxYNum.value]);
		}
	else {
		y.domain([+minYNum.value, +maxYNum.value]);
		}		

	chart.selectAll(".axis").remove();

	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("transform", function(d) { return "rotate(-45)" });
			
	chart.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	chart.append("text")
		.attr("class", "txtLabels")
		.attr("transform", "rotate(-90)")
		.attr("x", -(height/2))
		.attr("y", -margin.left)
		.attr("dy", "0.75em")
		.text("Count");

	chart.append("text")
		.attr("class", "txtLabels")
		.attr("x", (width/2))
		.attr("y", height + margin.bottom)
		.text("Class");

	selection = chart.selectAll(".bar")
		.data(partData)
			.attr("x", function(d) { return x(d.x); })
			.attr("y", function(d) { return y(d.y); })
			.attr("height", function(d) { return height - y(d.y); })
			.attr("width", function(d) {return ((x(d.x + d.dx) - x(d.x)) - 1); })
			.attr("id", function(d,i) { return i; })
			.on("mouseenter", function() {showVal(this.id, d3.mouse(this)) })
			.on("mouseleave", function() {hideVal() });

	selection.enter()
		.append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.x); })
			.attr("y", function(d) { return y(d.y); })
			.attr("height", function(d) { return height - y(d.y); })
			.attr("width", function(d) {return ((x(d.x + d.dx) - x(d.x)) - 1); })
			.attr("id", function(d,i) { return i; })
			.on("mouseenter", function() {showVal(this.id, d3.mouse(this)) })
			.on("mouseleave", function() {hideVal() });

	selection.exit().remove();

	document.getElementById("bins").style.display = "inline";
	document.getElementById("refresh").setAttribute("onclick", "updateVal(tmpData)");
	}


function showVal(tmpI, tmpPos) {
	chart.selectAll(".textShow").remove();
	chart.selectAll(".rectShow").remove();

	if (tmpType[1] == "character") {
		tmpText = "Count: " + tmpI;
		}
	else {
		statData = binData.slice(+tmpI, +tmpI + 1);
		flatStat = statData.reduce(function(a,b) { return a.concat(b); });
		tmpText = "Count: " + flatStat.y + " | Range: " + d3.min(flatStat) + "-" + d3.max(flatStat) + " | Mean: " + d3.mean(flatStat).toFixed(2);
		}

	chart.append("rect")
		.attr("class", "rectShow")
		.style("opacity", 0)
		.transition()
		.duration(750)
		.style("opacity", 0.9);

	chart.append("text")
		.attr("class", "textShow")
		.attr("id", "textShow")
		.attr("x", tmpPos[0] + 10)
		.attr("y", tmpPos[1] - 15)
		.text(tmpText)
		.style("opacity", 0)
		.transition()
		.duration(750)
		.style("opacity", 1);

	textShow = document.getElementById("textShow");
	textDim = textShow.getBBox();

	//Fix display x
	if ((tmpPos[0] + textDim.width + 20) <= width) {
		var tmpX = tmpPos[0];
		}
	else {
		var tmpX = tmpPos[0] - ((tmpPos[0] + textDim.width + 20) - width);
		d3.select("#textShow").attr("x", tmpPos[0] -((tmpPos[0] + 10 + textDim.width) - width)); 
		}

	//Fix display y
	if ((tmpPos[1] - textDim.height - 20) >= 0) {
		var tmpY = tmpPos[1] - 20 - textDim.height;
		}
	else {
		var tmpY = 0;
		d3.select("#textShow").attr("y", textDim.height + 5); 
		}


	rectShow = chart.select(".rectShow")
		.attr("x", tmpX)
		.attr("y", tmpY)
		.attr("width", textDim.width + 20)
		.attr("height", textDim.height + 20)
		.attr("rx", 10)
		.attr("ry", 10);
	}

function hideVal() {
	chart.selectAll(".textShow")
		.transition()
		.duration(750)
		.style("opacity", 1e-6)
		.remove();

	chart.selectAll(".rectShow")
		.transition()
		.duration(750)
		.style("opacity", 1e-6)
		.remove();
	}

function regraph(event) {
	graphOpt = document.getElementById("regraph");
	graphOpt.style.position="fixed";
	graphOpt.style.left = event.clientX + "px";
	graphOpt.style.top = event.clientY + "px";
	graphOpt.style.zIndex="100000";
	graphOpt.style.display = "inline";
	}

function defaultVal(id) {
	switch (id) {
		case 0:
			if (tmpType[1] == "character") {
				minXNum.value = 0;
				}
			else {
				minXNum.value = d3.min(tmpData, function(d) {return +d.a; })
				}
			break;
		case 1:
			if (tmpType[1] == "character") {
				maxXNum.value = tmpData.length;
				}
			else {
				maxXNum.value = d3.max(tmpData, function(d) {return +d.a; })
				}
			break;
		case 2:
			if (tmpType[1] == "character") {
				minYNum.value = 0;
				}
			else {
				minYNum.value = 0;
				}
			break;

 		case 3:
			if (tmpType[1] == "character") {
				maxYNum.value = d3.max(tmpData, function(d) { return +d.b; })
				}
			else {
				maxYNum.value = d3.max(binData, function(d) { return +d.y; })
				}
			break;
		case 4:
			document.getElementById("binNum").value = 20;
			modCnt = 0;
			break;
		}
	}
