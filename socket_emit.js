function socket_emit() {
  socket = io.connect('http://ecosheds.org:3413');


  socket.on('get_spp', function(sppData) {
    var sppExc = sppData[0].map(function(d) { return d.species; });
    var sppNoExc = sppData[1].map(function(d) { return d.species; });
    var sppNoExcFilter = sppNoExc.filter(function(spp) { if(sppExc.indexOf(spp) > -1) {return false;} else {return true;} });

    addSpeciesNames(sppExc,sppNoExcFilter);
  });


  socket.on('get_output', function(tmpData) {
    console.log(tmpData);
    //******Remove old graphs
    d3.select("#resFigsDiv")
      .selectAll(".canvasChartSmall")
      .remove();

    d3.select("#resTabsDiv")
      .selectAll(".canvasChartSmall")
      .remove();


    switch (document.querySelector('input[name=outRadio]:checked').value) {
      case "basic":
        //***tmpData is 0: fig15 data, 1: fig2 data
        fig15a(tmpData[0]);
        fig15b(tmpData[0]);
        fig2a(tmpData[1]);

        tab3b([tmpData[2],tmpData[3]]);
        tab3c([tmpData[2],tmpData[3]]);                
        break;
      case "tail":
        
        break;
      case "comp":
        //***tmpData is 0: fig15 data, 1: fig2 data
        fig15a(tmpData[0]);
        fig15b(tmpData[0]);
        fig15bi([tmpData[0],tmpData[1]]);
        fig2a(tmpData[2]);
        fig2b(tmpData[2]);
        fig2bi([tmpData[2],tmpData[3]]);
        fig11a(tmpData[4]);
        fig12a(tmpData[4]);
        fig12b(tmpData[4]);
        fig3a(tmpData[5]);
        fig4a(tmpData[5]);
        fig4c(tmpData[5]);
        fig1a(tmpData[6]);
        fig1b(tmpData[6]);
        fig9a(tmpData[7]);
        fig9b(tmpData[7]);
        fig13e(tmpData[7]);
        fig13h(tmpData[7]);
        fig13g(tmpData[7]);
        fig6c(tmpData[8]);
        fig13f(tmpData[7]);
        fig13a(tmpData[7]);
        fig13d(tmpData[7]);
        fig13c(tmpData[7]);
        fig6a(tmpData[8]);
        fig13b(tmpData[7]);

        tab3b([tmpData[8],tmpData[9]]);
        tab3c([tmpData[8],tmpData[9]]);
        break;
    }

    $('#outputDiv').modal('hide')
    d3.select("#waitingDiv").style("display", "none");
    d3.select("#outputPreview").style("display", "none");
    d3.select("#outputOptions").style("display", "block");
    d3.selectAll(".choice").style("display", "none");
    d3.select("#resChoice").style("display", "block");
  });


  socket.on('disconnect', function(err) {
    console.log('Socket has been disconnected');
  });


  socket.on('error', function(err) {
    console.log(err.error);
  });
}


//******View large version of figure/table in center window
function viewFig(tmpID) {
  d3.select("#container-results")
    .selectAll("#canvasChartsLargeDiv,#downloadJPEG")
    .remove();

  //***Make button to save graph as JPEG
  d3.select("#container-results")
    .append("div")
    .attr("id", "downloadJPEG")
    .attr("class", "cl_select")
    .property("title", "Click to download graph as a JPEG")
    .html('<a id="dlJPEGLink" href="#" download="' + tmpID + ".jpg" + '"><span> Download Graph </span></a>');

  d3.select("#container-results")
    .append("div")
    .attr("class", "canvasChartsLarge")
    .attr("id", "canvasChartsLargeDiv")
    .html('<canvas id="' + tmpID + 'Large"></canvas>');
  
  chartOpts[tmpID].large.options.layout.padding = {top:10, right:10, bottom:10, left:10};

  var ctx = document.getElementById(tmpID + "Large").getContext('2d');
  chartCanvas[tmpID + "Large"] = new Chart(ctx, chartOpts[tmpID].large);

  d3.select("#container-results").style("display", "block");
  resizePanels();


  //***Make another canvas for saving as JPEG
  d3.select("#canvasPrint")
    .remove();

  d3.select("html")
    .append("div")
    .attr("id", "canvasPrint")
    .html('<canvas id="' + tmpID + 'Print"></canvas>');

  if(!tmpID.includes("fig12") && !tmpID.includes("fig4") && !tmpID.includes("fig9") && !tmpID.includes("fig13") && !tmpID.includes("fig6")) {
    for (i = 0; i < chartOpts[tmpID].print.data.datasets.length; i++) {
      chartOpts[tmpID].print.data.datasets[i].borderColor = 'black';
    }
  }
  chartOpts[tmpID].print.options.title.fontSize = 40;
  if(tmpID.includes("tab")) {
    chartOpts[tmpID].print.options.layout.padding = {top: 105, right: 15, bottom: 40, left: 15};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint("Numbers", tmpID);          
    chartOpts[tmpID].print.options.scales.yAxes[0].ticks.fontSize = 20;          
  }
  else {
    chartOpts[tmpID].print.options.layout.padding = {top: 15, right: 15, bottom: 40, left: 15};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint(d3.select("#" + tmpID).attr("value"), tmpID);          
    chartOpts[tmpID].print.options.scales.yAxes[0].ticks.fontSize = 35;          
  }
  chartOpts[tmpID].print.options.scales.xAxes[1].scaleLabel.fontSize = 35;
  if(tmpID.includes("fig11") || tmpID.includes("fig12") || tmpID.includes("fig3") || tmpID.includes("fig4") || tmpID.includes("fig9")  || tmpID.includes("fig13") || tmpID.includes("fig6") || tmpID.includes("tab3")) {
    chartOpts[tmpID].print.options.scales.xAxes[0].scaleLabel.fontSize = 35;          
  }
  chartOpts[tmpID].print.options.scales.yAxes[0].scaleLabel.fontSize = 35;

  var ctx = document.getElementById(tmpID + "Print").getContext('2d');
  chartCanvas[tmpID + "Print"] = new Chart(ctx, chartOpts[tmpID].print); 

  //***Add metadata
  setTimeout(function() {
    var tmpPrint = chartCanvas[tmpID + "Print"];
    var tmpRect = document.getElementById(tmpID + "Print").getBoundingClientRect();
    if(tmpID.includes("tab")) {
      addInfo(tmpPrint, chartOpts[tmpID].print.cl[0], tmpRect, "print", 1);
    }
    var ctx = tmpPrint.canvas.getContext("2d")
    ctx.font = "normal 12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Downloaded " + new Date().toJSON().slice(0,10) + " from N-CLAS     |     N Deposition: Mean Total Deposition (2013-2015)", (tmpRect.width - 15), (tmpRect.height - 15));
    var link = document.getElementById(tmpID + "Print").toDataURL('image/jpeg', 1.0);
    d3.select("#dlJPEGLink").attr("href", link);
    d3.select("#" + tmpID + "Print").style("display", "none");
  }, 300);

  d3.select("#canvasPrint").style("display", "block");
}  



//******Function to add Table title and info to canvas
function addInfo(tmpPrint, tmpInfo, tmpRect, type, tmpWidth) {
  var t = tmpInfo.table;
  var ctx = tmpPrint.canvas.getContext("2d")
  switch(type) {
    case "small":
      var fontSizes = [6, 4];
      var fontY = [3, 14, 23, 32, 41];
      break;
    case "large":
      var fontSizes = [(23 + (23 * (tmpWidth * 0.15))), (19 + (19 * (tmpWidth * 0.15)))];
      var fontY = [(7 + (7 * (tmpWidth * 0.15))), (42 + (42 * (tmpWidth * 0.15))), (72 + (72 * (tmpWidth * 0.15))), (102 + (102 * (tmpWidth * 0.15))), (132 + (132 * (tmpWidth * 0.15)))];
      break;
    case "print":
      var fontSizes = [30, 25];
      var fontY = [15, 55, 90, 125, 160];
      break;
  }
  ctx.font = "bold " + fontSizes[0] + "px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(tmpInfo.title, fontY[0], fontY[0]);
  ctx.font = "normal " + fontSizes[0] + "px Arial";
  ctx.fillText("Area: " + tmpInfo.region, fontY[0], fontY[1]);
  ctx.fillText("Site: " + tmpInfo.region_name, fontY[0], fontY[2]);
  if($("input[name=outScreen4]:checked").length > 0) {
    if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
      ctx.fillText("Size (ha): " + tmpInfo.area_ha.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontY[0], fontY[3]);
    }
    else {
      ctx.fillText("Size (ac): " + tmpInfo.area_acres.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontY[0], fontY[3]);
    }
  }
  else {
    ctx.fillText("Size (ac): " + tmpInfo.area_acres.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontY[0], fontY[3]);
  }
  ctx.fillText("N Deposition (kg/ha/yr): " + tmpInfo.min.toFixed(1) + " to " + tmpInfo.max.toFixed(1), fontY[0], fontY[4]);
  switch(type) {
    case "small":
      ctx.drawImage(legImg[t],(tmpRect.width - ((legImg[t].width * 0.2) + 3)),3, (legImg[t].width * 0.2), (legImg[t].height * 0.2));
      break;
    case "large":
      legWidth = legImg[t].width/1.5;
      legHeight = legImg[t].height/1.5;
      var canRect = document.getElementById("canvasChartsLargeDiv").getBoundingClientRect();
      ctx.drawImage(legImg[t],(canRect.width - (legWidth + (legWidth * (tmpWidth * 0.5)) + 10)),(7 + (7 * (tmpWidth * 0.5))), (legWidth + (legWidth * (tmpWidth * 0.5))), (legHeight + (legHeight * (tmpWidth * 0.5))));
      break;
    case "print":
      ctx.drawImage(legImg[t],(tmpRect.width - (legImg[t].width + 10)),15);
      break;
  }
}



//******Function to adjust font size for each area in large graph
function setFontSizePrint(tmpArea, tmpID) {
  switch(tmpArea) {
    case "States":
      var tmpSize = 22;
      break;
    case "Ecoregions Combined":
      var tmpSize = 30;
      break;
    case "Ecoregions Level 2":
      var tmpSize = 30;
      break;
    case "Ecoregions Level 3":
      var tmpSize = 16;
      break;
    case "Forest Service Wilderness Areas":
      var tmpSize = 6.5;
      break;
    case "Forest Service Admin Areas":
      var tmpSize = 17;
      break;
    case "Class I Areas":
      var tmpSize = 22;
      break;
    case "Species":
      var tmpSize = 20;
      break;
    case "Numbers":
      if(tmpID.includes("tab")) {
        var tmpSize = 20;
      }
      else {
        var tmpSize = 30;
      }
      break;
  }
  return tmpSize;
}



//******Function to adjust font size for each area in large graph
function setFontSizeLarge(tmpArea, tmpID) {
  switch(tmpArea) {
    case "States":
      var tmpSize = 8;
      break;
    case "Ecoregions Combined":
      var tmpSize = 12;
      break;
    case "Ecoregions Level 2":
      var tmpSize = 12;
      break;
    case "Ecoregions Level 3":
      var tmpSize = 6;
      break;
    case "Forest Service Wilderness Areas":
      var tmpSize = 2.5;
      break;
    case "Forest Service Admin Areas":
      var tmpSize = 7;
      break;
    case "Class I Areas":
      var tmpSize = 7;
      break;
    case "Species":
      var tmpSize = 8;
      break;
    case "Numbers":
      if(tmpID.includes("tab")) {
        var tmpSize = 8;
      }
      else {
        var tmpSize = 11;
      }
      break;
  }
  return tmpSize;
}


//******Function to adjust font size for each area in small graph
function setFontSizeSmall(tmpArea, tmpID) {
  switch(tmpArea) {
    case "States":
      var tmpSize = 4;
      break;
    case "Ecoregions Combined":
      var tmpSize = 7;
      break;
    case "Ecoregions Level 2":
      var tmpSize = 7;
      break;
    case "Ecoregions Level 3":
      var tmpSize = 2;
      break;
    case "Forest Service Wilderness Areas":
      var tmpSize = 1;
      break;
    case "Forest Service Admin Areas":
      var tmpSize = 2;
      break;
    case "Class I Areas":
      var tmpSize = 3;
      break;
    case "Species":
      var tmpSize = 3;
      break;
    case "Numbers":
      if(tmpID.includes("tab")) {
        var tmpSize = 3;
      }
      else {
        var tmpSize = 4;
      }
      break;
  }
  return tmpSize;
}



//******Function to split long labels into arrays
function formatLabel(str, maxwidth){
  var sections = [];
  var words = str.split(" ");
  var temp = "";

  words.forEach(function(item, index) {
    if(temp.length > 0) {
      var concat = temp + ' ' + item;
      if(concat.length > maxwidth) {
        sections.push(temp);
        temp = "";
      }
      else {
        if(index == (words.length - 1)) {
          sections.push(concat);
          return;
        }
        else {
          temp = concat;
          return;
        }
      }
    }

    if(index == (words.length - 1)) {
      sections.push(item);
      return;
    }

    if(item.length < maxwidth) {
      temp = item;
    }
    else {
      sections.push(item);
    }
  });
  return sections;
}




