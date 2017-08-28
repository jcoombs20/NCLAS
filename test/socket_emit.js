function socket_emit() {
	makeGraph();

	socket = io.connect('http://ecosheds.org:3413');

	socket.emit('get_tables');

	socket.on('get_tables', function(layData) {
		//console.log(JSON.stringify(layData));
		layerDiv = document.getElementById("layers");
		layer = document.createElement("select");
		layer.multiple = false;
		layer.name = "layerSel";
		layer.id = "selLayer";
		layer.style.margin = "5px";
		layer.setAttribute("onchange", "get_columns(this.selectedIndex)");
		for (i=0; i<layData.length; i++) {
			layerOpt = document.createElement("option");
			layerOpt.value = i;
			layerOpt.id = "layerOpt" + i;
			layerOpt.innerHTML = layData[i].a;
			layer.appendChild(layerOpt);
			}
		layerDiv.appendChild(layer);
		get_columns(layer.selectedIndex);
		});

	socket.on('get_columns', function(colData) {
		//console.log(JSON.stringify(colData));
		layerDiv = document.getElementById("layers");
		if (document.getElementById("selColumn") == null) {
			//console.log("doesn't exist")
			column = document.createElement("select");
			column.multiple = false;
			column.name = "columnSel";
			column.id = "selColumn";
			column.style.margin = "5px";
			column.setAttribute("onchange", "get_data(this.selectedIndex)");
			layerDiv.appendChild(column);
			}
		else {
			//console.log("exists");
			column = document.getElementById("selColumn");
			for (i=column.options.length-1; i>=0; i--) {
				column.remove(i);
				}
			}

		for (i=0; i<colData.length; i++) {
			columnOpt = document.createElement("option");
			columnOpt.value = i;
			columnOpt.id = "columnOpt" + i;
			tmpType = colData[i].b.split(" ");
			columnOpt.innerHTML = colData[i].a + " (" + tmpType[0] + ")";
			column.appendChild(columnOpt);
			}
		layerDiv.appendChild(column);
		get_data(column.selectedIndex);
		});

	socket.on('get_data', function(tmpData) {
		//console.log(JSON.stringify(tmpData))
		modCnt = 0;
		if (tmpType[1] == "character") {
			updateChar(tmpData);
			}
		else {
			updateVal(tmpData);
			}
		});

	socket.on('disconnect', function(err) {
		//alert('Socket has been disconnected');
		});
	socket.on('error', function(err) {
		socket.emit('disconnect');
		alert(err.error);
		});
	}

function get_columns(i) {
	data = {"layer": document.getElementById("selLayer").options[i].text}
	socket.emit('get_columns', data);
	}

function get_data(i) {
	tmpType = document.getElementById("selColumn").options[i].text.split(" ");
	tmpType[1] = tmpType[1].replace("(", "");
	tmpType[1] = tmpType[1].replace(")", "");
	layer = document.getElementById("selLayer");
	data = {"layer": layer.options[layer.selectedIndex].text, "column": tmpType[0], "type": tmpType[1]}
	socket.emit('get_data', data);
	}