function getDivide(tmpVal) {
  if(tmpVal.length == 1) {
    if(tmpVal[0] < 1000) {
      var tmpDivide = 1;
      var tmpDivideLabel = "";
    }
    else if(tmpVal[0] < 1000000) {
      var tmpDivide = 1000;
      var tmpDivideLabel = "(thousands)";
    }
    else {
      var tmpDivide = 1000000;
      var tmpDivideLabel = "(millions)";
    }
  }
  else if(tmpVal.length == 2) {
    if(tmpVal[0] < 1000 && tmpVal[1] < 1000) {
      var tmpDivide = 1;
      var tmpDivideLabel = "";
    }
    else if(tmpVal[0] < 1000000 && tmpVal[1] < 1000000) {
      var tmpDivide = 1000;
      var tmpDivideLabel = "(thousands)";
    }
    else {
      var tmpDivide = 1000000;
      var tmpDivideLabel = "(millions)";
    }
  }

  return [tmpDivide, tmpDivideLabel];
}





function fig15a(tmpData) {
  //******Figure 15A
  d3.select("#resFigsDiv")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="fig15a" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.region_name.filterFunction(function(d) { return topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].names.indexOf(d) > -1; });

  var filtData = exc.filter.percentage.bottom(Infinity);
  var tmpPercent = filtData.map(function(d) { return d.percentage; });
  var tmpAreas = filtData.map(function(d) { return d.region_name; });

  //***Split area titles if more than 5 are present
  tmpAreas.forEach(function(d,i) {
    if(tmpAreas.length > 5) {
      tmpAreas[i] = formatLabel(d,13);
    }
  });

  
  chartOpts.fig15a = {};
  
  //***Small graph
  chartOpts.fig15a.small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts.fig15a.small.data.labels = tmpAreas;
  chartOpts.fig15a.small.data.datasets[0].data = tmpPercent;
  chartOpts.fig15a.small.options.onClick = function(evt, tmpArray) { viewFig("fig15a"); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig15a").classed("selected", true);};
  chartOpts.fig15a.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15a.small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
  chartOpts.fig15a.small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall(d3.select("#areaList").attr("value"), "fig15a");
  chartOpts.fig15a.small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";

  //***Large graph
  chartOpts.fig15a.large = JSON.parse(JSON.stringify(chartOpts.fig15a.small));
  chartOpts.fig15a.print = JSON.parse(JSON.stringify(chartOpts.fig15a.small));


  var fig15a_ctx = document.getElementById("fig15a").getContext('2d');
  chartCanvas["fig15aSmall"] = new Chart(fig15a_ctx, chartOpts.fig15a.small);
}




function fig15b(tmpData) {
  //******Figure 15B
  d3.select("#resFigsDiv")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="fig15b" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.region_name.filterFunction(function(d) { return topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].names.indexOf(d) > -1; });

  var filtData = exc.filter.count.bottom(Infinity);
  var tmpAcres = filtData.map(function(d) { return d.count * 0.2223945; });
  var tmpAreas = filtData.map(function(d) { return d.region_name; });

  //***Split area titles if more than 5 are present
  tmpAreas.forEach(function(d,i) {
    if(tmpAreas.length > 5) {
      tmpAreas[i] = formatLabel(d,13);
    }
  });

  //***Check to see if hectares has been selected as preferred unit
  var tmpAreaLabel = "Acres";
  if($("input[name=outScreen4]:checked").length > 0) {
    if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
      tmpAreaLabel = "Hectares";
      tmpAcres.forEach(function(d,i) {
        tmpAcres[i] = d * 0.404686;
      });
    }
  }

  var divUnits = getDivide([tmpAcres[tmpAcres.length - 1]]);
  var tmpDivide = divUnits[0];
  var tmpDivideLabel = divUnits[1];

  tmpAcres.forEach(function(d,i) {
    tmpAcres[i] = (d/tmpDivide).toFixed(5);
  });

  chartOpts.fig15b = {};

  //***Small graph
  chartOpts.fig15b.small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts.fig15b.small.data.labels = tmpAreas;
  chartOpts.fig15b.small.data.datasets[0].data = tmpAcres;
  chartOpts.fig15b.small.options.onClick = function(evt, tmpArray) { viewFig("fig15b"); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig15b").classed("selected", true);};
  chartOpts.fig15b.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15b.small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
  chartOpts.fig15b.small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall(d3.select("#areaList").attr("value"), "fig15b");
  chartOpts.fig15b.small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";

  //***Large graph
  chartOpts.fig15b.large = JSON.parse(JSON.stringify(chartOpts.fig15b.small));
  chartOpts.fig15b.print = JSON.parse(JSON.stringify(chartOpts.fig15b.small));

  var fig15b_ctx = document.getElementById("fig15b").getContext('2d');
  chartCanvas["fig15bSmall"] = new Chart(fig15b_ctx, chartOpts.fig15b.small);
}



function fig15bi(tmpData) {
  //******Figure 15BI
  d3.select("#resFigsDiv")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="fig15bi" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

  //***Exceedance
  var tmpCF = crossfilter(tmpData[0]);
  var exc = {filter:{}};
  exc.keys = d3.keys(tmpData[0][0]);
  exc.vals = d3.values(tmpData[0][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.region_name.filterFunction(function(d) { return topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].names.indexOf(d) > -1; });

  var filtData = exc.filter.count.bottom(Infinity);
  var excAcres = filtData.map(function(d) { return d.count * 0.2223945; });
  var excAreas = filtData.map(function(d) { return d.region_name; });


  //***No Exceedance
  var tmpCF = crossfilter(tmpData[1]);
  var excNo = {filter:{}};
  excNo.keys = d3.keys(tmpData[1][0]);
  excNo.vals = d3.values(tmpData[1][0]);

  excNo.keys.forEach(function(key, i) {
    excNo.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var filtData = excNo.filter.count.top(Infinity);
  var excNoAcres = [];
  excAreas.forEach(function(area,i) {
    for(obj in filtData) {
      if(filtData[obj].region_name == area) {
       excNoAcres[i] = filtData[obj].count * 0.2223945;
      } 
    }
  });

  //***Split area titles if more than 5 are present
  excAreas.forEach(function(d,i) {
    if(excAreas.length > 5) {
      excAreas[i] = formatLabel(d,13);
    }
  });

  //***Check to see if hectares has been selected as preferred unit
  var tmpAreaLabel = "Acres";
  if($("input[name=outScreen4]:checked").length > 0) {
    if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
      tmpAreaLabel = "Hectares";
      excAcres.forEach(function(d,i) {
        excAcres[i] = d * 0.404686;
        excNoAcres[i] = excNoAcres[i] * 0.404686;
      });
    }
  }

  var divUnits = getDivide([excAcres[excAcres.length - 1], Math.max(...excNoAcres)]);
  var tmpDivide = divUnits[0];
  var tmpDivideLabel = divUnits[1];

  excAcres.forEach(function(d,i) {
    excAcres[i] = (d/tmpDivide).toFixed(5);
    excNoAcres[i] = (excNoAcres[i]/tmpDivide).toFixed(5);
  });


  chartOpts.fig15bi = {};

  //***Small graph
  chartOpts.fig15bi.small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts.fig15bi.small.data.labels = excAreas;
  chartOpts.fig15bi.small.data.datasets[0].data = excAcres;
  chartOpts.fig15bi.small.data.datasets[0].label = "Exceedance of CL";
  chartOpts.fig15bi.small.data.datasets.push({
    data: excNoAcres,
    label: "No Exceedance of CL",
    backgroundColor: 'rgba(189, 215, 238, 1)',
    borderColor: 'rgba(189, 215, 238, 1)',
    borderWidth: 2,
    hoverBackgroundColor: 'rgba(189, 215, 238, 0.8)',
    hoverBorderColor : 'black'
  });
  chartOpts.fig15bi.small.options.legend.display = true;
  chartOpts.fig15bi.small.options.legend.position = 'bottom';
  chartOpts.fig15bi.small.options.legend.labels.fontSize = 6;
  chartOpts.fig15bi.small.options.legend.labels.boxWidth = 6;
  chartOpts.fig15bi.small.options.onClick = function(evt, tmpArray) { viewFig("fig15bi"); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig15bi").classed("selected", true);};
  chartOpts.fig15bi.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15bi.small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
  chartOpts.fig15bi.small.options.scales.yAxes[0].stacked = true;
  chartOpts.fig15bi.small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall(d3.select("#areaList").attr("value"), "fig15bi");
  chartOpts.fig15bi.small.options.scales.xAxes[0].stacked = true;
  chartOpts.fig15bi.small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";
  chartOpts.fig15bi.small.options.scales.xAxes[1].stacked = true;

  //***Large graph
  chartOpts.fig15bi.large = JSON.parse(JSON.stringify(chartOpts.fig15bi.small));
  chartOpts.fig15bi.large.options.legend.labels.padding = 25;

  chartOpts.fig15bi.print = JSON.parse(JSON.stringify(chartOpts.fig15bi.large));
  chartOpts.fig15bi.print.options.legend.labels.fontSize = 25;
  chartOpts.fig15bi.print.options.legend.labels.boxWidth = 25;

  var fig15bi_ctx = document.getElementById("fig15bi").getContext('2d');
  chartCanvas["fig15biSmall"] = new Chart(fig15bi_ctx, chartOpts.fig15bi.small);
}




function fig2a(tmpData) {
  //***Figure 2A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.percentage.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpSpp = filtData.map(function(d) { return d.species; });


    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig2a-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig2a-" + i] = {};
    //***Small graph
    chartOpts["fig2a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig2a-" + i].small.data.labels = tmpSpp;
    chartOpts["fig2a-" + i].small.data.datasets[0].data = tmpPercent;
    chartOpts["fig2a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig2a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig2a-" + i).classed("selected", true);};
    chartOpts["fig2a-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
    chartOpts["fig2a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = "italic";
    chartOpts["fig2a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig2a");
    chartOpts["fig2a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig2a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig2a-" + i].small));
    chartOpts["fig2a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig2a-" + i].small));
    //chartOpts["fig2a-" + i].print.data.labels = tmpSppWhole[i];

    var fig2a_ctx = document.getElementById("fig2a-" + i).getContext('2d');
    chartCanvas["fig2a-" + i + "Small"] = new Chart(fig2a_ctx, chartOpts["fig2a-" + i].small);
  });
}



function fig2b(tmpData) {
  //***Figure 2B
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  //***Make new variable so data can be sorted by multiple dimensions (here, count & species)
  var hiCount = exc.filter.count.top(1).map(function(d) { return d.count; });
  exc.filter["combVals"] = tmpCF.dimension(function(d) { 
    var zeroStr = "";
    for (var i = d.count.length - 1; i < hiCount[0].length; i++) {
      zeroStr += "0";
    }
    return zeroStr + d.count + " " + d.species;
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.combVals.bottom(Infinity);
    var tmpAcres = filtData.map(function(d) { return d.count * 0.2223945; });
    var tmpSpp = filtData.map(function(d) { return d.species; });

    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outScreen4]:checked").length > 0) {
      if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
        tmpAreaLabel = "Hectares";
        tmpAcres.forEach(function(d,i) {
          tmpAcres[i] = d * 0.404686;
        });
      }
    }

    var divUnits = getDivide([tmpAcres[tmpAcres.length - 1]]);
    var tmpDivide = divUnits[0];
    var tmpDivideLabel = divUnits[1];

    tmpAcres.forEach(function(d,j) {
      tmpAcres[j] = (d/tmpDivide).toFixed(5);
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig2b-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig2b-" + i] = {};
    //***Small graph
    chartOpts["fig2b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig2b-" + i].small.data.labels = tmpSpp;
    chartOpts["fig2b-" + i].small.data.datasets[0].data = tmpAcres;
    chartOpts["fig2b-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig2b-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig2b-" + i).classed("selected", true);};
    chartOpts["fig2b-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
    chartOpts["fig2b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = "italic";
    chartOpts["fig2b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig2b");
    chartOpts["fig2b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig2b-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig2b-" + i].small));
    chartOpts["fig2b-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig2b-" + i].small));
    //chartOpts["fig2b-" + i].print.data.labels = tmpSppWhole[i];

    var fig2b_ctx = document.getElementById("fig2b-" + i).getContext('2d');
    chartCanvas["fig2b-" + i + "Small"] = new Chart(fig2b_ctx, chartOpts["fig2b-" + i].small);
  });
}



function fig2bi(tmpData) {
  //***Figure 2BI

  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData[0]);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0][0]);
  exc.vals = d3.values(tmpData[0][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  //***Make new variable so data can be sorted by multiple dimensions (here, count & species)
  var hiCount = exc.filter.count.top(1).map(function(d) { return d.count; });
  exc.filter["combVals"] = tmpCF.dimension(function(d) { 
    var zeroStr = "";
    for (var i = d.count.length - 1; i < hiCount[0].length; i++) {
      zeroStr += "0";
    }
    return zeroStr + d.count + " " + d.species;
  });

  //***No Exceedance
  tmpCF = crossfilter(tmpData[1]);
  var excNo = {filter:{}};
  excNo.keys = d3.keys(tmpData[1][0]);
  excNo.vals = d3.values(tmpData[1][0]);

  excNo.keys.forEach(function(key, i) {
    excNo.filter[key] = tmpCF.dimension(function(d) { if(isNaN(excNo.vals[i])) {return d[key];} else {return +d[key];} });
  });


  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.combVals.bottom(Infinity);
    var excAcres = filtData.map(function(d) { return d.count * 0.2223945; });
    var excSpp = filtData.map(function(d) { return d.species; });

    excNo.filter.region_name.filterAll();
    excNo.filter.region_name.filterFunction(function(d) { return d == reg; });

    filtData = excNo.filter.count.top(Infinity);
    var excNoAcres = [];
    excSpp.forEach(function(spp,j) {
      for(obj in filtData) {
        if(filtData[obj].species == spp) {
         excNoAcres[j] = filtData[obj].count * 0.2223945;
        } 
      }
    });




    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outScreen4]:checked").length > 0) {
      if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
        tmpAreaLabel = "Hectares";
        excAcres.forEach(function(d,j) {
          excAcres[j] = d * 0.404686;
          excNoAcres[j] = excNoAcres[j] * 0.404686;
        });
      }
    }

    var divUnits = getDivide([excAcres[excAcres.length - 1], Math.max(...excNoAcres)]);
    var tmpDivide = divUnits[0];
    var tmpDivideLabel = divUnits[1];

    excAcres.forEach(function(d,j) {
      excAcres[j] = (d/tmpDivide).toFixed(5);
      excNoAcres[j] = (excNoAcres[j]/tmpDivide).toFixed(5);
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig2bi-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig2bi-" + i] = {};
    //***Small graph
    chartOpts["fig2bi-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig2bi-" + i].small.data.labels = excSpp;
    chartOpts["fig2bi-" + i].small.data.datasets[0].data = excAcres;
    chartOpts["fig2bi-" + i].small.data.datasets[0].label = "Exceedance of CL";
    chartOpts["fig2bi-" + i].small.data.datasets.push({
      data: excNoAcres,
      label: "No Exceedance of CL",
      backgroundColor: 'rgba(189, 215, 238, 1)',
      borderColor: 'rgba(189, 215, 238, 1)',
      borderWidth: 2,
      hoverBackgroundColor: 'rgba(189, 215, 238, 0.8)',
      hoverBorderColor : 'black'
    });
    chartOpts["fig2bi-" + i].small.options.legend.display = true;
    chartOpts["fig2bi-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig2bi-" + i].small.options.legend.labels.fontSize = 6;
    chartOpts["fig2bi-" + i].small.options.legend.labels.boxWidth = 6;
    chartOpts["fig2bi-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig2bi-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig2bi-" + i).classed("selected", true);};
    chartOpts["fig2bi-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2bi-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
    chartOpts["fig2bi-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["fig2bi-" + i].small.options.scales.xAxes[0].ticks.fontStyle = "italic";
    chartOpts["fig2bi-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig2bi");
    chartOpts["fig2bi-" + i].small.options.scales.xAxes[0].stacked = true;
    chartOpts["fig2bi-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["fig2bi-" + i].small.options.scales.xAxes[1].stacked = true;

    //***Large graph
    chartOpts["fig2bi-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig2bi-" + i].small));
    chartOpts["fig2bi-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig2bi-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig2bi-" + i].large));
    chartOpts["fig2bi-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig2bi-" + i].print.options.legend.labels.boxWidth = 25;

    var fig2bi_ctx = document.getElementById("fig2bi-" + i).getContext('2d');
    chartCanvas["fig2bi-" + i + "Small"] = new Chart(fig2bi_ctx, chartOpts["fig2bi-" + i].small);
  });
}




function fig11a(tmpData) {
  //***Figure 11A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.exc.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpExc = filtData.map(function(d) { return d.exc; });

    var maxLength = 0;
    tmpPercent.forEach(function(val,j) {
      if(val > 0 && j > maxLength) {
        maxLength = j;
      }
    });


    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig11a-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig11a-" + i] = {};
    //***Small graph
    chartOpts["fig11a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig11a-" + i].small.data.labels = tmpExc;
    chartOpts["fig11a-" + i].small.data.datasets[0].backgroundColor = 'rgba(255,102,0,1)';
    chartOpts["fig11a-" + i].small.data.datasets[0].borderColor = 'rgba(255,102,0,1)';
    chartOpts["fig11a-" + i].small.data.datasets[0].hoverBackgroundColor = 'rgba(255,102,0,0.8)';
    chartOpts["fig11a-" + i].small.data.datasets[0].data = tmpPercent;
    chartOpts["fig11a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig11a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig11a-" + i).classed("selected", true);};
    chartOpts["fig11a-" + i].small.options.title.text = "Level of Exceedance of Most Protective Critical Load";
    chartOpts["fig11a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
    //chartOpts["fig11a-" + i].small.options.scales.yAxes[0].ticks.max = 100;
    chartOpts["fig11a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig11a");
    chartOpts["fig11a-" + i].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 2, tmpPercent.length);
    chartOpts["fig11a-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Level of Exceedance of CL (kg/ha/yr)",
      fontSize: 8
    }

    chartOpts["fig11a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";

    //***Large graph
    chartOpts["fig11a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig11a-" + i].small));
    chartOpts["fig11a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig11a-" + i].small));
    //chartOpts["fig11a-" + i].print.data.labels = tmpSppWhole[i];

    var fig11a_ctx = document.getElementById("fig11a-" + i).getContext('2d');
    chartCanvas["fig11a-" + i + "Small"] = new Chart(fig11a_ctx, chartOpts["fig11a-" + i].small);
  });
}




function fig12a(tmpData) {
  //***Figure 12A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.exc.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpExc = filtData.map(function(d) { return d.exc; });

    var maxLength = 0;
    tmpPercent.forEach(function(val,j) {
      if(val > 0 && j > maxLength) {
        maxLength = j;
      }
    });


    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig12a-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig12a-" + i] = {};
    //***Small graph
    chartOpts["fig12a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig12a-" + i].small.type = 'line';
    chartOpts["fig12a-" + i].small.data.labels = tmpExc;
    chartOpts["fig12a-" + i].small.data.datasets[0].backgroundColor = 'rgba(255,102,0,0.5)';
    chartOpts["fig12a-" + i].small.data.datasets[0].borderColor = 'rgba(255,102,0,1)';
    chartOpts["fig12a-" + i].small.data.datasets[0].hoverBackgroundColor = 'rgba(255,102,0,0.8)';
    chartOpts["fig12a-" + i].small.data.datasets[0].data = tmpPercent;
    chartOpts["fig12a-" + i].small.data.datasets[0].pointRadius = 0;
    chartOpts["fig12a-" + i].small.data.datasets[0].pointHitRadius = 20;
    chartOpts["fig12a-" + i].small.data.datasets[0].lineTension = 0;
    chartOpts["fig12a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig12a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig12a-" + i).classed("selected", true);};
    chartOpts["fig12a-" + i].small.options.title.text = "Level of Exceedance of Most Protective Critical Load";
    chartOpts["fig12a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
    //chartOpts["fig12a-" + i].small.options.scales.yAxes[0].ticks.max = 100;
    chartOpts["fig12a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig12a");
    chartOpts["fig12a-" + i].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 2, tmpPercent.length);
    chartOpts["fig12a-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Level of Exceedance of CL (kg/ha/yr)",
      fontSize: 8
    }

    chartOpts["fig12a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";

    //***Large graph
    chartOpts["fig12a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig12a-" + i].small));
    chartOpts["fig12a-" + i].large.data.datasets[0].borderWidth = 5;
    chartOpts["fig12a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig12a-" + i].large));

    var fig12a_ctx = document.getElementById("fig12a-" + i).getContext('2d');
    chartCanvas["fig12a-" + i + "Small"] = new Chart(fig12a_ctx, chartOpts["fig12a-" + i].small);
  });
}






function fig12b(tmpData) {
  //***Figure 12B
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });


  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var tmpPercent = [];
    var tmpExc = [];
    var maxLength = 0;
    var tmpIndex = 0;
    ["A (Min Min)", "B (Max Min)", "C (Max Max)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.exc.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpExc[j] = filtData.map(function(d) { return d.exc; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }
      });

      exc.filter.cl_category.filterAll();
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig12b-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig12b-" + i] = {};
    //***Small graph
    chartOpts["fig12b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig12b-" + i].small.type = 'line';
    chartOpts["fig12b-" + i].small.data.labels = tmpExc[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig12b-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",0.5)",
        borderColor: tmpColor + ",1)",
        data: tmpPercent[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        label: "EX " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig12b-" + i].small.options.legend.display = true;
    chartOpts["fig12b-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig12b-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig12b-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig12b-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig12b-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig12b-" + i).classed("selected", true);};
    chartOpts["fig12b-" + i].small.options.title.text = "Level of Exceedance of Protective Critical Load Levels";
    chartOpts["fig12b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
    //chartOpts["fig12b-" + i].small.options.scales.yAxes[0].ticks.max = 100;
    chartOpts["fig12b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig12b");
    chartOpts["fig12b-" + i].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 2, tmpPercent[tmpIndex].length);
    chartOpts["fig12b-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Level of Exceedance of CL (kg/ha/yr)",
      fontSize: 8
    }

    chartOpts["fig12b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";

    //***Large graph
    chartOpts["fig12b-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig12b-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig12b-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig12b-" + i].large.options.legend.labels.padding = 25;

    chartOpts["fig12b-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig12b-" + i].large));
    chartOpts["fig12b-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig12b-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig12b-" + i].print.options.legend.labels.fontSize = 25;

    var fig12b_ctx = document.getElementById("fig12b-" + i).getContext('2d');
    chartCanvas["fig12b-" + i + "Small"] = new Chart(fig12b_ctx, chartOpts["fig12b-" + i].small);
  });
}







function fig3a(tmpData) {
  //***Figure 3A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpSpecies = [];
  d3.selectAll(".sppCheck")[0].forEach(function(d) { if(d.checked) { tmpSpecies.push(speciesNames[d.value]); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    tmpSpecies.forEach(function(species,k) {
      exc.filter.species.filterAll();
      exc.filter.species.filterFunction(function(d) { return d == species; });

      var filtData = exc.filter.exc.bottom(Infinity);
      var tmpPercent = filtData.map(function(d) { return d.percentage; });
      var tmpExc = filtData.map(function(d) { return d.exc; });

      tmpPercent.splice(0,0,0);
      tmpExc.splice(0,0,0);

      var maxLength = 0;
      tmpPercent.forEach(function(val,j) {
        if(val > 0 && j > maxLength) {
          maxLength = j;
        }
      });


      d3.select("#resFigsDiv")
        .append("div")
        .attr("class", "canvasChartSmall")
        .html('<canvas id="fig3a-' + i + k + '" class="canvasChart" value="Numbers">');

      chartOpts["fig3a-" + i + k] = {};
      //***Small graph
      chartOpts["fig3a-" + i + k].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

      chartOpts["fig3a-" + i + k].small.data.labels = tmpExc;
      chartOpts["fig3a-" + i + k].small.data.datasets[0].backgroundColor = 'rgba(68,114,196,1)';
      chartOpts["fig3a-" + i + k].small.data.datasets[0].borderColor = 'rgba(68,114,196,1)';
      chartOpts["fig3a-" + i + k].small.data.datasets[0].hoverBackgroundColor = 'rgba(68,114,196,0.8)';
      chartOpts["fig3a-" + i + k].small.data.datasets[0].data = tmpPercent;
      chartOpts["fig3a-" + i + k].small.options.onClick = function(evt, tmpArray) { viewFig("fig3a-" + i + k); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig3a-" + i + k).classed("selected", true);};
      chartOpts["fig3a-" + i + k].small.options.title.text = "Exceedance of Most Protective Critical Load";
      chartOpts["fig3a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area with Level of Exceedance";
      //chartOpts["fig3a-" + i + k].small.options.scales.yAxes[0].ticks.max = 100;
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig3a");
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 1, tmpPercent.length);
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].scaleLabel = {
        display: true,
        labelString: "Level of Exceedance of CL (kg/ha/yr)",
        fontSize: 8
      }

      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + species;

      //***Large graph
      chartOpts["fig3a-" + i + k].large = JSON.parse(JSON.stringify(chartOpts["fig3a-" + i + k].small));
      chartOpts["fig3a-" + i + k].print = JSON.parse(JSON.stringify(chartOpts["fig3a-" + i + k].small));

      var fig3a_ctx = document.getElementById("fig3a-" + i + k).getContext('2d');
      chartCanvas["fig3a-" + i + k + "Small"] = new Chart(fig3a_ctx, chartOpts["fig3a-" + i + k].small);
    });
  });
}







function fig4a(tmpData) {
  //***Figure 4A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpSpecies = [];
  d3.selectAll(".sppCheck")[0].forEach(function(d) { if(d.checked) { tmpSpecies.push(speciesNames[d.value]); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    tmpSpecies.forEach(function(species,k) {
      exc.filter.species.filterAll();
      exc.filter.species.filterFunction(function(d) { return d == species; });

      var filtData = exc.filter.exc.bottom(Infinity);
      var tmpPercent = filtData.map(function(d) { return d.percentage; });
      var tmpExc = filtData.map(function(d) { return d.exc; });

      tmpPercent.splice(0,0,0);
      tmpExc.splice(0,0,0);

      var maxLength = 0;
      tmpPercent.forEach(function(val,j) {
        if(val > 0 && j > maxLength) {
          maxLength = j;
        }
      });


      d3.select("#resFigsDiv")
        .append("div")
        .attr("class", "canvasChartSmall")
        .html('<canvas id="fig4a-' + i + k + '" class="canvasChart" value="Numbers">');

      chartOpts["fig4a-" + i + k] = {};
      //***Small graph
      chartOpts["fig4a-" + i + k].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

      chartOpts["fig4a-" + i + k].small.type = 'line';
      chartOpts["fig4a-" + i + k].small.data.labels = tmpExc;
      chartOpts["fig4a-" + i + k].small.data.datasets[0].backgroundColor = 'rgba(68,114,196,0.5)';
      chartOpts["fig4a-" + i + k].small.data.datasets[0].borderColor = 'rgba(68,114,196,1)';
      chartOpts["fig4a-" + i + k].small.data.datasets[0].data = tmpPercent;
      chartOpts["fig4a-" + i + k].small.data.datasets[0].pointRadius = 0;
      chartOpts["fig4a-" + i + k].small.data.datasets[0].pointHitRadius = 20;
      chartOpts["fig4a-" + i + k].small.data.datasets[0].lineTension = 0;
      chartOpts["fig4a-" + i + k].small.data.datasets[0].data = tmpPercent;
      chartOpts["fig4a-" + i + k].small.options.onClick = function(evt, tmpArray) { viewFig("fig4a-" + i + k); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig4a-" + i + k).classed("selected", true);};
      chartOpts["fig4a-" + i + k].small.options.title.text = "Exceedance of Most Protective Critical Load";
      chartOpts["fig4a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area with Level of Exceedance";
      //chartOpts["fig4a-" + i + k].small.options.scales.yAxes[0].ticks.max = 100;
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig4a");
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 1, tmpPercent.length);
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].scaleLabel = {
        display: true,
        labelString: "Level of Exceedance of CL (kg/ha/yr)",
        fontSize: 8
      }

      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + species;

      //***Large graph
      chartOpts["fig4a-" + i + k].large = JSON.parse(JSON.stringify(chartOpts["fig4a-" + i + k].small));
      chartOpts["fig4a-" + i + k].large.data.datasets[0].borderWidth = 5;
      chartOpts["fig4a-" + i + k].print = JSON.parse(JSON.stringify(chartOpts["fig4a-" + i + k].large));

      var fig4a_ctx = document.getElementById("fig4a-" + i + k).getContext('2d');
      chartCanvas["fig4a-" + i + k + "Small"] = new Chart(fig4a_ctx, chartOpts["fig4a-" + i + k].small);
    });
  });
}








function fig4c(tmpData) {
  //***Figure 4C
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    exc.filter["species" + i] = exc.filter.species.group();
    var regSpecies = exc.filter["species" + i].all().filter(function(d) { return d.value > 0; });
    var tmpSpecies = regSpecies.map(function(d) { return d.key; });

    var tmpPercent = [];
    var tmpExc = [];
    var maxLength = 0;
    var tmpIndex = 0;
    tmpSpecies.forEach(function(species,k) {
      exc.filter.species.filterAll();
      exc.filter.species.filterFunction(function(d) { return d == species; });

      var filtData = exc.filter.exc.bottom(Infinity);
      tmpPercent[k] = filtData.map(function(d) { return d.percentage; });
      tmpExc[k] = filtData.map(function(d) { return d.exc; });

      tmpPercent[k].splice(0,0,0);
      tmpExc[k].splice(0,0,0);

      //***Find greatest non-zero length
      tmpPercent[k].forEach(function(val,j) {
        if(val > 0 && j > maxLength) {
          maxLength = j;
          tmpIndex = k;
        }
      });
    });
    
    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig4c-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig4c-" + i] = {};
    //***Small graph
    chartOpts["fig4c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig4c-" + i].small.type = 'line';
    chartOpts["fig4c-" + i].small.data.datasets = [];
    tmpSpecies.forEach(function(species,j) {
      if(Math.max(...tmpPercent[j]) > 0) {
        chartOpts["fig4c-" + i].small.data.datasets.push({
          backgroundColor: "rgba(" + sppColors[species] + ",0.4)",
          borderColor: "rgba(" + sppColors[species] + ",1)",
          data: tmpPercent[j],
          pointRadius: 0,
          pointHitRadius: 20,
          lineTension: 0,
          label: species,
        })
      }
    });
    chartOpts["fig4c-" + i].small.data.labels = tmpExc[tmpIndex];
    chartOpts["fig4c-" + i].small.options.legend.display = true;
    chartOpts["fig4c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig4c-" + i].small.options.legend.labels.fontSize = 4;
    chartOpts["fig4c-" + i].small.options.legend.labels.fontStyle = 'italic';
    chartOpts["fig4c-" + i].small.options.legend.labels.boxWidth = 4;
    chartOpts["fig4c-" + i].small.options.legend.labels.padding = 3;
    chartOpts["fig4c-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig4c-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig4c-" + i).classed("selected", true);};
    chartOpts["fig4c-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig4c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area with Level of Exceedance";
    //chartOpts["fig4c-" + i].small.options.scales.yAxes[0].ticks.max = 100;
    chartOpts["fig4c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig4c");
    chartOpts["fig4c-" + i].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 1, tmpPercent[tmpIndex].length);
    chartOpts["fig4c-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Level of Exceedance of CL (kg/ha/yr)",
      fontSize: 8
    }

    chartOpts["fig4c-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig4c-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig4c-" + i].small));
    chartOpts["fig4c-" + i].large.data.datasets[0].borderWidth = 5;
    chartOpts["fig4c-" + i].large.options.legend.labels.padding = 10;

    chartOpts["fig4c-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig4c-" + i].large));
    chartOpts["fig4c-" + i].print.options.legend.labels.boxWidth = 20;
    chartOpts["fig4c-" + i].print.options.legend.labels.padding = 20;
    chartOpts["fig4c-" + i].print.options.legend.labels.fontSize = 20;

    var fig4c_ctx = document.getElementById("fig4c-" + i).getContext('2d');
    chartCanvas["fig4c-" + i + "Small"] = new Chart(fig4c_ctx, chartOpts["fig4c-" + i].small);
  });
}








function fig1a(tmpData) {
  //***Figure 1A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.lo_percent.bottom(Infinity);
    var tmpLoPercent = filtData.map(function(d) { return d.lo_percent; });
    var tmpSpp = filtData.map(function(d) { return d.species; });


    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig1a-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig1a-" + i] = {};
    //***Small graph
    chartOpts["fig1a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig1a-" + i].small.data.labels = tmpSpp;
    chartOpts["fig1a-" + i].small.data.datasets[0].backgroundColor = 'rgba(153,153,255,1)';
    chartOpts["fig1a-" + i].small.data.datasets[0].borderColor = 'rgba(153,153,255,1)';
    chartOpts["fig1a-" + i].small.data.datasets[0].hoverBackgroundColor = 'rgba(153,153,255,0.8)';
    chartOpts["fig1a-" + i].small.data.datasets[0].data = tmpLoPercent;
    chartOpts["fig1a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig1a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig1a-" + i).classed("selected", true);};
    chartOpts["fig1a-" + i].small.options.title.text = "Percent Area Sensitive to N Deposition Based on Site Conditions";
    chartOpts["fig1a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area Sensitive to N Deposition";
    chartOpts["fig1a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = "italic";
    chartOpts["fig1a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig1a");
    chartOpts["fig1a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig1a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig1a-" + i].small));
    chartOpts["fig1a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig1a-" + i].small));
    //chartOpts["fig1a-" + i].print.data.labels = tmpSppWhole[i];

    var fig1a_ctx = document.getElementById("fig1a-" + i).getContext('2d');
    chartCanvas["fig1a-" + i + "Small"] = new Chart(fig1a_ctx, chartOpts["fig1a-" + i].small);
  });
}



function fig1b(tmpData) {
  //***Figure 1B

  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });


  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.lo_count.bottom(Infinity);
    var loAcres = filtData.map(function(d) { return d.lo_count * 0.2223945; });
    var hiAcres = filtData.map(function(d) { return d.hi_count * 0.2223945; });
    var tmpSpp = filtData.map(function(d) { return d.species; });


    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outScreen4]:checked").length > 0) {
      if(document.querySelector('input[name=outScreen4]:checked').value == "hectares") {
        tmpAreaLabel = "Hectares";
        loAcres.forEach(function(d,j) {
          loAcres[j] = d * 0.404686;
          hiAcres[j] = hiAcres[j] * 0.404686;
        });
      }
    }

    var divUnits = getDivide([loAcres[loAcres.length - 1], Math.max(...hiAcres)]);
    var tmpDivide = divUnits[0];
    var tmpDivideLabel = divUnits[1];

    loAcres.forEach(function(d,j) {
      loAcres[j] = (d/tmpDivide).toFixed(5);
      hiAcres[j] = (hiAcres[j]/tmpDivide).toFixed(5);
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig1b-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig1b-" + i] = {};
    //***Small graph
    chartOpts["fig1b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig1b-" + i].small.data.labels = tmpSpp;
    chartOpts["fig1b-" + i].small.data.datasets[0].backgroundColor = 'rgba(153,153,255,1)';
    chartOpts["fig1b-" + i].small.data.datasets[0].borderColor = 'rgba(153,153,255,1)';
    chartOpts["fig1b-" + i].small.data.datasets[0].hoverBackgroundColor = 'rgba(153,153,255,0.8)';
    chartOpts["fig1b-" + i].small.data.datasets[0].data = loAcres;
    chartOpts["fig1b-" + i].small.data.datasets[0].label = "More Sensitive";
    chartOpts["fig1b-" + i].small.data.datasets.push({
      data: hiAcres,
      label: "Less Sensitive",
      backgroundColor: 'rgba(153, 255, 153, 1)',
      borderColor: 'rgba(153, 255, 153, 1)',
      borderWidth: 2,
      hoverBackgroundColor: 'rgba(153, 255, 153, 0.8)',
      hoverBorderColor : 'black'
    });
    chartOpts["fig1b-" + i].small.options.legend.display = true;
    chartOpts["fig1b-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig1b-" + i].small.options.legend.labels.fontSize = 6;
    chartOpts["fig1b-" + i].small.options.legend.labels.boxWidth = 6;
    chartOpts["fig1b-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig1b-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig1b-" + i).classed("selected", true);};
    chartOpts["fig1b-" + i].small.options.title.text = "Sensitivity of Area to N Deposition Based on Site Conditions";
    chartOpts["fig1b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " with Level of Sensitivity " + tmpDivideLabel;
    chartOpts["fig1b-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["fig1b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = "italic";
    chartOpts["fig1b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig1b");
    chartOpts["fig1b-" + i].small.options.scales.xAxes[0].stacked = true;
    chartOpts["fig1b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["fig1b-" + i].small.options.scales.xAxes[1].stacked = true;

    //***Large graph
    chartOpts["fig1b-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig1b-" + i].small));
    chartOpts["fig1b-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig1b-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig1b-" + i].large));
    chartOpts["fig1b-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig1b-" + i].print.options.legend.labels.boxWidth = 25;

    var fig1b_ctx = document.getElementById("fig1b-" + i).getContext('2d');
    chartCanvas["fig1b-" + i + "Small"] = new Chart(fig1b_ctx, chartOpts["fig1b-" + i].small);
  });
}






function fig9a(tmpData) {
  //***Figure 9A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.cl.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpCL = filtData.map(function(d) { return d.cl; });


    var tmpPercentCum = [];
    tmpPercent.forEach(function(val,j) {
      if(j == 0) {
        tmpPercentCum[j] = val;
      }
      else {
        tmpPercentCum[j] = tmpPercentCum[j-1] + val;
      }
    });

    var maxCL = Math.max(...tmpCL);
    var tmpPercentCumFull = [];
    var tmpCLCum = [];
    for (var j = 0; j < maxCL + 2; j++) {
      tmpCLCum[j] = j;
      if(tmpCL.indexOf(j) > -1) {
        tmpPercentCumFull[j] = tmpPercentCum[tmpCL.indexOf(j)].toFixed(5);
      }
      else {
        tmpPercentCumFull[j] = null;
      }
    }

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig9a-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig9a-" + i] = {};
    //***Small graph
    chartOpts["fig9a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig9a-" + i].small.type = 'line';
    chartOpts["fig9a-" + i].small.data.labels = tmpCLCum;
    chartOpts["fig9a-" + i].small.data.datasets[0].backgroundColor = 'rgba(255,102,0,0)';
    chartOpts["fig9a-" + i].small.data.datasets[0].borderColor = 'rgba(255,102,0,1)';
    chartOpts["fig9a-" + i].small.data.datasets[0].data = tmpPercentCumFull;
    chartOpts["fig9a-" + i].small.data.datasets[0].pointRadius = 0;
    chartOpts["fig9a-" + i].small.data.datasets[0].pointHitRadius = 20;
    chartOpts["fig9a-" + i].small.data.datasets[0].lineTension = 0.4;
    chartOpts["fig9a-" + i].small.data.datasets[0].spanGaps = true;
    chartOpts["fig9a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig9a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig9a-" + i).classed("selected", true);};
    chartOpts["fig9a-" + i].small.options.title.text = "Percent Area With Most Protective Critical Load";
    chartOpts["fig9a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area";
    chartOpts["fig9a-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig9a-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig9a-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig9a");
    chartOpts["fig9a-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig9a-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    delete chartOpts["fig9a-" + i].small.options.scales.xAxes[0].ticks.stepSize;
    chartOpts["fig9a-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig9a-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Critical Loads (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig9a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig9a-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig9a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig9a-" + i].small));
    chartOpts["fig9a-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9a-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig9a-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig9a-" + i].large.data.datasets[0].borderWidth = 5;
    chartOpts["fig9a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig9a-" + i].large));
    chartOpts["fig9a-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9a-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig9a-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig9a_ctx = document.getElementById("fig9a-" + i).getContext('2d');
    chartCanvas["fig9a-" + i + "Small"] = new Chart(fig9a_ctx, chartOpts["fig9a-" + i].small);
  });
}








function fig9b(tmpData) {
  //***Figure 9B
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });


    var tmpPercent = [];
    var tmpCL = [];
    var maxLength = 0;
    var tmpIndex = 0;
    var tmpPercentCum = [[],[],[],[]];

    ["A (Min Min)", "B (Max Min)", "C (Max Max)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.cl.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpCL[j] = filtData.map(function(d) { return d.cl; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }

        if(k == 0) {
          tmpPercentCum[j][k] = val;
        }
        else {
          tmpPercentCum[j][k] = tmpPercentCum[j][k-1] + val;
        }
      });
      exc.filter.cl_category.filterAll();
    });

    var tmpMaxCL = [];
    tmpCL.forEach(function(cl) {
      tmpMaxCL.push(Math.max(...cl));
    });

    var maxCL = Math.max(...tmpMaxCL);
    var tmpPercentCumFull = [[],[],[],[]];
    var tmpCLCum = [[],[],[],[]];
    tmpCL.forEach(function(cl,k) {
      for (var j = 0; j < maxCL + 2; j++) {
        tmpCLCum[k][j] = j;
        if(tmpCL[k].indexOf(j) > -1) {
          tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
        }
        else {
          tmpPercentCumFull[k][j] = null;
        }
      }
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig9b-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig9b-" + i] = {};
    //***Small graph
    chartOpts["fig9b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig9b-" + i].small.type = 'line';
    chartOpts["fig9b-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig9b-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",1)",
        fill: false,
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0.4,
        spanGaps: true,
        label: "CL " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig9b-" + i].small.options.legend.display = true;
    chartOpts["fig9b-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig9b-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig9b-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig9b-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig9b-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig9b-" + i).classed("selected", true);};
    chartOpts["fig9b-" + i].small.options.title.text = "Percent Area With Critical Loads";
    chartOpts["fig9b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area";
    chartOpts["fig9b-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig9b-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig9b-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig9b");
    chartOpts["fig9b-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig9b-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig9b-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig9b-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "Critical Loads (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig9b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig9b-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig9b-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig9b-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig9b-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig9b-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig9b-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9b-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig9b-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig9b-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig9b-" + i].large));
    chartOpts["fig9b-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig9b-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig9b-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig9b-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig9b-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig9b-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig9b_ctx = document.getElementById("fig9b-" + i).getContext('2d');
    chartCanvas["fig9b-" + i + "Small"] = new Chart(fig9b_ctx, chartOpts["fig9b-" + i].small);
  });
}







function fig13e(tmpData) {
  //***Figure 13E
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.cl.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpCL = filtData.map(function(d) { return d.cl; });


    var tmpPercentCum = [];
    tmpPercent.forEach(function(val,j) {
      if(j == 0) {
        tmpPercentCum[j] = val;
      }
      else {
        tmpPercentCum[j] = tmpPercentCum[j-1] + val;
      }
    });

    var maxCL = Math.max(...tmpCL);
    var tmpPercentCumFull = [];
    var tmpCLCum = [];
    for (var j = 0; j < maxCL + 2; j++) {
      tmpCLCum[j] = j;
      if(tmpCL.indexOf(j) > -1) {
        tmpPercentCumFull[j] = tmpPercentCum[tmpCL.indexOf(j)].toFixed(5);
      }
      else {
        tmpPercentCumFull[j] = null;
      }
    }

    var tmpBi = 0
    tmpPercentCumFull.some(function(val, j) {
      if(!val == true) {
        tmpPercentCumFull[j] = 0;
      }
      else {
        tmpBi = 1;
      }
      return tmpBi == 1;
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13e-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13e-" + i] = {};
    //***Small graph
    chartOpts["fig13e-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13e-" + i].small.type = 'line';
    chartOpts["fig13e-" + i].small.data.labels = tmpCLCum;
    chartOpts["fig13e-" + i].small.data.datasets[0].backgroundColor = 'rgba(255,102,0,0)';
    chartOpts["fig13e-" + i].small.data.datasets[0].borderColor = 'rgba(255,102,0,1)';
    chartOpts["fig13e-" + i].small.data.datasets[0].data = tmpPercentCumFull;
    chartOpts["fig13e-" + i].small.data.datasets[0].pointRadius = 0;
    chartOpts["fig13e-" + i].small.data.datasets[0].pointHitRadius = 20;
    chartOpts["fig13e-" + i].small.data.datasets[0].lineTension = 0;
    chartOpts["fig13e-" + i].small.data.datasets[0].spanGaps = true;
    chartOpts["fig13e-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13e-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13e-" + i).classed("selected", true);};
    chartOpts["fig13e-" + i].small.options.title.text = "Area in Exceedance of Most Protective CL at Each N Deposition Level";
    chartOpts["fig13e-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
    chartOpts["fig13e-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13e-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13e-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13e-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13e");
    chartOpts["fig13e-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13e-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    delete chartOpts["fig13e-" + i].small.options.scales.xAxes[0].ticks.stepSize;
    chartOpts["fig13e-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13e-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13e-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13e-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13e-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13e-" + i].small));
    chartOpts["fig13e-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13e-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13e-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13e-" + i].large.data.datasets[0].borderWidth = 5;
    chartOpts["fig13e-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13e-" + i].large));
    chartOpts["fig13e-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13e-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13e-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13e_ctx = document.getElementById("fig13e-" + i).getContext('2d');
    chartCanvas["fig13e-" + i + "Small"] = new Chart(fig13e_ctx, chartOpts["fig13e-" + i].small);
  });
}






function fig13h(tmpData) {
  //***Figure 13H
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });


    var tmpPercent = [];
    var tmpCL = [];
    var maxLength = 0;
    var tmpIndex = 0;
    var tmpPercentCum = [[],[],[],[]];

    ["A (Min Min)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.cl.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpCL[j] = filtData.map(function(d) { return d.cl; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }

        if(k == 0) {
          tmpPercentCum[j][k] = val;
        }
        else {
          tmpPercentCum[j][k] = tmpPercentCum[j][k-1] + val;
        }
      });
      exc.filter.cl_category.filterAll();
    });

    var tmpMaxCL = [];
    tmpCL.forEach(function(cl) {
      tmpMaxCL.push(Math.max(...cl));
    });

    var maxCL = Math.max(...tmpMaxCL);
    var tmpPercentCumFull = [[],[],[],[]];
    var tmpCLCum = [[],[],[],[]];
    tmpCL.forEach(function(cl,k) {
      for (var j = 0; j < maxCL + 2; j++) {
        tmpCLCum[k][j] = j;
        if(tmpCL[k].indexOf(j) > -1) {
          tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
        }
        else {
          tmpPercentCumFull[k][j] = null;
        }
      }

      var tmpBi = 0
      tmpPercentCumFull[k].some(function(val, j) {
        if(!val == true) {
          tmpPercentCumFull[k][j] = 0;
        }
        else {
          tmpBi = 1;
        }
        return tmpBi == 1;
      });
    });



    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13h-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13h-" + i] = {};
    //***Small graph
    chartOpts["fig13h-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13h-" + i].small.type = 'line';
    chartOpts["fig13h-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig13h-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",0.5)",
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        spanGaps: true,
        label: "EX " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });
    chartOpts["fig13h-" + i].small.data.datasets[0].fill = false;
    chartOpts["fig13h-" + i].small.data.datasets[1].fill = 0;

    chartOpts["fig13h-" + i].small.options.legend.display = true;
    chartOpts["fig13h-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13h-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13h-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13h-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13h-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13h-" + i).classed("selected", true);};
    chartOpts["fig13h-" + i].small.options.title.text = "Area in Exceedance at Each N Deposition Level";
    chartOpts["fig13h-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
    chartOpts["fig13h-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13h-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13h-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13h-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13h");
    chartOpts["fig13h-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13h-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13h-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13h-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13h-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13h-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13h-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13h-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig13h-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig13h-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig13h-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13h-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13h-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13h-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13h-" + i].large));
    chartOpts["fig13h-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig13h-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig13h-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig13h-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13h-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13h-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13h_ctx = document.getElementById("fig13h-" + i).getContext('2d');
    chartCanvas["fig13h-" + i + "Small"] = new Chart(fig13h_ctx, chartOpts["fig13h-" + i].small);
  });
}







function fig13g(tmpData) {
  //***Figure 13G
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });


    var tmpPercent = [];
    var tmpCL = [];
    var maxLength = 0;
    var tmpIndex = 0;
    var tmpPercentCum = [[],[],[],[]];

    ["A (Min Min)", "B (Max Min)", "C (Max Max)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.cl.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpCL[j] = filtData.map(function(d) { return d.cl; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }

        if(k == 0) {
          tmpPercentCum[j][k] = val;
        }
        else {
          tmpPercentCum[j][k] = tmpPercentCum[j][k-1] + val;
        }
      });
      exc.filter.cl_category.filterAll();
    });

    var tmpMaxCL = [];
    tmpCL.forEach(function(cl) {
      tmpMaxCL.push(Math.max(...cl));
    });

    var maxCL = Math.max(...tmpMaxCL);
    var tmpPercentCumFull = [[],[],[],[]];
    var tmpCLCum = [[],[],[],[]];
    tmpCL.forEach(function(cl,k) {
      for (var j = 0; j < maxCL + 2; j++) {
        tmpCLCum[k][j] = j;
        if(tmpCL[k].indexOf(j) > -1) {
          tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
        }
        else {
          tmpPercentCumFull[k][j] = null;
        }
      }

      var tmpBi = 0
      tmpPercentCumFull[k].some(function(val, j) {
        if(!val == true) {
          tmpPercentCumFull[k][j] = 0;
        }
        else {
          tmpBi = 1;
        }
        return tmpBi == 1;
      });
    });



    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13g-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13g-" + i] = {};
    //***Small graph
    chartOpts["fig13g-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13g-" + i].small.type = 'line';
    chartOpts["fig13g-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig13g-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",1)",
        fill: false,
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        spanGaps: true,
        label: "EX " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig13g-" + i].small.options.legend.display = true;
    chartOpts["fig13g-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13g-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13g-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13g-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13g-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13g-" + i).classed("selected", true);};
    chartOpts["fig13g-" + i].small.options.title.text = "Area in Exceedance at Each N Deposition Level";
    chartOpts["fig13g-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
    chartOpts["fig13g-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13g-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13g-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13g-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13g");
    chartOpts["fig13g-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13g-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13g-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13g-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13g-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13g-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13g-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13g-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig13g-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig13g-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig13g-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13g-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13g-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13g-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13g-" + i].large));
    chartOpts["fig13g-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig13g-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig13g-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig13g-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13g-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13g-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13g_ctx = document.getElementById("fig13g-" + i).getContext('2d');
    chartCanvas["fig13g-" + i + "Small"] = new Chart(fig13g_ctx, chartOpts["fig13g-" + i].small);
  });
}





function fig6c(tmpData) {
  //***Figure 6C
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.species.bottom(Infinity);
    var tmpSpecies = filtData.map(function(d) { return d.species; });
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));
    
    var tmpPoints = filtData.map(function(d) { 
      if(d.min == d.max) {
        if(d.lo_percent == 100) {
          return [{"x": 0, "y": 0}, {"x": d.min - 1, "y": 0}, {"x": d.min, "y": d.lo_percent}, {"x": maxCL, "y": 100}];
        }
        else {
          return [{"x": 0, "y": 0}, {"x": d.max - 1, "y": d.lo_percent}, {"x": d.max, "y": 100}, {"x": maxCL, "y": 100}];
        }
      }
      else {
        return [{"x": 0, "y": 0}, {"x": d.min - 1, "y": 0}, {"x": d.min, "y": d.lo_percent}, {"x": d.max - 1, "y": d.lo_percent}, {"x": d.max, "y": 100}, {"x": maxCL, "y": 100}];
      }
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig6c-' + i + '" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

    chartOpts["fig6c-" + i] = {};
    //***Small graph
    chartOpts["fig6c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["fig6c-" + i].small.type = 'line';

    tmpSpecies.forEach(function(spp,j) {
      chartOpts["fig6c-" + i].small.data.datasets[j] = {
        backgroundColor: "rgba(" + sppColors[spp] + ",1)",
        fill: false,
        borderColor: "rgba(" + sppColors[spp] + ",1)",
        data: tmpPoints[j],
        pointRadius: 0,
        pointHitRadius: 20,
        //steppedLine: true,
        lineTension: 0,
        spanGaps: true,
        label: spp
      }
    });

    chartOpts["fig6c-" + i].small.options.legend.display = true;
    chartOpts["fig6c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig6c-" + i].small.options.legend.labels.fontSize = 3;
    chartOpts["fig6c-" + i].small.options.legend.labels.boxWidth = 3;
    chartOpts["fig6c-" + i].small.options.legend.labels.padding = 3;
    chartOpts["fig6c-" + i].small.options.legend.labels.fontStyle = 'italic';
    chartOpts["fig6c-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig6c-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig6c-" + i).classed("selected", true);};
    chartOpts["fig6c-" + i].small.options.title.text = "% Area in Exceedance of Most Protective CL at Each N Deposition Level";
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].type = 'linear';
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig6c");
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig6c-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["fig6c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
    //***Large graph
    chartOpts["fig6c-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig6c-" + i].small));
    tmpSpecies.forEach(function(d,j) {
      chartOpts["fig6c-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig6c-" + i].large.options.legend.labels.padding = 12;
    chartOpts["fig6c-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  
    //***Print graph
    chartOpts["fig6c-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig6c-" + i].large));
    chartOpts["fig6c-" + i].print.options.legend.labels.boxWidth = 20;
    chartOpts["fig6c-" + i].print.options.legend.labels.padding = 20;
    chartOpts["fig6c-" + i].print.options.legend.labels.fontSize = 20;
    chartOpts["fig6c-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };

    var fig6c_ctx = document.getElementById("fig6c-" + i).getContext('2d');
    chartCanvas["fig6c-" + i + "Small"] = new Chart(fig6c_ctx, chartOpts["fig6c-" + i].small);
  });
}






function fig13f(tmpData) {
  //***Figure 13F
  var tmpRegions = topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].features.map(function(d) { return d.id; });;

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  var tmpPercent = [];
  var tmpCL = [];
  var maxLength = 0;
  var tmpIndex = 0;
  var tmpPercentCum = [];

  tmpRegions.forEach(function(reg,j) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.cl.bottom(Infinity);
    tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
    tmpCL[j] = filtData.map(function(d) { return d.cl; });

    //***Find greatest non-zero length
    tmpPercentCum[j] = [];
    tmpPercent[j].forEach(function(val,k) {
      if(val > 0 && k > maxLength) {
        maxLength = k;
        tmpIndex = j;
      }

      if(k == 0) {
        tmpPercentCum[j][k] = val;
      }
      else {
        tmpPercentCum[j][k] = tmpPercentCum[j][k-1] + val;
      }
    });
  });

  var tmpMaxCL = [];
  tmpCL.forEach(function(cl) {
    tmpMaxCL.push(Math.max(...cl));
  });

  var maxCL = Math.max(...tmpMaxCL);
  var tmpPercentCumFull = [];
  var tmpCLCum = [];
  tmpCL.forEach(function(cl,k) {
    tmpPercentCumFull[k] = [];
    tmpCLCum[k] = [];
    for (var j = 0; j < maxCL + 2; j++) {
      tmpCLCum[k][j] = j;
      if(tmpCL[k].indexOf(j) > -1) {
        tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
      }
      else {
        tmpPercentCumFull[k][j] = null;
      }
    }

    var tmpBi = 0
    tmpPercentCumFull[k].some(function(val, j) {
      if(!val == true) {
        tmpPercentCumFull[k][j] = 0;
      }
      else {
        tmpBi = 1;
      }
      return tmpBi == 1;
    });
  });


  d3.select("#resFigsDiv")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="fig13f" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

  chartOpts["fig13f"] = {};
  //***Small graph
  chartOpts["fig13f"].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts["fig13f"].small.type = 'line';
  chartOpts["fig13f"].small.data.labels = tmpCLCum[0];

  tmpRegions.forEach(function(reg,j) {
    chartOpts["fig13f"].small.data.datasets[j] = {
      backgroundColor: areaColors[d3.select("#areaList").attr("value")][j],
      fill: false,
      borderColor: areaColors[d3.select("#areaList").attr("value")][j],
      data: tmpPercentCumFull[j],
      pointRadius: 0,
      pointHitRadius: 20,
      lineTension: 0,
      spanGaps: true,
      label: reg
    }
  });

  chartOpts["fig13f"].small.options.legend.display = true;
  chartOpts["fig13f"].small.options.legend.position = 'bottom';
  chartOpts["fig13f"].small.options.legend.labels.fontSize = 3;
  chartOpts["fig13f"].small.options.legend.labels.boxWidth = 3;
  chartOpts["fig13f"].small.options.legend.labels.padding = 3;
  chartOpts["fig13f"].small.options.onClick = function(evt, tmpArray) { viewFig("fig13f"); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13f").classed("selected", true);};
  chartOpts["fig13f"].small.options.title.text = "% Area in Exceedance of Most Protective CL at Each N Deposition Level";
  chartOpts["fig13f"].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
  chartOpts["fig13f"].small.options.scales.yAxes[0].ticks.max = 102;
  chartOpts["fig13f"].small.options.scales.yAxes[0].ticks.stepSize = 20;
  chartOpts["fig13f"].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13f"].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13f");
  chartOpts["fig13f"].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  chartOpts["fig13f"].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13f"].small.options.scales.xAxes[0].gridLines.display = true;
  chartOpts["fig13f"].small.options.scales.xAxes[0].scaleLabel = {
    display: true,
    labelString: "N Deposition (kg/ha/yr)",
    fontSize: 8
  }
  chartOpts["fig13f"].small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";
  chartOpts["fig13f"].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
  //***Large graph
  chartOpts["fig13f"].large = JSON.parse(JSON.stringify(chartOpts["fig13f"].small));
  tmpRegions.forEach(function(d,j) {
    chartOpts["fig13f"].large.data.datasets[j].borderWidth = 5;
  });
  chartOpts["fig13f"].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13f"].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13f"].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  
  //***Print graph
  chartOpts["fig13f"].print = JSON.parse(JSON.stringify(chartOpts["fig13f"].large));
  chartOpts["fig13f"].print.options.legend.labels.boxWidth = 20;
  chartOpts["fig13f"].print.options.legend.labels.padding = 20;
  chartOpts["fig13f"].print.options.legend.labels.fontSize = 20;
  chartOpts["fig13f"].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13f"].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13f"].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

  var fig13f_ctx = document.getElementById("fig13f").getContext('2d');
  chartCanvas["fig13f" + "Small"] = new Chart(fig13f_ctx, chartOpts["fig13f"].small);
}








function fig13a(tmpData) {
  //***Figure 13A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.cl.bottom(Infinity);
    var tmpPercent = filtData.map(function(d) { return d.percentage; });
    var tmpCL = filtData.map(function(d) { return d.cl; });

    var tmpPercentCum = [];
    tmpPercent.forEach(function(val,j) {
      if(j == 0) {
        tmpPercentCum[j] = 100 - val;
      }
      else {
        tmpPercentCum[j] = tmpPercentCum[j-1] - val;
      }
    });

    var maxCL = Math.max(...tmpCL);
    var tmpPercentCumFull = [];
    var tmpCLCum = [];
    for (var j = 0; j < maxCL + 2; j++) {
      tmpCLCum[j] = j;
      if(tmpCL.indexOf(j) > -1) {
        tmpPercentCumFull[j] = tmpPercentCum[tmpCL.indexOf(j)].toFixed(5);
      }
      else {
        tmpPercentCumFull[j] = null;
      }
    }

    var tmpBi = 0
    tmpPercentCumFull.some(function(val, j) {
      if(!val == true) {
        tmpPercentCumFull[j] = 100;
      }
      else {
        tmpBi = 1;
      }
      return tmpBi == 1;
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13a-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13a-" + i] = {};
    //***Small graph
    chartOpts["fig13a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13a-" + i].small.type = 'line';
    chartOpts["fig13a-" + i].small.data.labels = tmpCLCum;
    chartOpts["fig13a-" + i].small.data.datasets[0].backgroundColor = 'rgba(255,102,0,0)';
    chartOpts["fig13a-" + i].small.data.datasets[0].borderColor = 'rgba(255,102,0,1)';
    chartOpts["fig13a-" + i].small.data.datasets[0].data = tmpPercentCumFull;
    chartOpts["fig13a-" + i].small.data.datasets[0].pointRadius = 0;
    chartOpts["fig13a-" + i].small.data.datasets[0].pointHitRadius = 20;
    chartOpts["fig13a-" + i].small.data.datasets[0].lineTension = 0;
    chartOpts["fig13a-" + i].small.data.datasets[0].spanGaps = true;
    chartOpts["fig13a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13a-" + i).classed("selected", true);};
    chartOpts["fig13a-" + i].small.options.title.text = "Area Protected at Most Protective CL at Each N Deposition Level";
    chartOpts["fig13a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
    chartOpts["fig13a-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13a-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13a-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13a");
    chartOpts["fig13a-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13a-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    delete chartOpts["fig13a-" + i].small.options.scales.xAxes[0].ticks.stepSize;
    chartOpts["fig13a-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13a-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13a-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13a-" + i].small));
    chartOpts["fig13a-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13a-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13a-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13a-" + i].large.data.datasets[0].borderWidth = 5;
    chartOpts["fig13a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13a-" + i].large));
    chartOpts["fig13a-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13a-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13a-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13a_ctx = document.getElementById("fig13a-" + i).getContext('2d');
    chartCanvas["fig13a-" + i + "Small"] = new Chart(fig13a_ctx, chartOpts["fig13a-" + i].small);
  });
}






function fig13d(tmpData) {
  //***Figure 13D
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });


    var tmpPercent = [];
    var tmpCL = [];
    var maxLength = 0;
    var tmpIndex = 0;
    var tmpPercentCum = [[],[],[],[]];

    ["A (Min Min)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.cl.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpCL[j] = filtData.map(function(d) { return d.cl; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }

        if(k == 0) {
          tmpPercentCum[j][k] = 100 - val;
        }
        else {
          tmpPercentCum[j][k] = tmpPercentCum[j][k-1] - val;
        }
      });
      exc.filter.cl_category.filterAll();
    });

    var tmpMaxCL = [];
    tmpCL.forEach(function(cl) {
      tmpMaxCL.push(Math.max(...cl));
    });

    var maxCL = Math.max(...tmpMaxCL);
    var tmpPercentCumFull = [[],[],[],[]];
    var tmpCLCum = [[],[],[],[]];
    tmpCL.forEach(function(cl,k) {
      for (var j = 0; j < maxCL + 2; j++) {
        tmpCLCum[k][j] = j;
        if(tmpCL[k].indexOf(j) > -1) {
          tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
        }
        else {
          tmpPercentCumFull[k][j] = null;
        }
      }

      var tmpBi = 0
      tmpPercentCumFull[k].some(function(val, j) {
        if(!val == true) {
          tmpPercentCumFull[k][j] = 100;
        }
        else {
          tmpBi = 1;
        }
        return tmpBi == 1;
      });
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13d-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13d-" + i] = {};
    //***Small graph
    chartOpts["fig13d-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13d-" + i].small.type = 'line';
    chartOpts["fig13d-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig13d-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",0.5)",
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        spanGaps: true,
        label: "CL " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });
    chartOpts["fig13d-" + i].small.data.datasets[0].fill = false;
    chartOpts["fig13d-" + i].small.data.datasets[1].fill = 0;

    chartOpts["fig13d-" + i].small.options.legend.display = true;
    chartOpts["fig13d-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13d-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13d-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13d-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13d-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13d-" + i).classed("selected", true);};
    chartOpts["fig13d-" + i].small.options.title.text = "Area Protected at Each N Deposition Level";
    chartOpts["fig13d-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
    chartOpts["fig13d-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13d-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13d-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13d-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13d");
    chartOpts["fig13d-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13d-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13d-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13d-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13d-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13d-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13d-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13d-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig13d-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig13d-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig13d-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13d-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13d-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13d-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13d-" + i].large));
    chartOpts["fig13d-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig13d-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig13d-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig13d-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13d-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13d-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13d_ctx = document.getElementById("fig13d-" + i).getContext('2d');
    chartCanvas["fig13d-" + i + "Small"] = new Chart(fig13d_ctx, chartOpts["fig13d-" + i].small);
  });
}





function fig13c(tmpData) {
  //***Figure 13C
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });


    var tmpPercent = [];
    var tmpCL = [];
    var maxLength = 0;
    var tmpIndex = 0;
    var tmpPercentCum = [[],[],[],[]];

    ["A (Min Min)", "B (Max Min)", "C (Max Max)", "D (Min Max)"].forEach(function(CLcat,j) {
      exc.filter.cl_category.filterFunction(function(d) { return d == CLcat; });
      var filtData = exc.filter.cl.bottom(Infinity);
      tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
      tmpCL[j] = filtData.map(function(d) { return d.cl; });

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }

        if(k == 0) {
          tmpPercentCum[j][k] = 100 - val;
        }
        else {
          tmpPercentCum[j][k] = tmpPercentCum[j][k-1] - val;
        }
      });
      exc.filter.cl_category.filterAll();
    });

    var tmpMaxCL = [];
    tmpCL.forEach(function(cl) {
      tmpMaxCL.push(Math.max(...cl));
    });

    var maxCL = Math.max(...tmpMaxCL);
    var tmpPercentCumFull = [[],[],[],[]];
    var tmpCLCum = [[],[],[],[]];
    tmpCL.forEach(function(cl,k) {
      for (var j = 0; j < maxCL + 2; j++) {
        tmpCLCum[k][j] = j;
        if(tmpCL[k].indexOf(j) > -1) {
          tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
        }
        else {
          tmpPercentCumFull[k][j] = null;
        }
      }

      var tmpBi = 0
      tmpPercentCumFull[k].some(function(val, j) {
        if(!val == true) {
          tmpPercentCumFull[k][j] = 100;
        }
        else {
          tmpBi = 1;
        }
        return tmpBi == 1;
      });
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13c-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13c-" + i] = {};
    //***Small graph
    chartOpts["fig13c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13c-" + i].small.type = 'line';
    chartOpts["fig13c-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig13c-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",1)",
        fill: false,
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        spanGaps: true,
        label: "EX " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig13c-" + i].small.options.legend.display = true;
    chartOpts["fig13c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13c-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13c-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13c-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig13c-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13c-" + i).classed("selected", true);};
    chartOpts["fig13c-" + i].small.options.title.text = "Area Protected at Each N Deposition Level";
    chartOpts["fig13c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
    chartOpts["fig13c-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig13c-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig13c-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13c");
    chartOpts["fig13c-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig13c-" + i].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig13c-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig13c-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Combined Species";
    chartOpts["fig13c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

    //***Large graph
    chartOpts["fig13c-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig13c-" + i].small));
    tmpColors.forEach(function(d,j) {
      chartOpts["fig13c-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig13c-" + i].large.options.legend.labels.padding = 25;
    chartOpts["fig13c-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13c-" + i].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13c-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    //***Print graph
    chartOpts["fig13c-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig13c-" + i].large));
    chartOpts["fig13c-" + i].print.options.legend.labels.boxWidth = 25;
    chartOpts["fig13c-" + i].print.options.legend.labels.padding = 30;
    chartOpts["fig13c-" + i].print.options.legend.labels.fontSize = 25;
    chartOpts["fig13c-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig13c-" + i].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
    chartOpts["fig13c-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

    var fig13c_ctx = document.getElementById("fig13c-" + i).getContext('2d');
    chartCanvas["fig13c-" + i + "Small"] = new Chart(fig13c_ctx, chartOpts["fig13c-" + i].small);
  });
}






function fig6a(tmpData) {
  //***Figure 6A
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.species.bottom(Infinity);
    var tmpSpecies = filtData.map(function(d) { return d.species; });
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));
    
    var tmpPoints = filtData.map(function(d) { 
      if(d.min == d.max) {
        if(d.lo_percent == 100) {
          return [{"x": 0, "y": 100}, {"x": d.min - 1, "y": 100}, {"x": d.min, "y": 100 - d.lo_percent}, {"x": maxCL, "y": 0}];
        }
        else {
          return [{"x": 0, "y": 100}, {"x": d.max - 1, "y": 100 - d.lo_percent}, {"x": d.max, "y": 0}, {"x": maxCL, "y": 0}];
        }
      }
      else {
        return [{"x": 0, "y": 100}, {"x": d.min - 1, "y": 100}, {"x": d.min, "y": 100 - d.lo_percent}, {"x": d.max - 1, "y": 100 - d.lo_percent}, {"x": d.max, "y": 0}, {"x": maxCL, "y": 0}];
      }
    });

    d3.select("#resFigsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig6a-' + i + '" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

    chartOpts["fig6a-" + i] = {};
    //***Small graph
    chartOpts["fig6a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["fig6a-" + i].small.type = 'line';

    tmpSpecies.forEach(function(spp,j) {
      chartOpts["fig6a-" + i].small.data.datasets[j] = {
        backgroundColor: "rgba(" + sppColors[spp] + ",1)",
        fill: false,
        borderColor: "rgba(" + sppColors[spp] + ",1)",
        data: tmpPoints[j],
        pointRadius: 0,
        pointHitRadius: 20,
        //steppedLine: true,
        lineTension: 0,
        spanGaps: true,
        label: spp
      }
    });

    chartOpts["fig6a-" + i].small.options.legend.display = true;
    chartOpts["fig6a-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig6a-" + i].small.options.legend.labels.fontSize = 3;
    chartOpts["fig6a-" + i].small.options.legend.labels.boxWidth = 3;
    chartOpts["fig6a-" + i].small.options.legend.labels.padding = 3;
    chartOpts["fig6a-" + i].small.options.legend.labels.fontStyle = 'italic';
    chartOpts["fig6a-" + i].small.options.onClick = function(evt, tmpArray) { viewFig("fig6a-" + i); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig6a-" + i).classed("selected", true);};
    chartOpts["fig6a-" + i].small.options.title.text = "Area Protected at Most Protective CL at Each N Deposition Level";
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].type = 'linear';
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig6a");
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    chartOpts["fig6a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["fig6a-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
    //***Large graph
    chartOpts["fig6a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig6a-" + i].small));
    tmpSpecies.forEach(function(d,j) {
      chartOpts["fig6a-" + i].large.data.datasets[j].borderWidth = 5;
    });
    chartOpts["fig6a-" + i].large.options.legend.labels.padding = 12;
    chartOpts["fig6a-" + i].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  
    //***Print graph
    chartOpts["fig6a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig6a-" + i].large));
    chartOpts["fig6a-" + i].print.options.legend.labels.boxWidth = 20;
    chartOpts["fig6a-" + i].print.options.legend.labels.padding = 20;
    chartOpts["fig6a-" + i].print.options.legend.labels.fontSize = 20;
    chartOpts["fig6a-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };

    var fig6a_ctx = document.getElementById("fig6a-" + i).getContext('2d');
    chartCanvas["fig6a-" + i + "Small"] = new Chart(fig6a_ctx, chartOpts["fig6a-" + i].small);
  });
}







function fig13b(tmpData) {
  //***Figure 13B
  var tmpRegions = topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].features.map(function(d) { return d.id; });;

  var tmpCF = crossfilter(tmpData);
  var exc = {filter:{}};
  
  exc = {filter: {}};
  exc.keys = d3.keys(tmpData[0]);
  exc.vals = d3.values(tmpData[0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  exc.filter.cl_category.filterFunction(function(d) { return d == "A (Min Min)"; });

  var tmpPercent = [];
  var tmpCL = [];
  var maxLength = 0;
  var tmpIndex = 0;
  var tmpPercentCum = [];

  tmpRegions.forEach(function(reg,j) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.cl.bottom(Infinity);
    tmpPercent[j] = filtData.map(function(d) { return d.percentage; });
    tmpCL[j] = filtData.map(function(d) { return d.cl; });

    //***Find greatest non-zero length
    tmpPercentCum[j] = [];
    tmpPercent[j].forEach(function(val,k) {
      if(val > 0 && k > maxLength) {
        maxLength = k;
        tmpIndex = j;
      }

      if(k == 0) {
        tmpPercentCum[j][k] = 100 - val;
      }
      else {
        tmpPercentCum[j][k] = tmpPercentCum[j][k-1] - val;
      }
    });
  });

  var tmpMaxCL = [];
  tmpCL.forEach(function(cl) {
    tmpMaxCL.push(Math.max(...cl));
  });

  var maxCL = Math.max(...tmpMaxCL);
  var tmpPercentCumFull = [];
  var tmpCLCum = [];
  tmpCL.forEach(function(cl,k) {
    tmpPercentCumFull[k] = [];
    tmpCLCum[k] = [];
    for (var j = 0; j < maxCL + 2; j++) {
      tmpCLCum[k][j] = j;
      if(tmpCL[k].indexOf(j) > -1) {
        tmpPercentCumFull[k][j] = tmpPercentCum[k][tmpCL[k].indexOf(j)].toFixed(5);
      }
      else {
        tmpPercentCumFull[k][j] = null;
      }
    }

    var tmpBi = 0
    tmpPercentCumFull[k].some(function(val, j) {
      if(!val == true) {
        tmpPercentCumFull[k][j] = 100;
      }
      else {
        tmpBi = 1;
      }
      return tmpBi == 1;
    });
  });


  d3.select("#resFigsDiv")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="fig13b" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

  chartOpts["fig13b"] = {};
  //***Small graph
  chartOpts["fig13b"].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts["fig13b"].small.type = 'line';
  chartOpts["fig13b"].small.data.labels = tmpCLCum[0];

  tmpRegions.forEach(function(reg,j) {
    chartOpts["fig13b"].small.data.datasets[j] = {
      backgroundColor: areaColors[d3.select("#areaList").attr("value")][j],
      fill: false,
      borderColor: areaColors[d3.select("#areaList").attr("value")][j],
      data: tmpPercentCumFull[j],
      pointRadius: 0,
      pointHitRadius: 20,
      lineTension: 0,
      spanGaps: true,
      label: reg
    }
  });

  chartOpts["fig13b"].small.options.legend.display = true;
  chartOpts["fig13b"].small.options.legend.position = 'bottom';
  chartOpts["fig13b"].small.options.legend.labels.fontSize = 3;
  chartOpts["fig13b"].small.options.legend.labels.boxWidth = 3;
  chartOpts["fig13b"].small.options.legend.labels.padding = 3;
  chartOpts["fig13b"].small.options.onClick = function(evt, tmpArray) { viewFig("fig13b"); d3.selectAll(".canvasChart").classed("selected", false); d3.select("#fig13b").classed("selected", true);};
  chartOpts["fig13b"].small.options.title.text = "Area Protected at Most Protective CL at Each N Deposition Level";
  chartOpts["fig13b"].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
  chartOpts["fig13b"].small.options.scales.yAxes[0].ticks.max = 102;
  chartOpts["fig13b"].small.options.scales.yAxes[0].ticks.stepSize = 20;
  chartOpts["fig13b"].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13b"].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig13b");
  chartOpts["fig13b"].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  chartOpts["fig13b"].small.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13b"].small.options.scales.xAxes[0].gridLines.display = true;
  chartOpts["fig13b"].small.options.scales.xAxes[0].scaleLabel = {
    display: true,
    labelString: "N Deposition (kg/ha/yr)",
    fontSize: 8
  }
  chartOpts["fig13b"].small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";
  chartOpts["fig13b"].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
  //***Large graph
  chartOpts["fig13b"].large = JSON.parse(JSON.stringify(chartOpts["fig13b"].small));
  tmpRegions.forEach(function(d,j) {
    chartOpts["fig13b"].large.data.datasets[j].borderWidth = 5;
  });
  chartOpts["fig13b"].large.options.legend.labels.padding = 25;
  chartOpts["fig13b"].large.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13b"].large.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13b"].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  
  //***Print graph
  chartOpts["fig13b"].print = JSON.parse(JSON.stringify(chartOpts["fig13b"].large));
  chartOpts["fig13b"].print.options.legend.labels.boxWidth = 20;
  chartOpts["fig13b"].print.options.legend.labels.padding = 20;
  chartOpts["fig13b"].print.options.legend.labels.fontSize = 20;
  chartOpts["fig13b"].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
  chartOpts["fig13b"].print.options.scales.xAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= maxCL; }); return; };
  chartOpts["fig13b"].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };

  var fig13b_ctx = document.getElementById("fig13b").getContext('2d');
  chartCanvas["fig13b" + "Small"] = new Chart(fig13b_ctx, chartOpts["fig13b"].small);
}






function tab3b(tmpData) {
  //***Table 3b
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData[0]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[0][0]);
  exc.vals = d3.values(tmpData[0][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF2 = crossfilter(tmpData[1]);
  var exc2 = {filter:{}};
  
  exc2.keys = d3.keys(tmpData[1][0]);
  exc2.vals = d3.values(tmpData[1][0]);

  exc2.keys.forEach(function(key, i) {
    exc2.filter[key] = tmpCF2.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    exc2.filter.region_name.filterAll();
    exc2.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.species.bottom(Infinity);
    var regData = exc2.filter.region_name.bottom(Infinity);
    var tmpSpecies = filtData.map(function(d) { return d.species; });
    var tmpPercent = filtData.map(function(d) { return [d.lo_percent, 100]; });
    var tmpCL = filtData.map(function(d) { return [d.min, d.max]; });
    var minCL = Math.min(...filtData.map(function(d) { return d.min; }));
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));
    regData[0].minCL = minCL;
    regData[0].maxCL = maxCL;
    regData[0].title = "% Area in Exceedance of Most Protective CL at Each N Deposition Level";
    regData[0].table = 0;

    if(maxCL % 1 != 0) {
      maxCL = parseInt(maxCL) + 1;
    }

    var tmpCLFull = [];
    tmpSpecies.forEach(function(spp,k) {
      tmpCLFull.push([]);
      var tmpInt = 0;
      var tmpVal = 0;
      for(var j = 0; j <= maxCL; j++) {
        if(tmpCL[k][tmpInt] <= j) {
          tmpVal = tmpPercent[k][tmpInt]
          tmpInt = 1;
        }
        tmpCLFull[k].push(tmpVal)
      }
    });

    var tmpCLFullInvert = [];
    var tmpCLFullMod = [];
    var tmpColors = [];
    var tmpXLabels = [];
    for(var j = 0; j <= maxCL; j++) {
      tmpCLFullInvert.push([]);
      tmpCLFullMod.push([]);
      tmpColors.push([]);
      for(var k = 0; k < tmpSpecies.length; k++) {
        tmpCLFullInvert[j].push(tmpCLFull[k][j]);
        tmpCLFullMod[j].push(j);
        if(tmpCLFull[k][j] == 0) {
          tmpColors[j].push("lightgray");
        }
        else if(tmpCLFull[k][j] <= 25) {
          tmpColors[j].push("#ffddcc");
        }
        else if(tmpCLFull[k][j] <= 50) {
          tmpColors[j].push("#ffaa80");
        }
        else if(tmpCLFull[k][j] <= 75) {
          tmpColors[j].push("#ff7733");
        }
        else if(tmpCLFull[k][j] < 100) {
          tmpColors[j].push("#e64d00");
        }
        else {
          tmpColors[j].push("#993300");
        }

      }
      tmpXLabels.push(j);
    }
    
    d3.select("#resTabsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="tab3b-' + i + '" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

    d3.select("#tab3b-" + i).property("title", reg + " - Species Exceedance");

    chartOpts["tab3b-" + i] = {};
    //***Small graph
    chartOpts["tab3b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["tab3b-" + i].small.cl = regData;
    chartOpts["tab3b-" + i].small.type = 'horizontalBar';
    chartOpts["tab3b-" + i].small.data.yLabels = tmpSpecies;
    chartOpts["tab3b-" + i].small.data.xLabels = tmpXLabels;

    tmpColors.forEach(function(color,j) {
      chartOpts["tab3b-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColors[j],
        borderColor: 'black',
        borderWidth: 1,
        data: tmpCLFullMod[j],
        label: ""
      }
    });

    chartOpts["tab3b-" + i].small.options.tooltips = {"enabled": false};
    chartOpts["tab3b-" + i].small.options.animation = {
      duration: 1,
      hover: {"animationDuration": 0},
      onComplete: function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = (3 + ((19 - maxCL)/8)) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 1) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
              ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (5 + ((19 - maxCL) * 1)), bar._model.y);
            });
          }
        });
      }
    }
    chartOpts["tab3b-" + i].small.options.animation.duration = 0,
    chartOpts["tab3b-" + i].small.options.events = ["click"],
    chartOpts["tab3b-" + i].small.options.onClick = function(evt, tmpArray) {
      chartCanvas["tab3b-" + i + "Small"].clear();
      chartCanvas["tab3b-" + i + "Small"].render();
      viewFig("tab3b-" + i); 
      d3.selectAll(".canvasChart").classed("selected", false); 
      d3.select("#tab3b-" + i).classed("selected", true);
      setTimeout(function() {
        addInfo(chartCanvas["tab3b-" + i + "Small"], chartOpts["tab3b-" + i].small.cl[0], document.getElementById("tab3b-" + i).getBoundingClientRect(), "small", 1);
      }, 30);
    };
    //chartOpts["tab3b-" + i].small.options.title.text = "% Area in Exceedance of Most Protective CL at Each N Deposition Level";
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Species";
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].ticks.fontSize = 4;
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "italic";
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].barPercentage = 1;
    chartOpts["tab3b-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].position = 'top';
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.min = 1;
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.max = maxCL - 1;
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].type = 'category';
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "tab3b");
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["tab3b-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    //chartOpts["tab3b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["tab3b-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
    //***Large graph
    chartOpts["tab3b-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab3b-" + i].small));
    //chartOpts["tab3b-" + i].large.options.onResize = function(inst, newSize) { console.log(newSize); addInfo(chartCanvas["tab3b-" + i + "Large"], chartOpts["tab3b-" + i].large.cl[0], newSize, "large", 0.75); },
    chartOpts["tab3b-" + i].large.options.events = false;
    chartOpts["tab3b-" + i].large.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = (12 + ((19 - maxCL)/2)) + "px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.data.datasets.forEach(function (dataset, i) {
        if(i > 1) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            var data = dataset.data[index];                            
            ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (25 + ((19 - maxCL) * 3)), bar._model.y);
         });
        }
      });
    }

    //***Disable animation in small table so header and legend can be added
    chartOpts["tab3b-" + i].small.options.animation = false;
  
    //***Print graph
    chartOpts["tab3b-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab3b-" + i].large));
    chartOpts["tab3b-" + i].print.options.layout.padding.layout.top = 20;
    chartOpts["tab3b-" + i].print.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = (18 + ((19 - maxCL)/2)) + "px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.data.datasets.forEach(function (dataset, i) {
        if(i > 1) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            var data = dataset.data[index];                            
            ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (33 + ((19 - maxCL) * 4)), bar._model.y);
         });
        }
      });
    }

    var tab3b_ctx = document.getElementById("tab3b-" + i).getContext('2d');
    chartCanvas["tab3b-" + i + "Small"] = new Chart(tab3b_ctx, chartOpts["tab3b-" + i].small);
  });
}






function tab3c(tmpData) {
  //***Table 3c
  var tmpRegions = [];
  d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

  var tmpCF = crossfilter(tmpData[0]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[0][0]);
  exc.vals = d3.values(tmpData[0][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF2 = crossfilter(tmpData[1]);
  var exc2 = {filter:{}};
  
  exc2.keys = d3.keys(tmpData[1][0]);
  exc2.vals = d3.values(tmpData[1][0]);

  exc2.keys.forEach(function(key, i) {
    exc2.filter[key] = tmpCF2.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  tmpRegions.forEach(function(reg,i) {
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    exc2.filter.region_name.filterAll();
    exc2.filter.region_name.filterFunction(function(d) { return d == reg; });

    var filtData = exc.filter.species.bottom(Infinity);
    var regData = exc2.filter.region_name.bottom(Infinity);
    var tmpSpecies = filtData.map(function(d) { return d.species; });
    var tmpPercent = filtData.map(function(d) { return [100 - d.lo_percent, 0]; });
    var tmpCL = filtData.map(function(d) { return [d.min, d.max]; });
    var minCL = Math.min(...filtData.map(function(d) { return d.min; }));
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));
    regData[0].minCL = minCL;
    regData[0].maxCL = maxCL;
    regData[0].title = "% Area Protected by Most Protective CL at Each N Deposition Level";
    regData[0].table = 1;

    if(maxCL % 1 != 0) {
      maxCL = parseInt(maxCL) + 1;
    }

    var tmpCLFull = [];
    tmpSpecies.forEach(function(spp,k) {
      tmpCLFull.push([]);
      var tmpInt = 0;
      var tmpVal = 100;
      for(var j = 0; j <= maxCL; j++) {
        if(tmpCL[k][tmpInt] <= j) {
          tmpVal = tmpPercent[k][tmpInt]
          tmpInt = 1;
        }
        tmpCLFull[k].push(tmpVal)
      }
    });

    var tmpCLFullInvert = [];
    var tmpCLFullMod = [];
    var tmpColors = [];
    var tmpXLabels = [];
    for(var j = 0; j <= maxCL; j++) {
      tmpCLFullInvert.push([]);
      tmpCLFullMod.push([]);
      tmpColors.push([]);
      for(var k = 0; k < tmpSpecies.length; k++) {
        tmpCLFullInvert[j].push(tmpCLFull[k][j]);
        tmpCLFullMod[j].push(j);
        if(tmpCLFull[k][j] == 0) {
          tmpColors[j].push("#993300");
        }
        else if(tmpCLFull[k][j] <= 25) {
          tmpColors[j].push("#e64d00");
        }
        else if(tmpCLFull[k][j] <= 50) {
          tmpColors[j].push("#ff7733");
        }
        else if(tmpCLFull[k][j] <= 75) {
          tmpColors[j].push("#ffaa80");
        }
        else if(tmpCLFull[k][j] < 100) {
          tmpColors[j].push("#ffddcc");
        }
        else {
          tmpColors[j].push("lightgray");
        }

      }
      tmpXLabels.push(j);
    }
    
    d3.select("#resTabsDiv")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="tab3c-' + i + '" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');

    d3.select("#tab3c-" + i).property("title", reg + " - Species Protection");

    chartOpts["tab3c-" + i] = {};
    //***Small graph
    chartOpts["tab3c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["tab3c-" + i].small.cl = regData;
    chartOpts["tab3c-" + i].small.type = 'horizontalBar';
    chartOpts["tab3c-" + i].small.data.yLabels = tmpSpecies;
    chartOpts["tab3c-" + i].small.data.xLabels = tmpXLabels;

    tmpColors.forEach(function(color,j) {
      chartOpts["tab3c-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColors[j],
        borderColor: 'black',
        borderWidth: 1,
        data: tmpCLFullMod[j],
        label: ""
      }
    });

    chartOpts["tab3c-" + i].small.options.tooltips = {"enabled": false};
    chartOpts["tab3c-" + i].small.options.animation = {
      duration: 1,
      hover: {"animationDuration": 0},
      onComplete: function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = (3 + ((19 - maxCL)/8)) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 1) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
              ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (5 + ((19 - maxCL) * 1)), bar._model.y);
            });
          }
        });
      }
    }
    chartOpts["tab3c-" + i].small.options.animation.duration = 0,
    chartOpts["tab3c-" + i].small.options.events = ["click"],
    chartOpts["tab3c-" + i].small.options.onClick = function(evt, tmpArray) {
      chartCanvas["tab3c-" + i + "Small"].clear();
      chartCanvas["tab3c-" + i + "Small"].render();
      viewFig("tab3c-" + i); 
      d3.selectAll(".canvasChart").classed("selected", false); 
      d3.select("#tab3c-" + i).classed("selected", true);
      setTimeout(function() {
        addInfo(chartCanvas["tab3c-" + i + "Small"], chartOpts["tab3c-" + i].small.cl[0], document.getElementById("tab3c-" + i).getBoundingClientRect(), "small", 1);
      }, 30);
    };
    //chartOpts["tab3c-" + i].small.options.title.text = "% Area in Exceedance of Most Protective CL at Each N Deposition Level";
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Species";
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].ticks.fontSize = 4;
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "italic";
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].barPercentage = 1;
    chartOpts["tab3c-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].position = 'top';
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.min = 1;
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.max = maxCL - 1;
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].type = 'category';
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "tab3c");
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["tab3c-" + i].small.options.scales.xAxes[0].scaleLabel = {
      display: true,
      labelString: "N Deposition (kg/ha/yr)",
      fontSize: 8
    }
    //chartOpts["tab3c-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
    chartOpts["tab3c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;
  
    //***Large graph
    chartOpts["tab3c-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab3c-" + i].small));
    //chartOpts["tab3c-" + i].large.options.onResize = function(inst, newSize) { console.log(newSize); addInfo(chartCanvas["tab3c-" + i + "Large"], chartOpts["tab3c-" + i].large.cl[0], newSize, "large", 0.75); },
    chartOpts["tab3c-" + i].large.options.events = false;
    chartOpts["tab3c-" + i].large.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = (12 + ((19 - maxCL)/2)) + "px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.data.datasets.forEach(function (dataset, i) {
        if(i > 1) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            var data = dataset.data[index];                            
            ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (25 + ((19 - maxCL) * 3)), bar._model.y);
         });
        }
      });
    }

    //***Disable animation in small table so header and legend can be added
    chartOpts["tab3c-" + i].small.options.animation = false;
  
    //***Print graph
    chartOpts["tab3c-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab3c-" + i].large));
    chartOpts["tab3c-" + i].print.options.layout.padding.layout.top = 20;
    chartOpts["tab3c-" + i].print.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = (18 + ((19 - maxCL)/2)) + "px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.data.datasets.forEach(function (dataset, i) {
        if(i > 1) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            var data = dataset.data[index];                            
            ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - (33 + ((19 - maxCL) * 4)), bar._model.y);
         });
        }
      });
    }

    var tab3c_ctx = document.getElementById("tab3c-" + i).getContext('2d');
    chartCanvas["tab3c-" + i + "Small"] = new Chart(tab3c_ctx, chartOpts["tab3c-" + i].small);
  });
}

