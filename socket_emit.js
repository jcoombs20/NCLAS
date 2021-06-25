function socket_emit() {
  socket = io.connect();
  //socket = io.connect('https://nclas.ecosheds.org/socket.io/', {secure: true});

  socket.on('connect', function() {
    console.log("connected to socket");
  });

  socket.on('get_spp', function(sppData) {
    var sppExc = sppData[0].map(function(d) { return d.species; });
    var sppNoExc = sppData[1].map(function(d) { return d.species; });
    var sppNoExcFilter = sppNoExc.filter(function(spp) { if(sppExc.indexOf(spp) > -1) {return false;} else {return true;} });

    addSpeciesNames(sppExc,sppNoExcFilter);
  });

  socket.on('get_abiotic', function(abioticData, tmpVals) {
    //console.log(abioticData);
    //console.log(tmpVals);
    //***Remove all histograms
    d3.selectAll(".histFig").remove();
    d3.select("#histFigDiv").text("");

    tmpVals.hists.forEach(function(tmpHist,i) {
      tmpVals.areas.forEach(function(tmpArea,j) {
        //***Add div for graph
        d3.select("#histFigDiv")
          .append("div")
          .attr("id", "hist" + i + j)
          .attr("class", "histFig");

        d3.select("#histFigDiv")
          .append("div")
          .attr("id", "hist" + i + j + "DL")
          .attr("class", "histFigDL")
          .html('<a id="histFigDLFig' + i + j + '" href="#" download="' + tmpArea + '-' + tmpHist + '.jpg"><span class="glyphicon glyphicon-stats histFigDLFig" title="Download as graph"></span></a><br><br><a id="histFigDLTab' + i + j + '" href="#" download="' + tmpArea + '-' + tmpHist + '.csv"><span class="glyphicon glyphicon-list-alt" title="Download as table"></span></a>');

        //***Filter data for area and abiotic factor
        var tmpData = [[tmpHist, "Count"]];
        var tickData = [];
        var step = 8;
        var start = 3;
        var k = 0
        var printData = [];
        abioticData[0].forEach(function(d) {
          if(d.region_name == tmpArea && d.abiotic == tmpHist) {
            tmpData.push([parseFloat(d.mid_bin), parseInt(d.count)]);
            printData.push(d);
            if(k == start) {
              //tickData.push(parseFloat(d.mid_bin.toFixed(2)));
              start += step;
            }
            k += 1;
          }
        });

/*
        if(tickData[tickData.length - 1] - tickData[0] > 10) {
          tickData.forEach(function(d,k) {
            tickData[k] = parseInt(d);
          });
        }
*/

        //***Add graph
        var data = google.visualization.arrayToDataTable(tmpData);
        var options = {
          title: tmpArea,
          titleTextStyle: {color: "black", fontSize: 16},
          //vAxis: {title: "Count", titleTextStyle: {bold: true, italic: false}},
          vAxis: {format: "short", textStyle: {fontSize: 12}},
          hAxis: {format: "decimal", title: tmpHist + " " + abioticUnits[tmpHist], titleTextStyle: {bold: true, italic: false, fontSize: 13}, textStyle: {fontSize: 12}}, //ticks: tickData, gridlines: {count: 4}},
          bar: {groupWidth: "100%"},
          tooltip: {textStyle: {fontSize: 13}},
          legend: {position: "none"},
          chartArea: {left: 35, width: 265},
          width: 300
        };
        
        //***Add small graph
        var chart = new google.visualization.ColumnChart(document.getElementById("hist" + i + j));
        chart.draw(data, options);
        //***New barchart style (doesn't have much style control)
        //var chart = new google.charts.Bar(document.getElementById("hist" + i + j));
        //chart.draw(data, google.charts.Bar.convertOptions(options));

        //***Add print graph
        d3.select("#histPrint").remove();
        d3.select("body")
          .append("div")
          .attr("id", "histPrint");

        options.width = 1800;
        options.height = 1200;
        options.chartArea.width = 1620;
        options.chartArea.height = 900; //800;
        options.chartArea.left = 180; //260;
        options.titleTextStyle.fontSize = 54; //96;
        options.titleTextStyle.italic = true;
        options.hAxis.titleTextStyle.fontSize = 45; //72;
        options.hAxis.titleTextStyle.italic = true;
        options.hAxis.textStyle = {fontSize: 36, italic: true}; //75
        options.vAxis.title = "Count";
        //options.hAxis.title = "";
        options.vAxis.titleTextStyle = {fontSize: 45, italic: true, bold: true}; //72
        options.vAxis.textStyle = {fontSize: 36, italic: true}; //75

        var chartPrint = new google.visualization.ColumnChart(document.getElementById("histPrint"));
        chartPrint.draw(data, options);

        //***Add jpg link
        var link = chartPrint.getImageURI();
        d3.select("#histFigDLFig" + i + j).attr("href", link);
        d3.select("#histPrint").style("display", "none");

        //***Add CSV link
        var printContent = "Area,Area Name,Abiotic,Lower Bin,Upper Bin,Mid Bid,Count\n";
        printData.forEach(function(d) {
          printContent += d.region + "," + d.region_name + "," + d.abiotic + "," + d.lower_bin + "," + d.upper_bin + "," + d.mid_bin + "," + d.count + "\n";
        });

/*
        //***Get data from chart (less information)
        //build column headings
        var csvColumns = '';
        for (var n = 0; n < data.getNumberOfColumns(); n++) {
          csvColumns += data.getColumnLabel(n);
          if (n < (data.getNumberOfColumns() - 1)) {
            csvColumns += ',';
          }
        }
        csvColumns += '\n';

        //get data rows
        var csvContent = csvColumns + google.visualization.dataTableToCsv(data);
*/

        d3.select("#histFigDLTab" + i + j).attr("href", "data:attachment/csv," +   encodeURIComponent(printContent));
      });
    });
    resizePanels();
  });


  socket.on('get_output', function(tmpData) {
    console.log(tmpData);
    //******Remove old graphs
    d3.select("#resFigsDiv")
      .selectAll("div")
      .selectAll("*")
      .remove();

    d3.select("#resTabsDiv")
      .selectAll("div")
      .selectAll("*")
      .remove();

    d3.select("#resMapsDiv")
      .selectAll("*")
      .remove();



    //******Add in divs for areas
    var tmpRegions = ["Combined Areas"];
    d3.selectAll(".remCheck")[0].forEach(function(d) { if(d.checked) { tmpRegions.push(d.value); } });

    var idArray = ["ExArea", "ExMag", "CL", "Exc", "Pro"];
    var classArray = ["pink", "blue", "yellow", "mauve", "green"];

    //***Figures
    idArray.forEach(function(tmpID, j) {
      tmpRegions.forEach(function(reg, i) {
        d3.selectAll("#resFigs" + tmpID)
          .append("div")
          .attr("id", "resRegFig" + tmpID + (i-1))
          .attr("class", "resReg")
          .style("top", 18 * i + "px")
          .html('<label style="margin-bottom:0;cursor:pointer;" data-toggle="collapse" data-target="#resRegFig' + tmpID + 'Canvas' + (i-1) + '">' + reg + '<span class="glyphicon glyphicon-triangle-bottom pull-right" style="margin-right:5px;"></span></label>');
        d3.selectAll("#resFigs" + tmpID)
          .append("div")
          .attr("id", "resRegFig" + tmpID + "Canvas" + (i-1))
          .attr("class", classArray[j] + " collapse")
          .style("padding", "5px 0");
      });
    });



    //***Tables
    var idArray = ["Current", "Response"];
    idArray.forEach(function(tmpID, j) {
      tmpRegions.forEach(function(reg, i) {
        d3.selectAll("#resTabs" + tmpID)
          .append("div")
          .attr("id", "resRegTab" + tmpID + (i-1))
          .attr("class", "resReg")
          .style("top", 18 * i + "px")
          .html('<label style="margin-bottom:0;cursor:pointer;" data-toggle="collapse" data-target="#resRegTab' + tmpID + 'Canvas' + (i-1) + '">' + reg + '<span class="glyphicon glyphicon-triangle-bottom pull-right" style="margin-right:5px;"></span></label>');
        d3.selectAll("#resTabs" + tmpID)
          .append("div")
          .attr("id", "resRegTab" + tmpID + "Canvas" + (i-1))
          .attr("class", classArray[j] + " collapse")
          .style("padding", "5px 0");

        $("#resRegTab" + tmpID + "Canvas" + (i-1)).on("shown.bs.collapse", function() {
          setTimeout(function() {
            d3.select("#resRegTab" + tmpID + "Canvas" + (i-1)).selectAll("canvas")[0].forEach(function(tmpCan) {
              chartCanvas[tmpCan.id + "Small"].update();
              var tmpPrint = chartCanvas[tmpCan.id + "Small"];
              var tmpRect = document.getElementById(tmpCan.id).getBoundingClientRect();
              addInfo(tmpPrint, chartOpts[tmpCan.id].small.cl[0], tmpRect, "small", 1, tmpCan.id);
            });
          }, 300);
        });
      });
    });






    //******Add in links to community and species maps
    //***Community
    d3.select("#resMapsDiv")
      //.append("div")
      .html(d3.select("#speciesListDropdown").selectAll("*").html());

    //***Species
    var tmpSpecies = [];
    d3.selectAll(".sppCheck")[0].forEach(function(d) { if(d.checked) { tmpSpecies.push(speciesID[d.value]); } });

    d3.select("#indSppDiv").selectAll(".indSpp")[0].forEach(function(tmpDiv,i) {
      if(tmpSpecies.indexOf(d3.select(tmpDiv).attr("name")) > -1) {
        d3.select("#resMapsDiv")
          .html(d3.select("#resMapsDiv").html() + d3.select(tmpDiv.parentNode).html());
      }
    });


    //***Add on click functionality
    d3.select("#resMapsDiv").select(".layerName")
      .attr("data-target", "#allSuboptionsMap")
      .style("top", "0px");

    d3.select("#resMapsDiv").select(".sppSuboptDiv")
      .attr("id", "allSuboptionsMap")
      .selectAll(".sppSubopt")
        .property("value", function(d,i) { return i; })
        .property("name", function(d,i) { return commID[i]; })
        .on("click", function() { changeCommunity(this); });

    d3.select("#resMapsDiv").selectAll(".indSpp")[0].forEach(function(tmpSppDiv, j) {
      var tmpSpp = d3.select(tmpSppDiv).attr("name");
      d3.select(tmpSppDiv)
        .attr("data-target", "#" + tmpSpp + "SuboptionsMap")
        .style({"padding-left":"5px","top":(18 * (j+1)) + "px"});            
      d3.select(tmpSppDiv.parentNode).selectAll(".sppSuboptDiv")[0].forEach(function(tmpSppLayerDiv) {
        if(d3.select(tmpSppLayerDiv).attr("name") == tmpSpp) {
          d3.select(tmpSppLayerDiv)
            .attr("id", tmpSpp + "SuboptionsMap")
            .selectAll(".sppSubopt")
              .property("value", function(d,i) { return i; })
              .property("name", function(d,i) { return tmpSpp + layerExt[i]; })
              .on("click", function(d,i) { changeSpecies(this, tmpSpp, layerExt[i]); });
        }
      });
    });  

    d3.select("#resMapsDiv").selectAll(".activeSpecies").style("font-size", "15px");



    //******Shorten names when appropriate
    areaShortName = {};
    tmpLength = 28;
    var tmpNames = d3.selectAll(".remCheck")[0].map(function(d) { return d3.select(d).attr("Value"); });

    switch(d3.select("#areaList").attr("value")) {
      case "Class I Areas":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace(" Wilderness",""); });
        break;
      case "Forest Service Admin Areas":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace("National Forests","NFs").replace("National Forest", "NF"); });
        break;
      case "Forest Service Wilderness Areas":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace(" Wilderness",""); });
        break;
      case "Level III Ecoregions":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace("",""); });
        tmpLength = 27;
        break;
      case "Level II Ecoregions":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace("",""); });
        break;
      case "Ecoregions Combined":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace("",""); });
        break;
      case "States":
        tmpNames.forEach(function(d) { areaShortName[d] = d.replace("",""); });
        break;
    }



    //******Determine which figures to produce
    var figArray = [];
    var figChecks = d3.selectAll(".figCheck")[0];
    figChecks.forEach(function(fig) {
      if(d3.select(fig).style("color") == "rgb(65, 105, 225)" || d3.select(fig).style("color") == "rgb(0, 255, 0)") {
        var tmpVal = d3.select(fig).attr("value");
        if(tmpVal.includes("_")) {
          var i = tmpVal.indexOf("_");
          var tmpVal = tmpVal.slice(0,i);
        }
        figChecks.push(tmpVal);
      }
    });


    if(figChecks.indexOf("fig15a") > -1) {
      fig15a(tmpData[0]);
    }
    if(figChecks.indexOf("fig15b") > -1) {
      fig15b(tmpData[0]);
    }
    if(figChecks.indexOf("fig15bi") > -1) {
      fig15bi([tmpData[0],tmpData[1]]);
    }
    if(figChecks.indexOf("fig2a") > -1) {
      fig2a(tmpData[2]);
    }
    if(figChecks.indexOf("fig2b") > -1) {
      fig2b(tmpData[2]);
    }
    if(figChecks.indexOf("fig2bi") > -1) {
      fig2bi([tmpData[2],tmpData[3]]);
    }
    if(figChecks.indexOf("fig11a") > -1) {
      fig11a(tmpData[4]);
    }
    if(figChecks.indexOf("fig12a") > -1) {
      fig12a(tmpData[4]);
    }
    if(figChecks.indexOf("fig12b") > -1) {
      fig12b(tmpData[4]);
    }
    if(figChecks.indexOf("fig3a") > -1) {
      fig3a(tmpData[5]);
    }
    if(figChecks.indexOf("fig4a") > -1) {
      fig4a(tmpData[5]);
    }
    if(figChecks.indexOf("fig4c") > -1) {
      fig4c(tmpData[5]);
    }
    if(figChecks.indexOf("fig1a") > -1) {
      fig1a(tmpData[6]);
    }
    if(figChecks.indexOf("fig1b") > -1) {
      fig1b(tmpData[6]);
    }
    if(figChecks.indexOf("fig9a") > -1) {
      fig9a(tmpData[7]);
    }
    if(figChecks.indexOf("fig9b") > -1) {
      fig9b(tmpData[7]);
    }
    if(figChecks.indexOf("fig13e") > -1) {
      fig13e(tmpData[7]);
    }
    if(figChecks.indexOf("fig13h") > -1) {
      fig13h(tmpData[7]);
    }
    if(figChecks.indexOf("fig13g") > -1) {
      fig13g(tmpData[7]);
    }
    if(figChecks.indexOf("fig6c") > -1) {
      fig6c(tmpData[8]);
    }
    if(figChecks.indexOf("fig13f") > -1) {
      fig13f(tmpData[7]);
    }
    if(figChecks.indexOf("fig13a") > -1) {
      fig13a(tmpData[7]);
    }
    if(figChecks.indexOf("fig13d") > -1) {
      fig13d(tmpData[7]);
    }
    if(figChecks.indexOf("fig13c") > -1) {
      fig13c(tmpData[7]);
    }
    if(figChecks.indexOf("fig6a") > -1) {
      fig6a(tmpData[8]);
    }
    if(figChecks.indexOf("fig13b") > -1) {
      fig13b(tmpData[7]);
    }


    if(figChecks.indexOf("tab3b") > -1) {
      tab3b([tmpData[8],tmpData[9]]);
    }
    if(figChecks.indexOf("tab3b") > -1) {
      tab3c([tmpData[8],tmpData[9]]);
    }
    if(figChecks.indexOf("fig15a") > -1) {
      tab4a([tmpData[12],tmpData[0],tmpData[9]]);
    }
    if(figChecks.indexOf("fig15b") > -1 || figChecks.indexOf("fig15bi") > -1) {
      tab2c([tmpData[8],tmpData[2],tmpData[9],tmpData[10], tmpData[11]]);
    }
    if(figChecks.indexOf("fig2a") > -1 || figChecks.indexOf("fig2b") > -1 || figChecks.indexOf("fig2bi") > -1) {
      tab2a([tmpData[8],tmpData[2],tmpData[9],tmpData[10], tmpData[11]]);
    }
    if(figChecks.indexOf("fig1a") > -1 || figChecks.indexOf("fig1b") > -1) {
      tab1c([tmpData[8],tmpData[2],tmpData[9],tmpData[10], tmpData[11]]);
      tab1a([tmpData[8],tmpData[2],tmpData[9],tmpData[10], tmpData[11]]);
    }


    //***Zoom to selected areas
    var tmpCoords = {"ll":{"lat":[],"lng":[]},"ur":{"lat":[],"lng":[]}};
    d3.selectAll(".remLabel")[0].forEach(function(tmpLab,i) {
      if(d3.select(tmpLab).select("input").property("checked") == true && tmpLab.id != "areaAllLabel") {
        tmpCoords.ll.lat.push(parseFloat(d3.select(tmpLab).attr("data-llLat")));
        tmpCoords.ll.lng.push(parseFloat(d3.select(tmpLab).attr("data-llLng")));
        tmpCoords.ur.lat.push(parseFloat(d3.select(tmpLab).attr("data-urLat")));
        tmpCoords.ur.lng.push(parseFloat(d3.select(tmpLab).attr("data-urLng")));
      }
    });
    map.fitBounds([[Math.min(...tmpCoords.ll.lat), Math.min(...tmpCoords.ll.lng)],[Math.max(...tmpCoords.ur.lat), Math.max(...tmpCoords.ur.lng)]]);


    //***Display appropriate windows
    $('#outputDiv').modal('hide')
    d3.select("#waitingDiv").style("display", "none");
    d3.select("#outputPreview").style("display", "none");
    d3.select("#outputOptions").style("display", "block");
    //d3.selectAll(".choice").style("display", "none");
    //d3.select("#resChoice").style("display", "block");
    $("#selRes").click();
    $("#resFigs").click();
  });

/*
  socket.on('disconnect', function(err) {
    console.log(err);
    console.log('Socket has been disconnected');
  });
*/

  socket.on('error', function(err) {
    console.log(err.error);
  });
}


//******View large version of figure/table in center window
function viewFig(tmpID) {
  d3.select("#container-results")
    .selectAll("#canvasChartsLargeDiv,#downloadJPEG,#downloadJPEGData")
    .remove();

  //***Make button to save graph as JPEG
  d3.select("#container-results")
    .append("div")
    .attr("id", "downloadJPEG")
    .attr("class", "cl_select")
    .property("title", function() { if(d3.select("#resFigs").classed("active")) { return "Click to download graph as a JPEG"; } else { return "Click to download table as a JPEG"; } })
    .html(function() { if(d3.select("#resFigs").classed("active")) { return '<a id="dlJPEGLink" href="#" download="' + tmpID + ".jpg" + '"><span> Download Graph Image </span></a>'; } else { return '<a id="dlJPEGLink" href="#" download="' + tmpID + ".jpg" + '"><span> Download Table Image </span></a>'; } });

  d3.select("#container-results")
    .append("div")
    .attr("id", "downloadJPEGData")
    .attr("class", "cl_select")
    .property("title", function() { if(d3.select("#resFigs").classed("active")) { return "Click to download graph data as a CSV file"; } else { return "Click to download table data as a CSV file"; } })
    .html(function() { if(d3.select("#resFigs").classed("active")) { return '<a id="dlJPEGDataLink" href="#" download="' + tmpID + ".csv" + '"><span> Download Graph Data </span></a>'; } else { return '<a id="dlJPEGDataLink" href="#" download="' + tmpID + ".csv" + '"><span> Download Table Data </span></a>'; } });

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

  if(!tmpID.includes("fig12") && !tmpID.includes("fig4") && !tmpID.includes("fig9") && !tmpID.includes("fig13") && !tmpID.includes("fig6") && !tmpID.includes("tab4") && !tmpID.includes("tab2") && !tmpID.includes("tab1")) {
    for (i = 0; i < chartOpts[tmpID].print.data.datasets.length; i++) {
      chartOpts[tmpID].print.data.datasets[i].borderColor = 'black';
    }
  }
  chartOpts[tmpID].print.options.title.fontSize = 40;
  if(tmpID.includes("tab3")) {
    chartOpts[tmpID].print.options.layout.padding = {top: 105, right: 15, bottom: 40, left: 15};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint("Numbers", tmpID);          
    chartOpts[tmpID].print.options.scales.yAxes[0].ticks.fontSize = 20;          
  }
  else if(tmpID.includes("tab4")) {
    chartOpts[tmpID].print.options.layout.padding = {top: 15, right: 0, bottom: 40, left: 0};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint("Tables", tmpID);
  }
  else if(tmpID.includes("tab2c")) {
    chartOpts[tmpID].print.options.layout.padding = {top: 70, right: 0, bottom: 40, left: 0};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint("Tables", tmpID);
  }
  else if(tmpID.includes("tab")) {
    chartOpts[tmpID].print.options.layout.padding = {top: 105, right: 0, bottom: 40, left: 0};
    chartOpts[tmpID].print.options.scales.xAxes[0].ticks.fontSize = setFontSizePrint("Tables", tmpID);
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

  d3.select("#canvasPrint").style("display", "block");

  //***Add metadata
  setTimeout(function() {
    var tmpPrint = chartCanvas[tmpID + "Print"];
    var tmpRect = document.getElementById(tmpID + "Print").getBoundingClientRect();
    if(tmpID.includes("tab")) {
      addInfo(tmpPrint, chartOpts[tmpID].print.cl[0], tmpRect, "print", 1, tmpID);
    }
    var ctx = tmpPrint.canvas.getContext("2d")
    ctx.font = "normal 12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Downloaded " + new Date().toJSON().slice(0,10) + " from N-CLAS     |     N Deposition: Mean Total Deposition (2013-2015)", (tmpRect.width - 15), (tmpRect.height - 15));
    var link = document.getElementById(tmpID + "Print").toDataURL('image/jpeg', 1.0);
    //var link = tmpPrint.toBase64Image();
    d3.select("#dlJPEGLink").attr("href", link);
    d3.select("#" + tmpID + "Print").style("display", "none");
  }, 300);
}  





//******Function to add Table title and info to canvas
function addInfo(tmpPrint, tmpInfo, tmpRect, type, tmpWidth, id) {
  var t = tmpInfo.table;
  var ctx = tmpPrint.canvas.getContext("2d")
  switch(type) {
    case "small":
      var fontSizes = [5, 3];
      var fontY = [3, 14, 20, 26, 32];
      var fontX = [3, 3 + 125, 3 + 225];
      break;
    case "large":
      //var tmpDiv = document.getElementById("canvasChartsLargeDiv");
      //var tmpCan = tmpDiv.getElementsByTagName("canvas")[0];
      //var tmpRect = tmpCan.getBoundingClientRect();
      var tmpRect = document.getElementById("container-results").getBoundingClientRect();

      var fontSizes = [(14 + (14 * (tmpWidth))), (10 + (10 * (tmpWidth)))];
      var fontY = [(7 + (7 * (tmpWidth))), (25 + (25 * (tmpWidth))), (37 + (37 * (tmpWidth))), (49 + (49 * (tmpWidth))), (61 + (61 * (tmpWidth)))];
      var fontX = [(7 + (7 * (tmpWidth))), (7 + (7 * (tmpWidth))) + (tmpRect.width * 0.36), (7 + (7 * (tmpWidth))) + (tmpRect.width * 0.64)];
      break;
    case "print":
      var fontSizes = [29, 23];
      var fontY = [15, 60, 90, 120, 150];
      var fontX = [15, 15 + 650, 15 + 1150];
      break;
  }
  ctx.font = "bold " + fontSizes[0] + "px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(tmpInfo.title, fontX[0], fontY[0]);
  ctx.font = "normal " + fontSizes[1] + "px Arial";
  if(id.includes("tab3") || id.includes("tab2a") || id.includes("tab1a")) {
    ctx.fillText("Area: ", fontX[0], fontY[1]);
    ctx.fillText(tmpInfo.region, fontX[1], fontY[1]);

    ctx.fillText("Site: ", fontX[0], fontY[2]);
    ctx.fillText(tmpInfo.region_name, fontX[1], fontY[2]);

    if(outUnit == "hectares") {
      ctx.fillText("Size (ha): ", fontX[0], fontY[3]);
      ctx.fillText(Math.round(tmpInfo.area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontX[1], fontY[3]);
    }
    else {
      ctx.fillText("Size (ac): ", fontX[0], fontY[3]);
      ctx.fillText(Math.round(tmpInfo.area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontX[1], fontY[3]);
    }

    ctx.fillText("N Deposition (kg/ha/yr): ", fontX[0], fontY[4]);
    ctx.fillText(tmpInfo.min.toFixed(1) + " to " + tmpInfo.max.toFixed(1), fontX[1], fontY[4]);

    if(id.includes("tab3")) {
      switch(type) {
        case "small":
          ctx.drawImage(legImg[t],(tmpRect.width - ((legImg[t].width * 0.2) + 3)),3, (legImg[t].width * 0.2), (legImg[t].height * 0.2));
          break;
        case "large":
          var tmpCan = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();
          var legWidth = tmpRect.width * 0.233;
          var legHeight = (tmpRect.width / 2) * 0.233;
          ctx.drawImage(legImg[t],((tmpRect.width - 20) - (legWidth + 10)),(7 + (7 * (tmpWidth))), legWidth, legHeight);
          break;
        case "print":
          ctx.drawImage(legImg[t],(tmpRect.width - (legImg[t].width + 10)),15);
          break;
      }
    }
  }
  else if(id.includes("tab4a")) {
    ctx.fillText(tmpInfo.subtitle, fontX[0], fontY[1]);
  }
  else if(id.includes("tab2c") || id.includes("tab1c")) {
    ctx.fillText("Area: ", fontX[0], fontY[1]);
    ctx.fillText(tmpInfo.region, fontX[1], fontY[1]);
    ctx.fillText("Species: ", fontX[0], fontY[2]);
    ctx.font = "italic " + fontSizes[1] + "px Arial";
    ctx.fillText(tmpInfo.latin, fontX[1], fontY[2]);
    ctx.font = "normal " + fontSizes[1] + "px Arial";
    ctx.fillText("(" + tmpInfo.common + ")", fontX[2], fontY[2]);

    ctx.fillText("CL for N more sensitive sites (kg/ha/yr):", fontX[0], fontY[3]);
    ctx.fillText("Most protective CL: " + tmpInfo.minCL.toFixed(1), fontX[1], fontY[3]);
    ctx.fillText("CL range: " + tmpInfo.minCL.toFixed(1) + " to " + (tmpInfo.minCL + tmpInfo.range).toFixed(1), fontX[2], fontY[3]);

    ctx.fillText("CL for N less sensitive sites (kg/ha/yr):", fontX[0], fontY[4]);
    ctx.fillText("Most protective CL: " + tmpInfo.maxCL.toFixed(1), fontX[1], fontY[4]);
    ctx.fillText("CL range: " + tmpInfo.maxCL.toFixed(1) + " to " + (tmpInfo.maxCL + tmpInfo.range).toFixed(1), fontX[2], fontY[4]);
  }
}





//******Function to set link to csv file containing data used to make graph/table
function setDataDL(tmpID, tmpVals, tmpLabels) {
  var tmpCSV = "";
  if(tmpID.includes("tab")) {
    tmpCSV = chartOpts[tmpID].small.cl[0].title + "\n";
    if(tmpID.includes("tab4")) {
      tmpCSV += chartOpts[tmpID].small.cl[0].subtitle + "\n";
    }
    else if(tmpID.includes("tab1a") || tmpID.includes("tab2a") || tmpID.includes("tab3b") || tmpID.includes("tab3c")) {
      tmpCSV += "Area:," + chartOpts[tmpID].small.cl[0].region + "\n";
      tmpCSV += "Site:," + chartOpts[tmpID].small.cl[0].region_name + "\n";
      if(outUnit == "hectares") {
        tmpCSV += "Size (ha):," + chartOpts[tmpID].small.cl[0].area_ha + "\n";
      }
      else {
        tmpCSV += "Size (ac):," + chartOpts[tmpID].small.cl[0].area_acres + "\n";
      }
      tmpCSV += "N Deposition (kg/ha/yr):," + chartOpts[tmpID].small.cl[0].min.toFixed(1) + " to " + chartOpts[tmpID].small.cl[0].max.toFixed(1) + "\n";
    }
    else if(tmpID.includes("tab1c") || tmpID.includes("tab2c")) {
      tmpCSV += "Area:," + chartOpts[tmpID].small.cl[0].region + "\n";
      tmpCSV += "Species:," + chartOpts[tmpID].small.cl[0].latin + "," + chartOpts[tmpID].small.cl[0].common + "\n";
      tmpCSV += "CL for N more sensitive sites (kg/ha/yr):," + "Most protective CL: " + chartOpts[tmpID].small.cl[0].minCL.toFixed(1) + "," + "CL Range: " + chartOpts[tmpID].small.cl[0].minCL.toFixed(1) + " to " + (chartOpts[tmpID].small.cl[0].minCL + chartOpts[tmpID].small.cl[0].range).toFixed(1) + "\n";
      tmpCSV += "CL for N less sensitive sites (kg/ha/yr):," + "Most protective CL: " + chartOpts[tmpID].small.cl[0].maxCL.toFixed(1) + "," + "CL Range: " + chartOpts[tmpID].small.cl[0].maxCL.toFixed(1) + " to " + (chartOpts[tmpID].small.cl[0].maxCL + chartOpts[tmpID].small.cl[0].range).toFixed(1) + "\n";
    }

    if(tmpID.includes("tab3")) {
      tmpCSV += ",";
    }

    tmpLabels.forEach(function(lab) {
      if (Array.isArray(lab)) {
        tmpCSV += lab.join(" ") + ",";
      }
      else {
        tmpCSV += lab + ",";
      }
    });
    tmpCSV = tmpCSV.slice(0,-1) + "\n";

    var cols = chartOpts[tmpID].small.data.datasets.length;
    var rows = chartOpts[tmpID].small.data.datasets[0].data.length;

    for(var i=0; i<rows; i++) {
      if(tmpID.includes("tab3")) {
        tmpCSV += chartOpts[tmpID].small.data.yLabels[i] + ",";
      }
      for(var j=0; j<cols; j ++) {
        tmpCSV += tmpVals[i][j].toString().replace(/,/g, '') + ",";
      };
      tmpCSV = tmpCSV.slice(0,-1) + "\n";
    };
  }
  else if(tmpID.includes("fig")) {
    tmpCSV = chartOpts[tmpID].small.options.title.text + "\n";
    tmpCSV += chartOpts[tmpID].small.options.scales.xAxes[1].scaleLabel.labelString + "\n";

    if(!tmpID.includes("fig6")) {
      tmpLabels.forEach(function(lab) {
        tmpCSV += lab + ",";
      });
      tmpCSV = tmpCSV.slice(0,-1) + "\n";

      var tmpX = chartOpts[tmpID].small.data.labels;
      var tmpPrev = [];
      for(var i = 0; i < chartOpts[tmpID].small.data.datasets.length; i++) {
        tmpPrev.push(0);
      }

      for(var i = 0; i < tmpX.length; i++) {
        tmpCSV += tmpX[i] + ",";
        chartOpts[tmpID].small.data.datasets.forEach(function(set, a) {
          if(set.data[i]) {
            tmpCSV += set.data[i] + ",";
            tmpPrev[a] = set.data[i];
          }
          else {
            if(tmpID.includes("fig9") || tmpID.includes("fig13")) {
              tmpCSV += tmpPrev[a] + ",";
            }
            else {
              tmpCSV += "0,";
            }
          }
        });
        tmpCSV = tmpCSV.slice(0,-1) + "\n";
      }
    }
    else {  //***For fig6a & fig6c
      tmpLabels.forEach(function(lab) {
        tmpCSV += lab + ",,";
      });
      tmpCSV = tmpCSV.slice(0,-1) + "\n";
      tmpLabels.forEach(function(lab) {
        tmpCSV += "N Deposition (kg/ha/yr),Cumulative % Area,";
      });
      tmpCSV = tmpCSV.slice(0,-1) + "\n";

      for(var i = 0; i < 6; i++) {
        chartOpts[tmpID].small.data.datasets.forEach(function(set, a) {
          if(set.data.length >= (i + 1)) {
            tmpCSV += set.data[i].x + "," + set.data[i].y + ",";
          }
          else {
            tmpCSV += ",,";
          }
        });
        tmpCSV = tmpCSV.slice(0,-1) + "\n";
      }
    }
  }

  d3.select("#dlJPEGDataLink").attr("href", "data:attachment/csv," +   encodeURIComponent(tmpCSV));
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
    case "Level II Ecoregions":
      var tmpSize = 30;
      break;
    case "Level III Ecoregions":
      var tmpSize = 16;
      //var tmpSize = 20;
      break;
    case "Forest Service Wilderness Areas":
      var tmpSize = 6.5;
      break;
    case "Forest Service Admin Areas":
      var tmpSize = 17;
      break;
    case "Class I Areas":
      var tmpSize = 20;
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
    case "Tables":
      var tmpSize = 22;
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
    case "Level II Ecoregions":
      var tmpSize = 12;
      break;
    case "Level III Ecoregions":
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
    case "Tables":
      var tmpSize = 10;
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
    case "Level II Ecoregions":
      var tmpSize = 7;
      break;
    case "Level III Ecoregions":
      var tmpSize = 2;
      break;
    case "Forest Service Wilderness Areas":
      var tmpSize = 1;
      break;
    case "Forest Service Admin Areas":
      var tmpSize = 2;
      break;
    case "Class I Areas":
      var tmpSize = 2;
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
    case "Tables":
      var tmpSize = 3;
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
console.log(tmpData);
  //******Figure 15A
  d3.select("#resRegFigExAreaCanvas-1")
    .append("div")    .attr("class", "canvasChartSmall")
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
      tmpAreas[i] = formatLabel(areaShortName[d],12);
    }
  });

  
  chartOpts.fig15a = {};
  
  //***Small graph
  chartOpts.fig15a.small = JSON.parse(JSON.stringify(chartOpts.default.bar));

  chartOpts.fig15a.small.data.labels = tmpAreas;
  chartOpts.fig15a.small.data.datasets[0].data = tmpPercent;
  chartOpts.fig15a.small.options.onClick = function(evt, tmpArray) {
    viewFig("fig15a"); 
    setDataDL("fig15a", 0, [d3.select("#areaList").attr("value"), chartOpts.fig15a.small.options.scales.yAxes[0].scaleLabel.labelString]);
    d3.selectAll(".canvasChart").classed("selected", false);
    d3.select("#fig15a").classed("selected", true);
  };
  //chartOpts.fig15a.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15a.small.options.title.text = "Exceedance of the Critical Load";
  chartOpts.fig15a.small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
  chartOpts.fig15a.small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall(d3.select("#areaList").attr("value"), "fig15a");
  chartOpts.fig15a.small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";

  //***Large graph
  chartOpts.fig15a.large = JSON.parse(JSON.stringify(chartOpts.fig15a.small));
  chartOpts.fig15a.print = JSON.parse(JSON.stringify(chartOpts.fig15a.small));
  chartOpts.fig15a.print.options.animation = {"duration": 0};


  var fig15a_ctx = document.getElementById("fig15a").getContext('2d');
  chartCanvas["fig15aSmall"] = new Chart(fig15a_ctx, chartOpts.fig15a.small);
}




function fig15b(tmpData) {
  //******Figure 15B
  d3.select("#resRegFigExAreaCanvas-1")
    .append("div")    .attr("class", "canvasChartSmall")
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
      tmpAreas[i] = formatLabel(areaShortName[d],12);
    }
  });

  //***Check to see if hectares has been selected as preferred unit
  var tmpAreaLabel = "Acres";
  if($("input[name=outUnit]:checked").length > 0) {
    if(document.querySelector('input[name=outUnit]:checked').value == "hectares") {
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
  chartOpts.fig15b.small.options.onClick = function(evt, tmpArray) { 
    viewFig("fig15b");
    setDataDL("fig15b", 0, [d3.select("#areaList").attr("value"), chartOpts.fig15b.small.options.scales.yAxes[0].scaleLabel.labelString]);
    d3.selectAll(".canvasChart").classed("selected", false);
    d3.select("#fig15b").classed("selected", true);
  };
  //chartOpts.fig15b.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15b.small.options.title.text = "Exceedance of the Critical Load";
  chartOpts.fig15b.small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
  chartOpts.fig15b.small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall(d3.select("#areaList").attr("value"), "fig15b");
  chartOpts.fig15b.small.options.scales.xAxes[1].scaleLabel.labelString = d3.select("#areaList").attr("value") + ", Combined Species";

  //***Large graph
  chartOpts.fig15b.large = JSON.parse(JSON.stringify(chartOpts.fig15b.small));
  chartOpts.fig15b.print = JSON.parse(JSON.stringify(chartOpts.fig15b.small));
  chartOpts.fig15b.print.options.animation = {"duration": 0};

  var fig15b_ctx = document.getElementById("fig15b").getContext('2d');
  chartCanvas["fig15bSmall"] = new Chart(fig15b_ctx, chartOpts.fig15b.small);
}



function fig15bi(tmpData) {
  //******Figure 15BI
  d3.select("#resRegFigExAreaCanvas-1")
    .append("div")    .attr("class", "canvasChartSmall")
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
      excAreas[i] = formatLabel(areaShortName[d],12);
    }
  });

  //***Check to see if hectares has been selected as preferred unit
  var tmpAreaLabel = "Acres";
  if($("input[name=outUnit]:checked").length > 0) {
    if(document.querySelector('input[name=outUnit]:checked').value == "hectares") {
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
  chartOpts.fig15bi.small.options.onClick = function(evt, tmpArray) { 
    viewFig("fig15bi");
    setDataDL("fig15bi", 0, [d3.select("#areaList").attr("value"), tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel, tmpAreaLabel + " not in Exceedance of CL " + tmpDivideLabel]);
    d3.selectAll(".canvasChart").classed("selected", false);
    d3.select("#fig15bi").classed("selected", true);
  };
  //chartOpts.fig15bi.small.options.title.text = "Exceedance of Most Protective Critical Load";
  chartOpts.fig15bi.small.options.title.text = "Exceedance of the Critical Load";
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
  chartOpts.fig15bi.print.options.animation = {"duration": 0};

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
    var tmpSpp = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });


    d3.select("#resRegFigExAreaCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig2a-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig2a-" + i] = {};
    //***Small graph
    chartOpts["fig2a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig2a-" + i].small.data.labels = tmpSpp;
    chartOpts["fig2a-" + i].small.data.datasets[0].data = tmpPercent;
    chartOpts["fig2a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig2a-" + i);
      setDataDL("fig2a-" + i, 0, ["Species", chartOpts["fig2a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig2a-" + i).classed("selected", true);
    };
    //chartOpts["fig2a-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2a-" + i].small.options.title.text = "Exceedance of the Critical Load";
    chartOpts["fig2a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% Area in Exceedance of CL";
    if(outSpecies == "latin") {
      chartOpts["fig2a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'italic';
    }
    else {
      chartOpts["fig2a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'normal';
    }
    chartOpts["fig2a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig2a");
    chartOpts["fig2a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig2a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig2a-" + i].small));
    chartOpts["fig2a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig2a-" + i].small));
    //chartOpts["fig2a-" + i].print.data.labels = tmpSppWhole[i];
    chartOpts["fig2a-" + i].print.options.animation = {"duration": 0};

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
    var tmpSpp = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });

    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outUnit]:checked").length > 0) {
      if(document.querySelector('input[name=outUnit]:checked').value == "hectares") {
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

    d3.select("#resRegFigExAreaCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig2b-' + i + '" class="canvasChart" value="Species">');

    chartOpts["fig2b-" + i] = {};
    //***Small graph
    chartOpts["fig2b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig2b-" + i].small.data.labels = tmpSpp;
    chartOpts["fig2b-" + i].small.data.datasets[0].data = tmpAcres;
    chartOpts["fig2b-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig2b-" + i);
      setDataDL("fig2b-" + i, 0, ["Species", chartOpts["fig2b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig2b-" + i).classed("selected", true);
    };
    //chartOpts["fig2b-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2b-" + i].small.options.title.text = "Exceedance of the Critical Load";
    chartOpts["fig2b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
    if(outSpecies == "latin") {
      chartOpts["fig2b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'italic';
    }
    else {
      chartOpts["fig2b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'normal';
    }
    chartOpts["fig2b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig2b");
    chartOpts["fig2b-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig2b-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig2b-" + i].small));
    chartOpts["fig2b-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig2b-" + i].small));
    //chartOpts["fig2b-" + i].print.data.labels = tmpSppWhole[i];
    chartOpts["fig2b-" + i].print.options.animation = {"duration": 0};

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
    var excSpp = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });

    excNo.filter.region_name.filterAll();
    excNo.filter.region_name.filterFunction(function(d) { return d == reg; });

    filtData = excNo.filter.count.top(Infinity);
    var excNoAcres = [];
    excSpp.forEach(function(spp,j) {
      for(obj in filtData) {
        if(filtData[obj].species == spp || speciesJSON[filtData[obj].species] == spp) {
         excNoAcres[j] = filtData[obj].count * 0.2223945;
        } 
      }
    });


    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outUnit]:checked").length > 0) {
      if(document.querySelector('input[name=outUnit]:checked').value == "hectares") {
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

    d3.select("#resRegFigExAreaCanvas" + i)
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
    chartOpts["fig2bi-" + i].small.options.onClick = function(evt, tmpArray) { 
      viewFig("fig2bi-" + i);
      setDataDL("fig2bi-" + i, 0, ["Species", tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel, tmpAreaLabel + " not in Exceedance of CL " + tmpDivideLabel]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig2bi-" + i).classed("selected", true);
    };
    //chartOpts["fig2bi-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig2bi-" + i].small.options.title.text = "Exceedance of the Critical Load";
    chartOpts["fig2bi-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " in Exceedance of CL " + tmpDivideLabel;
    chartOpts["fig2bi-" + i].small.options.scales.yAxes[0].stacked = true;
    if(outSpecies == "latin") {
      chartOpts["fig2bi-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'italic';
    }
    else {
      chartOpts["fig2bi-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'normal';
    }
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
    chartOpts["fig2bi-" + i].print.options.animation = {"duration": 0};

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


    d3.select("#resRegFigExMagCanvas" + i)
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
    chartOpts["fig11a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig11a-" + i);
      setDataDL("fig11a-" + i, 0, [chartOpts["fig11a-" + i].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig11a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig11a-" + i).classed("selected", true);
    };
    //chartOpts["fig11a-" + i].small.options.title.text = "Level of Exceedance of Most Protective Critical Load";
    chartOpts["fig11a-" + i].small.options.title.text = "Level of Exceedance of the Critical Load";
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
    chartOpts["fig11a-" + i].print.options.animation = {"duration": 0};

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

    //***Add initial zeros
    tmpPercent.splice(0,0,0);
    tmpExc.splice(0,0,0);

    var maxLength = 0;
    tmpPercent.forEach(function(val,j) {
      if(val > 0 && j > maxLength) {
        maxLength = j;
      }
    });


    d3.select("#resRegFigExMagCanvas" + i)
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
    chartOpts["fig12a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig12a-" + i); 
      setDataDL("fig12a-" + i, 0, [chartOpts["fig12a-" + i].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig12a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig12a-" + i).classed("selected", true);
    };
    //chartOpts["fig12a-" + i].small.options.title.text = "Level of Exceedance of Most Protective Critical Load";
    chartOpts["fig12a-" + i].small.options.title.text = "Level of Exceedance of the Critical Load";
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
    chartOpts["fig12a-" + i].print.options.animation = {"duration": 0};

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

      //***Add initial zeros
      tmpPercent[j].splice(0,0,0);
      tmpExc[j].splice(0,0,0);

      //***Find greatest non-zero length
      tmpPercent[j].forEach(function(val,k) {
        if(val > 0 && k > maxLength) {
          maxLength = k;
          tmpIndex = j;
        }
      });

      exc.filter.cl_category.filterAll();
    });

    d3.select("#resRegFigExMagCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig12b-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig12b-" + i] = {};
    //***Small graph
    chartOpts["fig12b-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig12b-" + i].small.type = 'line';
    chartOpts["fig12b-" + i].small.data.labels = tmpExc[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    //var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    var legendParts = [["CL","Most","most"],["TL-MID","Most","least"],["TL-HIGH","Least","least"],["TL-LOW","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig12b-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",0.5)",
        borderColor: tmpColor + ",1)",
        data: tmpPercent[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        label: "EXC of " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig12b-" + i].small.options.legend.display = true;
    chartOpts["fig12b-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig12b-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig12b-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig12b-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig12b-" + i);
      var tmpLegend = chartOpts["fig12b-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig12b-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig12b-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig12b-" + i).classed("selected", true);
    };
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
    chartOpts["fig12b-" + i].print.options.animation = {"duration": 0};

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


    d3.select("#resRegFigExMagCanvas" + i)
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
      chartOpts["fig3a-" + i + k].small.options.onClick = function(evt, tmpArray) {
        viewFig("fig3a-" + i + k);
        setDataDL("fig3a-" + i + k, 0, [chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig3a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString]);
        d3.selectAll(".canvasChart").classed("selected", false);
        d3.select("#fig3a-" + i + k).classed("selected", true);
      };
      //chartOpts["fig3a-" + i + k].small.options.title.text = "Exceedance of Most Protective Critical Load";
      chartOpts["fig3a-" + i + k].small.options.title.text = "Exceedance of the Critical Load";
      chartOpts["fig3a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area with Level of Exceedance";
      //chartOpts["fig3a-" + i + k].small.options.scales.yAxes[0].ticks.max = 100;
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig3a");
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 1, tmpPercent.length);
      chartOpts["fig3a-" + i + k].small.options.scales.xAxes[0].scaleLabel = {
        display: true,
        labelString: "Level of Exceedance of CL (kg/ha/yr)",
        fontSize: 8
      }

      if(outSpecies == "latin") {
        chartOpts["fig3a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + species;
      }
      else {
        chartOpts["fig3a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + speciesJSON[species];
      }

      //***Large graph
      chartOpts["fig3a-" + i + k].large = JSON.parse(JSON.stringify(chartOpts["fig3a-" + i + k].small));
      chartOpts["fig3a-" + i + k].print = JSON.parse(JSON.stringify(chartOpts["fig3a-" + i + k].small));
      chartOpts["fig3a-" + i + k].print.options.animation = {"duration": 0};

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


    d3.select("#resRegFigExMagCanvas" + i)
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
      chartOpts["fig4a-" + i + k].small.options.onClick = function(evt, tmpArray) {
        viewFig("fig4a-" + i + k);
        setDataDL("fig4a-" + i + k, 0, [chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig4a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString]);
        d3.selectAll(".canvasChart").classed("selected", false);
        d3.select("#fig4a-" + i + k).classed("selected", true);
      };
      //chartOpts["fig4a-" + i + k].small.options.title.text = "Exceedance of Most Protective Critical Load";
      chartOpts["fig4a-" + i + k].small.options.title.text = "Exceedance of the Critical Load";
      chartOpts["fig4a-" + i + k].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area with Level of Exceedance";
      //chartOpts["fig4a-" + i + k].small.options.scales.yAxes[0].ticks.max = 100;
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig4a");
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].ticks.max = Math.min(maxLength + 1, tmpPercent.length);
      chartOpts["fig4a-" + i + k].small.options.scales.xAxes[0].scaleLabel = {
        display: true,
        labelString: "Level of Exceedance of CL (kg/ha/yr)",
        fontSize: 8
      }

      if(outSpecies == "latin") {
        chartOpts["fig4a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + species;
      }
      else {
        chartOpts["fig4a-" + i + k].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", " + speciesJSON[species];
      }

      //***Large graph
      chartOpts["fig4a-" + i + k].large = JSON.parse(JSON.stringify(chartOpts["fig4a-" + i + k].small));
      chartOpts["fig4a-" + i + k].large.data.datasets[0].borderWidth = 5;
      chartOpts["fig4a-" + i + k].print = JSON.parse(JSON.stringify(chartOpts["fig4a-" + i + k].large));
      chartOpts["fig4a-" + i + k].print.options.animation = {"duration": 0};

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
    var tmpZeros = [];
    var maxLength = 0;
    var tmpIndex = 0;
    tmpSpecies.forEach(function(species,k) {
      exc.filter.species.filterAll();
      exc.filter.species.filterFunction(function(d) { return d == species; });

      var filtData = exc.filter.exc.bottom(Infinity);
      tmpPercent[k] = filtData.map(function(d,i) { return d.percentage; });
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
    
    d3.select("#resRegFigExMagCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig4c-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig4c-" + i] = {};
    //***Small graph
    chartOpts["fig4c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig4c-" + i].small.type = 'line';
    chartOpts["fig4c-" + i].small.data.datasets = [];
    tmpSpecies.forEach(function(species,j) {
      //if(Math.max(...tmpPercent[j]) > 0) {
      if(outSpecies == "latin") { var tmpSpeciesName = species;} else {var tmpSpeciesName = speciesJSON[species];}
      chartOpts["fig4c-" + i].small.data.datasets.push({
        backgroundColor: "rgba(" + sppColors[species] + ",0.4)",
        borderColor: "rgba(" + sppColors[species] + ",1)",
        data: tmpPercent[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        label: tmpSpeciesName
      })
      //}      
    });
    chartOpts["fig4c-" + i].small.data.labels = tmpExc[tmpIndex];
    chartOpts["fig4c-" + i].small.options.legend.display = true;
    chartOpts["fig4c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig4c-" + i].small.options.legend.labels.fontSize = 4;
    if(outSpecies == "latin") {
      chartOpts["fig4c-" + i].small.options.legend.labels.fontStyle = 'italic';
    }
    else {
      chartOpts["fig4c-" + i].small.options.legend.labels.fontStyle = 'normal';
    }
    chartOpts["fig4c-" + i].small.options.legend.labels.boxWidth = 4;
    chartOpts["fig4c-" + i].small.options.legend.labels.padding = 3;
    chartOpts["fig4c-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig4c-" + i);
      var tmpLegend = chartOpts["fig4c-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig4c-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig4c-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig4c-" + i).classed("selected", true);
    };
    //chartOpts["fig4c-" + i].small.options.title.text = "Exceedance of Most Protective Critical Load";
    chartOpts["fig4c-" + i].small.options.title.text = "Exceedance of the Critical Load";
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
    chartOpts["fig4c-" + i].print.options.animation = {"duration": 0};

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
    var tmpSpp = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });


    d3.select("#resRegFigCLCanvas" + i)
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
    chartOpts["fig1a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig1a-" + i);
      setDataDL("fig1a-" + i, 0, ["Species", chartOpts["fig1a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig1a-" + i).classed("selected", true);
    };
    chartOpts["fig1a-" + i].small.options.title.text = "Percent Area More Sensitive to N Deposition Based on Site Conditions";
    chartOpts["fig1a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "% of Area";
    if(outSpecies == "latin") {
      chartOpts["fig1a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'italic';
    }
    else {
      chartOpts["fig1a-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'normal';
    }
    chartOpts["fig1a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Species", "fig1a");
    chartOpts["fig1a-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";

    //***Large graph
    chartOpts["fig1a-" + i].large = JSON.parse(JSON.stringify(chartOpts["fig1a-" + i].small));
    chartOpts["fig1a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig1a-" + i].small));
    //chartOpts["fig1a-" + i].print.data.labels = tmpSppWhole[i];
    chartOpts["fig1a-" + i].print.options.animation = {"duration": 0};

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
    var tmpSpp = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });


    //***Check to see if hectares has been selected as preferred unit
    var tmpAreaLabel = "Acres";
    if($("input[name=outUnit]:checked").length > 0) {
      if(document.querySelector('input[name=outUnit]:checked').value == "hectares") {
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

    d3.select("#resRegFigCLCanvas" + i)
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
    chartOpts["fig1b-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig1b-" + i);
      var tmpLegend = chartOpts["fig1b-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.forEach(function(leg, a) { tmpLegend[a] = chartOpts["fig1b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString + " " + leg; });
      tmpLegend.splice(0,0,"Species");
      setDataDL("fig1b-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig1b-" + i).classed("selected", true);
    };
    chartOpts["fig1b-" + i].small.options.title.text = "Sensitivity of Area to N Deposition Based on Site Conditions";
    chartOpts["fig1b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = tmpAreaLabel + " " + tmpDivideLabel;
    chartOpts["fig1b-" + i].small.options.scales.yAxes[0].stacked = true;
    if(outSpecies == "latin") {
      chartOpts["fig1b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'italic';
    }
    else {
      chartOpts["fig1b-" + i].small.options.scales.xAxes[0].ticks.fontStyle = 'normal';
    }
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
    chartOpts["fig1b-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigCLCanvas" + i)
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
    chartOpts["fig9a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig9a-" + i);
      setDataDL("fig9a-" + i, 0, [chartOpts["fig9a-" + i].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig9a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig9a-" + i).classed("selected", true);
    };
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
    chartOpts["fig9a-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigCLCanvas" + i)
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
    chartOpts["fig9b-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig9b-" + i);
      var tmpLegend = chartOpts["fig9b-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig9b-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig9b-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig9b-" + i).classed("selected", true);
    };
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
    chartOpts["fig9b-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigExcCanvas" + i)
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
    chartOpts["fig13e-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13e-" + i);
      setDataDL("fig13e-" + i, 0, [chartOpts["fig13e-" + i].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig13e-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13e-" + i).classed("selected", true);
    };
    chartOpts["fig13e-" + i].small.options.title.text = "Area in Exceedance of CL at Each N Deposition Level";
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
    chartOpts["fig13e-" + i].print.options.animation = {"duration": 0};

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



    d3.select("#resRegFigExcCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13h-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13h-" + i] = {};
    //***Small graph
    chartOpts["fig13h-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13h-" + i].small.type = 'line';
    chartOpts["fig13h-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(204,153,0']
    //var legendParts = [["A","Most","most"],["D","Least","most"]];
    var legendParts = [["CL","Most","most"],["TL-LOW","Least","most"]];
    tmpColors.forEach(function(tmpColor,j) {
      chartOpts["fig13h-" + i].small.data.datasets[j] = {
        backgroundColor: tmpColor + ",0.5)",
        borderColor: tmpColor + ",1)",
        data: tmpPercentCumFull[j],
        pointRadius: 0,
        pointHitRadius: 20,
        lineTension: 0,
        spanGaps: true,
        label: "EXC of " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });
    chartOpts["fig13h-" + i].small.data.datasets[0].fill = false;
    chartOpts["fig13h-" + i].small.data.datasets[1].fill = 0;

    chartOpts["fig13h-" + i].small.options.legend.display = true;
    chartOpts["fig13h-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13h-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13h-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13h-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13h-" + i);
      var tmpLegend = chartOpts["fig13h-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig13h-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig13h-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13h-" + i).classed("selected", true);
    };
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
    chartOpts["fig13h-" + i].print.options.animation = {"duration": 0};

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



    d3.select("#resRegFigExcCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13g-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13g-" + i] = {};
    //***Small graph
    chartOpts["fig13g-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13g-" + i].small.type = 'line';
    chartOpts["fig13g-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    //var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    var legendParts = [["CL","Most","most"],["TL-MID","Most","least"],["TL-HIGH","Least","least"],["TL-LOW","Least","most"]];
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
        label: "EXC of " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig13g-" + i].small.options.legend.display = true;
    chartOpts["fig13g-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13g-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13g-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13g-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13g-" + i);
      var tmpLegend = chartOpts["fig13g-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig13g-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig13g-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13g-" + i).classed("selected", true);
    };
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
    chartOpts["fig13g-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigExcCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig6c-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig6c-" + i] = {};
    //***Small graph
    chartOpts["fig6c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["fig6c-" + i].small.type = 'line';

    tmpSpecies.forEach(function(spp,j) {
      if(outSpecies == "latin") { var tmpSpeciesName = spp;} else {var tmpSpeciesName = speciesJSON[spp];}
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
        label: tmpSpeciesName
      }
    });

    chartOpts["fig6c-" + i].small.options.legend.display = true;
    chartOpts["fig6c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig6c-" + i].small.options.legend.labels.fontSize = 3;
    chartOpts["fig6c-" + i].small.options.legend.labels.boxWidth = 3;
    chartOpts["fig6c-" + i].small.options.legend.labels.padding = 3;
    if(outSpecies == "latin") {
      chartOpts["fig6c-" + i].small.options.legend.labels.fontStyle = 'italic';
    }
    else {
      chartOpts["fig6c-" + i].small.options.legend.labels.fontStyle = 'normal';
    }
    chartOpts["fig6c-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig6c-" + i);
      var tmpLegend = chartOpts["fig6c-" + i].small.data.datasets.map(function(d) { return d.label; });
      //tmpLegend.splice(0,0,chartOpts["fig6c-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig6c-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig6c-" + i).classed("selected", true);
    };
    chartOpts["fig6c-" + i].small.options.title.text = "% Area in Exceedance of CL at Each N Deposition Level";
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area in Exceedance of CL";
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig6c-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].type = 'linear';
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig6c");
    chartOpts["fig6c-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
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
    chartOpts["fig6c-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  
    //***Print graph
    chartOpts["fig6c-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig6c-" + i].large));
    chartOpts["fig6c-" + i].print.options.legend.labels.boxWidth = 20;
    chartOpts["fig6c-" + i].print.options.legend.labels.padding = 20;
    chartOpts["fig6c-" + i].print.options.legend.labels.fontSize = 20;
    chartOpts["fig6c-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6c-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig6c-" + i].print.options.animation = {"duration": 0};

    var fig6c_ctx = document.getElementById("fig6c-" + i).getContext('2d');
    chartCanvas["fig6c-" + i + "Small"] = new Chart(fig6c_ctx, chartOpts["fig6c-" + i].small);
  });
}






function fig13f(tmpData) {
  //***Figure 13F
  //var tmpRegions = topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].features.map(function(d) { return d.id; });;
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


  d3.select("#resRegFigExcCanvas-1")
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
      label: areaShortName[reg]
    }
  });

  chartOpts["fig13f"].small.options.legend.display = true;
  chartOpts["fig13f"].small.options.legend.position = 'bottom';
  chartOpts["fig13f"].small.options.legend.labels.fontSize = 3;
  chartOpts["fig13f"].small.options.legend.labels.boxWidth = 3;
  chartOpts["fig13f"].small.options.legend.labels.padding = 3;
  chartOpts["fig13f"].small.options.onClick = function(evt, tmpArray) {
    viewFig("fig13f");
    var tmpLegend = chartOpts["fig13f"].small.data.datasets.map(function(d) { return d.label; });
    tmpLegend.splice(0,0,chartOpts["fig13f"].small.options.scales.xAxes[0].scaleLabel.labelString);
    setDataDL("fig13f", 0, tmpLegend);
    d3.selectAll(".canvasChart").classed("selected", false);
    d3.select("#fig13f").classed("selected", true);
  };
  chartOpts["fig13f"].small.options.title.text = "% Area in Exceedance of CL at Each N Deposition Level";
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
  chartOpts["fig13f"].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigProCanvas" + i)
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
    chartOpts["fig13a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13a-" + i);
      setDataDL("fig13a-" + i, 0, [chartOpts["fig13a-" + i].small.options.scales.xAxes[0].scaleLabel.labelString, chartOpts["fig13a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString]);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13a-" + i).classed("selected", true);
    };
    chartOpts["fig13a-" + i].small.options.title.text = "Area Protected at CL at Each N Deposition Level";
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
    chartOpts["fig13a-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigProCanvas" + i)
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
    chartOpts["fig13d-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13d-" + i);
      var tmpLegend = chartOpts["fig13d-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig13d-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig13d-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13d-" + i).classed("selected", true);
    };
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
    chartOpts["fig13d-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigProCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig13c-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig13c-" + i] = {};
    //***Small graph
    chartOpts["fig13c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));

    chartOpts["fig13c-" + i].small.type = 'line';
    chartOpts["fig13c-" + i].small.data.labels = tmpCLCum[0];

    var tmpColors = ['rgba(255,102,0', 'rgba(255,0,0', 'rgba(204,0,0', 'rgba(204,153,0']
    //var legendParts = [["A","Most","most"],["B","Most","least"],["C","Least","least"],["D","Least","most"]];
    var legendParts = [["CL","Most","most"],["TL-MID","Most","least"],["TL-HIGH","Least","least"],["TL-LOW","Least","most"]];
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
        label: "EXC of " + legendParts[j][0] + ": " + legendParts[j][1] + " protective of " + legendParts[j][2] + " sensitive species"
      }
    });

    chartOpts["fig13c-" + i].small.options.legend.display = true;
    chartOpts["fig13c-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig13c-" + i].small.options.legend.labels.fontSize = 5;
    chartOpts["fig13c-" + i].small.options.legend.labels.boxWidth = 5;
    chartOpts["fig13c-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig13c-" + i);
      var tmpLegend = chartOpts["fig13c-" + i].small.data.datasets.map(function(d) { return d.label; });
      tmpLegend.splice(0,0,chartOpts["fig13c-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig13c-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig13c-" + i).classed("selected", true);
    };
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
    chartOpts["fig13c-" + i].print.options.animation = {"duration": 0};

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

    d3.select("#resRegFigProCanvas" + i)
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="fig6a-' + i + '" class="canvasChart" value="Numbers">');

    chartOpts["fig6a-" + i] = {};
    //***Small graph
    chartOpts["fig6a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["fig6a-" + i].small.type = 'line';

    tmpSpecies.forEach(function(spp,j) {
      if(outSpecies == "latin") { var tmpSpeciesName = spp;} else {var tmpSpeciesName = speciesJSON[spp];}
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
        label: tmpSpeciesName
      }
    });

    chartOpts["fig6a-" + i].small.options.legend.display = true;
    chartOpts["fig6a-" + i].small.options.legend.position = 'bottom';
    chartOpts["fig6a-" + i].small.options.legend.labels.fontSize = 3;
    chartOpts["fig6a-" + i].small.options.legend.labels.boxWidth = 3;
    chartOpts["fig6a-" + i].small.options.legend.labels.padding = 3;
    if(outSpecies == "latin") {
      chartOpts["fig6a-" + i].small.options.legend.labels.fontStyle = 'italic';
    }
    else {
      chartOpts["fig6a-" + i].small.options.legend.labels.fontStyle = 'normal';
    }
    chartOpts["fig6a-" + i].small.options.onClick = function(evt, tmpArray) {
      viewFig("fig6a-" + i);
      var tmpLegend = chartOpts["fig6a-" + i].small.data.datasets.map(function(d) { return d.label; });
      //tmpLegend.splice(0,0,chartOpts["fig6a-" + i].small.options.scales.xAxes[0].scaleLabel.labelString);
      setDataDL("fig6a-" + i, 0, tmpLegend);
      d3.selectAll(".canvasChart").classed("selected", false);
      d3.select("#fig6a-" + i).classed("selected", true);
    };
    chartOpts["fig6a-" + i].small.options.title.text = "Area Protected at CL at Each N Deposition Level";
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Cumulative % Area Protected";
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].ticks.max = 102;
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].ticks.stepSize = 20;
    chartOpts["fig6a-" + i].small.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].type = 'linear';
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Numbers", "fig6a");
    chartOpts["fig6a-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
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
    chartOpts["fig6a-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
  
    //***Print graph
    chartOpts["fig6a-" + i].print = JSON.parse(JSON.stringify(chartOpts["fig6a-" + i].large));
    chartOpts["fig6a-" + i].print.options.legend.labels.boxWidth = 20;
    chartOpts["fig6a-" + i].print.options.legend.labels.padding = 20;
    chartOpts["fig6a-" + i].print.options.legend.labels.fontSize = 20;
    chartOpts["fig6a-" + i].print.options.scales.yAxes[0].afterBuildTicks = function(options) { options.ticks = options.ticks.filter(function(val) { return parseInt(val) <= 100; }); return; };
    chartOpts["fig6a-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { if(value % 2 == 0) {return value;} else {return "";} };
    chartOpts["fig6a-" + i].print.options.animation = {"duration": 0};

    var fig6a_ctx = document.getElementById("fig6a-" + i).getContext('2d');
    chartCanvas["fig6a-" + i + "Small"] = new Chart(fig6a_ctx, chartOpts["fig6a-" + i].small);
  });
}







function fig13b(tmpData) {
  //***Figure 13B
  //var tmpRegions = topos[areaID[areaTitles.indexOf(d3.select("#areaList").attr("value"))]].features.map(function(d) { return d.id; });;
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


  d3.select("#resRegFigProCanvas-1")
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
      label: areaShortName[reg]
    }
  });

  chartOpts["fig13b"].small.options.legend.display = true;
  chartOpts["fig13b"].small.options.legend.position = 'bottom';
  chartOpts["fig13b"].small.options.legend.labels.fontSize = 3;
  chartOpts["fig13b"].small.options.legend.labels.boxWidth = 3;
  chartOpts["fig13b"].small.options.legend.labels.padding = 3;
  chartOpts["fig13b"].small.options.onClick = function(evt, tmpArray) {
    viewFig("fig13b");
    var tmpLegend = chartOpts["fig13b"].small.data.datasets.map(function(d) { return d.label; });
    tmpLegend.splice(0,0,chartOpts["fig13b"].small.options.scales.xAxes[0].scaleLabel.labelString);
    setDataDL("fig13b", 0, tmpLegend);
    d3.selectAll(".canvasChart").classed("selected", false);
    d3.select("#fig13b").classed("selected", true);
  };
  chartOpts["fig13b"].small.options.title.text = "Area Protected at CL at Each N Deposition Level";
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
  chartOpts["fig13b"].print.options.animation = {"duration": 0};

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
    var tmpSpecies = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });
    var tmpPercent = filtData.map(function(d) { return [d.lo_percent, 100]; });
    var tmpCL = filtData.map(function(d) { return [d.min, d.max]; });
    var minCL = Math.min(...filtData.map(function(d) { return d.min; }));
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));

    if(tmpSpecies.length > 0) {
      regData[0].minCL = minCL;
      regData[0].maxCL = maxCL;
      regData[0].title = "% Area in Exceedance of CL at Each N Deposition Level";
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
    
      d3.select("#resRegTabResponseCanvas" + i)
        .append("div")
        .attr("class", "canvasChartSmall")
        .html('<canvas id="tab3b-' + i + '" class="canvasChart" value="Tables">');

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

          if(this.data.datasets.length > 1) {
            var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
          }

          this.data.datasets.forEach(function (dataset, i) {
            if(i > 0) {
              var meta = chartInstance.controller.getDatasetMeta(i);
              meta.data.forEach(function (bar, index) {
                var data = dataset.data[index];
                if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                  ctx.fillText((Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + 1) + "%", bar._model.x - binWidth, bar._model.y);
                }
                else {
                  ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
                }
              });
            }
          });
        }
      }
      chartOpts["tab3b-" + i].small.options.animation.duration = 0;
      chartOpts["tab3b-" + i].small.options.events = ["click"];
      chartOpts["tab3b-" + i].small.options.onClick = function(evt, tmpArray) {
        chartCanvas["tab3b-" + i + "Small"].clear();
        chartCanvas["tab3b-" + i + "Small"].render();
        viewFig("tab3b-" + i); 
        setDataDL("tab3b-" + i, tmpCLFull, tmpXLabels);
        d3.selectAll(".canvasChart").classed("selected", false); 
        d3.select("#tab3b-" + i).classed("selected", true);
        setTimeout(function() {
          addInfo(chartCanvas["tab3b-" + i + "Small"], chartOpts["tab3b-" + i].small.cl[0], document.getElementById("tab3b-" + i).getBoundingClientRect(), "small", 1, "tab3b-" + i);
        }, 30);
      };
      //chartOpts["tab3b-" + i].small.options.title.text = "% Area in Exceedance of CL at Each N Deposition Level";
      chartOpts["tab3b-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Species";
      chartOpts["tab3b-" + i].small.options.scales.yAxes[0].ticks.fontSize = 4;
      if(outSpecies == "latin") {
        chartOpts["tab3b-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "italic";
      }
      else {
        chartOpts["tab3b-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "normal";
      }
      chartOpts["tab3b-" + i].small.options.scales.yAxes[0].stacked = true;
      chartOpts["tab3b-" + i].small.options.scales.yAxes[0].barPercentage = 1;
      chartOpts["tab3b-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].position = 'top';
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.min = 0;
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.max = maxCL - 1;
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].type = 'category';
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab3b");
      chartOpts["tab3b-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
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
      //chartOpts["tab3b-" + i].large.options.onResize = function(inst, newSize) { console.log(newSize); addInfo(chartCanvas["tab3b-" + i + "Large"], chartOpts["tab3b-" + i].large.cl[0], newSize, "large", 0.75, "tab3b-" + i); },
      chartOpts["tab3b-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
      chartOpts["tab3b-" + i].large.options.events = false;
      chartOpts["tab3b-" + i].large.options.animation.onComplete = function () {
        var tmpRect = document.getElementById("tab3b-" + i + "Large").getBoundingClientRect();
        var initSize = (12 + ((19 - maxCL)/2)) / 2;
        var modSize = (tmpRect.width - 730)/(1380 - 730);
        var finalSize = initSize + (initSize * modSize);

        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = finalSize + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if(this.data.datasets.length > 1) {
          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
        }

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 0) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
              if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                ctx.fillText((Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + 1) + "%", bar._model.x - binWidth, bar._model.y);
              }
              else {
                ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
              }
            });
          }
        });
      }

  
      //***Print graph
      chartOpts["tab3b-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab3b-" + i].large));
      //chartOpts["tab3b-" + i].print.options.layout.padding.top = 20;
      chartOpts["tab3b-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
      chartOpts["tab3b-" + i].print.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = (18 + ((19 - maxCL)/2)) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if(this.data.datasets.length > 1) {
          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
        }

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 0) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
                if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                  ctx.fillText((Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + 1) + "%", bar._model.x - binWidth, bar._model.y);
                }
                else {
                  ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
                }
            });
          }
        });
      }

      var tab3b_ctx = document.getElementById("tab3b-" + i).getContext('2d');
      chartCanvas["tab3b-" + i + "Small"] = new Chart(tab3b_ctx, chartOpts["tab3b-" + i].small);

      //***Disable animation in small table so header and legend can be added
      //chartOpts["tab3b-" + i].small.options.animation = false;
    }
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
    var tmpSpecies = filtData.map(function(d) { if(outSpecies == "latin") {return d.species;} else {return speciesJSON[d.species];} });
    var tmpPercent = filtData.map(function(d) { return [100 - d.lo_percent, 0]; });
    var tmpCL = filtData.map(function(d) { return [d.min, d.max]; });
    var minCL = Math.min(...filtData.map(function(d) { return d.min; }));
    var maxCL = Math.max(...filtData.map(function(d) { return d.max; }));

    if(tmpSpecies.length > 0) {
      regData[0].minCL = minCL;
      regData[0].maxCL = maxCL;
      regData[0].title = "% Area Protected by CL at Each N Deposition Level";
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

      d3.select("#resRegTabResponseCanvas" + i)
        .append("div")
        .attr("class", "canvasChartSmall")
        //.html('<canvas id="tab3c-' + i + '" class="canvasChart" value="' + d3.select("#areaList").attr("value") + '">');
        .html('<canvas id="tab3c-' + i + '" class="canvasChart" value="Tables">');

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

          if(this.data.datasets.length > 1) {
            var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
          }

          this.data.datasets.forEach(function (dataset, i) {
            if(i > 0) {
              var meta = chartInstance.controller.getDatasetMeta(i);
              meta.data.forEach(function (bar, index) {
                //var data = dataset.data[index];                            
                if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                  ctx.fillText(Math.floor(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
                }
                else {
                  ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
                }
              });
            }
          });
        }
      }
      chartOpts["tab3c-" + i].small.options.animation.duration = 0;
      chartOpts["tab3c-" + i].small.options.events = ["click"];
      chartOpts["tab3c-" + i].small.options.onClick = function(evt, tmpArray) {
        chartCanvas["tab3c-" + i + "Small"].clear();
        chartCanvas["tab3c-" + i + "Small"].render();
        viewFig("tab3c-" + i); 
        setDataDL("tab3c-" + i, tmpCLFull, tmpXLabels);
        d3.selectAll(".canvasChart").classed("selected", false); 
        d3.select("#tab3c-" + i).classed("selected", true);
        setTimeout(function() {
          addInfo(chartCanvas["tab3c-" + i + "Small"], chartOpts["tab3c-" + i].small.cl[0], document.getElementById("tab3c-" + i).getBoundingClientRect(), "small", 1, "tab3c-" + i);
        }, 30);
      };
      //chartOpts["tab3c-" + i].small.options.title.text = "% Area in Exceedance of CL at Each N Deposition Level";
      chartOpts["tab3c-" + i].small.options.scales.yAxes[0].scaleLabel.labelString = "Species";
      chartOpts["tab3c-" + i].small.options.scales.yAxes[0].ticks.fontSize = 4;
      if(outSpecies == "latin") {
        chartOpts["tab3c-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "italic";
      }
      else {
        chartOpts["tab3c-" + i].small.options.scales.yAxes[0].ticks.fontStyle = "normal";
      }
      chartOpts["tab3c-" + i].small.options.scales.yAxes[0].stacked = true;
      chartOpts["tab3c-" + i].small.options.scales.yAxes[0].barPercentage = 1;
      //chartOpts["tab3c-" + i].small.options.scales.yAxes[0].gridLines.color = 'rgba(0,0,0,1)';
      chartOpts["tab3c-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].position = 'top';
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.min = 0;
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.max = maxCL - 1;
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].type = 'category';
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab3c");
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].gridLines.color = 'rgba(0,0,0,1)';
      chartOpts["tab3c-" + i].small.options.scales.xAxes[0].scaleLabel = {
        display: true,
        labelString: "N Deposition (kg/ha/yr)",
        fontSize: 8
      }
      //chartOpts["tab3c-" + i].small.options.scales.xAxes[1].scaleLabel.labelString = reg + ", Individual Species";
      chartOpts["tab3c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = false;

  
      //***Large graph
      chartOpts["tab3c-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab3c-" + i].small));
      //chartOpts["tab3c-" + i].large.options.onResize = function(inst, newSize) { console.log(newSize); addInfo(chartCanvas["tab3c-" + i + "Large"], chartOpts["tab3c-" + i].large.cl[0], newSize, "large", 0.75, "tab3c-" + i); },
      chartOpts["tab3c-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
      chartOpts["tab3c-" + i].large.options.events = false;
      chartOpts["tab3c-" + i].large.options.animation.onComplete = function () {
        var tmpRect = document.getElementById("tab3c-" + i + "Large").getBoundingClientRect();
        var initSize = (12 + ((19 - maxCL)/2)) / 2;
        var modSize = (tmpRect.width - 730)/(1380 - 730);
        var finalSize = initSize + (initSize * modSize);

        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = finalSize + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if(this.data.datasets.length > 1) {
          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
        }

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 0) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
              if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                ctx.fillText(Math.floor(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
              }
              else {
                ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
              }
            });
          }
        });
      }

      //***Print graph
      chartOpts["tab3c-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab3c-" + i].large));
      //chartOpts["tab3c-" + i].print.options.layout.padding.top = 20;
      chartOpts["tab3c-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return value + 1; };
      chartOpts["tab3c-" + i].print.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = (18 + ((19 - maxCL)/2)) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if(this.data.datasets.length > 1) {
          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2
        }

        this.data.datasets.forEach(function (dataset, i) {
          if(i > 0) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];                            
              if(tmpCLFull[bar._index][bar._datasetIndex] % 1 > 0) {
                ctx.fillText(Math.floor(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
              }
              else {
                ctx.fillText(Math.round(tmpCLFull[bar._index][bar._datasetIndex]) + "%", bar._model.x - binWidth, bar._model.y);
              }
            });
          }
        });
      }

      var tab3c_ctx = document.getElementById("tab3c-" + i).getContext('2d');
      chartCanvas["tab3c-" + i + "Small"] = new Chart(tab3c_ctx, chartOpts["tab3c-" + i].small);

      //***Disable animation in small table so header and legend can be added
      //chartOpts["tab3c-" + i].small.options.animation = false;
    }
  });
}





function tab2c(tmpData) {
  //***Table 2c
  //console.log(tmpData);

  var tmpCF = crossfilter(tmpData[0]);
  var cl = {filter:{}};
  
  cl.keys = d3.keys(tmpData[0][0]);
  cl.vals = d3.values(tmpData[0][0]);

  cl.keys.forEach(function(key, i) {
    cl.filter[key] = tmpCF.dimension(function(d) { if(isNaN(cl.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[1]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[1][0]);
  exc.vals = d3.values(tmpData[1][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[2]);
  var ndep = {filter:{}};
  
  ndep.keys = d3.keys(tmpData[2][0]);
  ndep.vals = d3.values(tmpData[2][0]);

  ndep.keys.forEach(function(key, i) {
    ndep.filter[key] = tmpCF.dimension(function(d) { if(isNaN(ndep.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[3]);
  var area = {filter:{}};
  
  area.keys = d3.keys(tmpData[3][0]);
  area.vals = d3.values(tmpData[3][0]);

  area.keys.forEach(function(key, i) {
    area.filter[key] = tmpCF.dimension(function(d) { if(isNaN(area.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[4]);
  var range = {filter:{}};
  
  range.keys = d3.keys(tmpData[4][0]);
  range.vals = d3.values(tmpData[4][0]);

  range.keys.forEach(function(key, i) {
    range.filter[key] = tmpCF.dimension(function(d) { if(isNaN(range.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpSpp = range.filter.species.bottom(Infinity);
  var tmpSpecies = tmpSpp.map(function(d) { return d.species; });

  tmpSpecies.forEach(function(spp,i) {
    cl.filter.species.filterAll();
    cl.filter.species.filterFunction(function(d) { return d == spp; });
    exc.filter.species.filterAll();
    exc.filter.species.filterFunction(function(d) { return d == spp; });
    area.filter.species.filterAll();
    area.filter.species.filterFunction(function(d) { return d == spp; });
    range.filter.species.filterAll();
    range.filter.species.filterFunction(function(d) { return d == spp; });

    var clData = cl.filter.region_name.bottom(Infinity);
    var excData = exc.filter.region_name.bottom(Infinity);
    var ndepData = ndep.filter.region_name.bottom(Infinity);
    var areaData = area.filter.region_name.bottom(Infinity);
    var rangeData = range.filter.species.bottom(Infinity);

    var tmpNdep = clData.map(function(d) { return d.region_name; });

    regData = [{}];
    regData[0].region = ndepData[0].region;
    regData[0].minCL = rangeData[0].min;
    regData[0].maxCL = rangeData[0].max;
    regData[0].range = rangeData[0].range;
    regData[0].latin = spp;
    regData[0].common = speciesJSON[spp];
    if(outSpecies == "latin") {
      regData[0].title = "Exceedance for " + spp + " in " + ndepData[0].region;
    }
    else {
      regData[0].title = "Exceedance for " + speciesJSON[spp] + " in " + ndepData[0].region;
    }


    var tmpVals = [];
    var tmpValsNums = [0,1,2,3,4,5,6];
    if(outUnit == "hectares") {
      var tmpXLabels = ["Region Name", ["Region Area", "(ha)"], ["N Deposition", "(kg/ha/yr)"], ["Species Area", "(ha)"], ["Species Area with", "N Deposition Data", "(ha)"], ["Area in Exceedance", "of Most Protective", "CL (ha)"], ["% Exceedance of", "Most Protective CL"]];
    }
    else {
      var tmpXLabels = ["Region Name", ["Region Area", "(ac)"], ["N Deposition", "(kg/ha/yr)"], ["Species Area", "(ac)"], ["Species Area with", "N Deposition Data", "(ac)"], ["Area in Exceedance", "of Most Protective", "CL (ac)"], ["% Exceedance of", "Most Protective CL"]];
    }

    tmpNdep.forEach(function(reg,k) {
      var tmpBi = 0;
      ndepData.some(function(d,j) {
        if(d.region_name == reg) {
          tmpBi = j;
        }
        return tmpBi > 0;
      });

      tmpVals.push([]);
      tmpVals[k][0] = formatLabel(areaShortName[reg], tmpLength);
      tmpVals[k][2] = ndepData[tmpBi].min.toFixed(1) + " - " + ndepData[tmpBi].max.toFixed(1);
      if(outUnit == "hectares") {
        tmpVals[k][1] = Math.round(ndepData[tmpBi].shape_area_m2 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][3] = Math.round(clData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][4] = Math.round(areaData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][5] = Math.round(excData[k].count * 900 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      else {
        tmpVals[k][1] = Math.round(ndepData[tmpBi].shape_area_m2 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][3] = Math.round(clData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][4] = Math.round(areaData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][5] = Math.round(excData[k].count * 900 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      tmpVals[k][6] = parseFloat(excData[k].percentage).toFixed(1) + "%";
    });

    //***Invert data for horizontal bar graph
    var tmpValsInvert = [];
    var tmpValsMod = [];
    for(var j = 0; j < tmpVals[0].length; j++) {
      tmpValsInvert.push([]);
      tmpValsMod.push([]);
      for(var k = 0; k < tmpNdep.length; k++) {
        tmpValsInvert[j].push(tmpVals[k][j]);
        tmpValsMod[j].push(j);
      }
    }
    
    d3.select("#resRegTabCurrentCanvas-1")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="tab2c-' + i + '" class="canvasChart" value="Tables">');

    d3.select("#tab2c-" + i).property("title", spp + " Exceedance in " + ndepData[0].region);

    chartOpts["tab2c-" + i] = {};
    //***Small graph
    chartOpts["tab2c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["tab2c-" + i].small.cl = regData;
    chartOpts["tab2c-" + i].small.type = 'horizontalBar';
    chartOpts["tab2c-" + i].small.data.yLabels = tmpNdep;
    chartOpts["tab2c-" + i].small.data.xLabels = tmpValsNums;

    tmpValsNums.forEach(function(stepVal,j) {
      chartOpts["tab2c-" + i].small.data.datasets[j] = {
        backgroundColor: 'rgba(0,0,0,0)',
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 1,
        data: tmpValsMod[j],
        label: ""
      }
    });

    chartOpts["tab2c-" + i].small.options.tooltips = {"enabled": false};
    chartOpts["tab2c-" + i].small.options.animation = {
      duration: 1,
      hover: {"animationDuration": 0},
      onComplete: function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = "3px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            //var data = dataset.data[index];
            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 2;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (3 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }
    }
    chartOpts["tab2c-" + i].small.options.animation.duration = 0;
    chartOpts["tab2c-" + i].small.options.events = ["click"];
    chartOpts["tab2c-" + i].small.options.onClick = function(evt, tmpArray) {
      chartCanvas["tab2c-" + i + "Small"].clear();
      chartCanvas["tab2c-" + i + "Small"].render();
      viewFig("tab2c-" + i); 
      setDataDL("tab2c-" + i, tmpVals, tmpXLabels);
      d3.selectAll(".canvasChart").classed("selected", false); 
      d3.select("#tab2c-" + i).classed("selected", true);
      setTimeout(function() {
        addInfo(chartCanvas["tab2c-" + i + "Small"], chartOpts["tab2c-" + i].small.cl[0], document.getElementById("tab2c-" + i).getBoundingClientRect(), "small", 1, "tab2c-" + i);
      }, 30);
    };

    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].barPercentage = 1;
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].ticks.display = false;
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].gridLines.drawTicks = false;
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].zeroLineColor = "rgba(0,0,0,0)";
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].scaleLabel.display = false;
    chartOpts["tab2c-" + i].small.options.scales.yAxes[1] = {position: 'right', display: true, ticks:{display:false}, scaleLabel:{display:false}, gridLines:{display:false, color: "rgba(0,0,0,0.3)"}, zeroLineColor: 'rgba(0,0,0,0)'};
    chartOpts["tab2c-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].position = 'top';
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].type = 'category';
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab2c");
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].gridLines.tickMarkLength = 10;
    chartOpts["tab2c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["tab2c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = true;
    chartOpts["tab2c-" + i].small.options.scales.xAxes[1].gridLines.color = "rgba(0,0,0,0.3)";
    chartOpts["tab2c-" + i].small.options.scales.xAxes[1].position = 'bottom';
    chartOpts["tab2c-" + i].small.options.scales.xAxes[1].scaleLabel.display = false;
    chartOpts["tab2c-" + i].small.options.layout.padding.top = 10;

  
    //***Large graph
    chartOpts["tab2c-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab2c-" + i].small));
    chartOpts["tab2c-" + i].large.options.scales.xAxes[0].gridLines.tickMarkLength = 55;
    chartOpts["tab2c-" + i].large.options.events = false;
    chartOpts["tab2c-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab2c-" + i].large.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      var chartDim = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          if(bar._datasetIndex == 0) {
            ctx.font = (7 + (7 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
          }
          else {
            ctx.font = (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
          }

          if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
            if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
              var tmpX = bar._model.x + binWidth;
              var tmpY = bar._model.y - 7;
              tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                ctx.fillText(tmpLine, tmpX, tmpY + (14 * z));
              });
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        });
      });
    }

  
    //***Print graph
    chartOpts["tab2c-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab2c-" + i].large));
    chartOpts["tab2c-" + i].print.options.scales.xAxes[0].gridLines.tickMarkLength = 70;
    chartOpts["tab2c-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab2c-" + i].print.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = "17px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          //var data = dataset.data[index];                            
          if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
            if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
              var tmpX = bar._model.x + binWidth;
              var tmpY = bar._model.y - 9;
              tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                ctx.fillText(tmpLine, tmpX, tmpY + (18 * z));
              });
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        });
      });
    }

    var tab2c_ctx = document.getElementById("tab2c-" + i).getContext('2d');
    chartCanvas["tab2c-" + i + "Small"] = new Chart(tab2c_ctx, chartOpts["tab2c-" + i].small);

    //***Disable animation in small table so header and legend can be added
    //chartOpts["tab2c-" + i].small.options.animation = false;
  });
}





function tab2a(tmpData) {
  //***Table 2a

  var tmpCF = crossfilter(tmpData[0]);
  var cl = {filter:{}};
  
  cl.keys = d3.keys(tmpData[0][0]);
  cl.vals = d3.values(tmpData[0][0]);

  cl.keys.forEach(function(key, i) {
    cl.filter[key] = tmpCF.dimension(function(d) { if(isNaN(cl.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[1]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[1][0]);
  exc.vals = d3.values(tmpData[1][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[2]);
  var ndep = {filter:{}};
  
  ndep.keys = d3.keys(tmpData[2][0]);
  ndep.vals = d3.values(tmpData[2][0]);

  ndep.keys.forEach(function(key, i) {
    ndep.filter[key] = tmpCF.dimension(function(d) { if(isNaN(ndep.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[3]);
  var area = {filter:{}};
  
  area.keys = d3.keys(tmpData[3][0]);
  area.vals = d3.values(tmpData[3][0]);

  area.keys.forEach(function(key, i) {
    area.filter[key] = tmpCF.dimension(function(d) { if(isNaN(area.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[4]);
  var range = {filter:{}};
  
  range.keys = d3.keys(tmpData[4][0]);
  range.vals = d3.values(tmpData[4][0]);

  range.keys.forEach(function(key, i) {
    range.filter[key] = tmpCF.dimension(function(d) { if(isNaN(range.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpReg = ndep.filter.region_name.bottom(Infinity);
  var tmpRegions = tmpReg.map(function(d) { return d.region_name; });

  tmpRegions.forEach(function(reg,i) {
    cl.filter.region_name.filterAll();
    cl.filter.region_name.filterFunction(function(d) { return d == reg; });
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    ndep.filter.region_name.filterAll();
    ndep.filter.region_name.filterFunction(function(d) { return d == reg; });
    area.filter.region_name.filterAll();
    area.filter.region_name.filterFunction(function(d) { return d == reg; });

    var clData = cl.filter.species.bottom(Infinity);
    var excData = exc.filter.species.bottom(Infinity);
    var ndepData = ndep.filter.region_name.bottom(Infinity);
    var areaData = area.filter.species.bottom(Infinity);
    var rangeData = range.filter.species.bottom(Infinity);

    var tmpSpp = clData.map(function(d) { return d.species; });

    if(tmpSpp.length > 0) {
      regData = [{}];
      regData[0].region = ndepData[0].region;
      regData[0].region_name = reg;
      regData[0].min = ndepData[0].min;
      regData[0].max = ndepData[0].max;
      regData[0].area_ha = Math.round(ndepData[0].shape_area_m2 * 0.0001);
      regData[0].area_acres = Math.round(ndepData[0].shape_area_m2 * 0.000247105);
      regData[0].title = "Exceedance for species in " + reg;

      var tmpVals = [];
      var tmpValsNums = [0,1,2,3,4];
      if(outUnit == "hectares") {
        var tmpXLabels = ["Species", "Species Area (ha)", ["Species Area with N", "Deposition Data (ha)"], ["Area in Exceedance of", "Most Protective CL (ha)"], ["% Exceedance of", "Most Protective CL"]];
      }
      else {
        var tmpXLabels = ["Species", "Species Area (ac)", ["Species Area with N", "Deposition Data (ac)"], ["Area in Exceedance of", "Most Protective CL (ac)"], ["% Exceedance of", "Most Protective CL"]];
      }

      tmpSpp.forEach(function(spp,k) {
        tmpVals.push([]);
        if(outSpecies == "latin") {  
          tmpVals[k][0] = formatLabel(spp, 27);
        }
        else {
          tmpVals[k][0] = formatLabel(speciesJSON[spp], 27);
        }
        if(outUnit == "hectares") {
          tmpVals[k][1] = Math.round(clData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][2] = Math.round(areaData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][3] = Math.round(excData[k].count * 900 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        else {
          tmpVals[k][1] = Math.round(clData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][2] = Math.round(areaData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][3] = Math.round(excData[k].count * 900 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        tmpVals[k][4] = parseFloat(excData[k].percentage).toFixed(1) + "%";
      });

      //***Invert data for horizontal bar graph
      var tmpValsInvert = [];
      var tmpValsMod = [];
      for(var j = 0; j < tmpVals[0].length; j++) {
        tmpValsInvert.push([]);
        tmpValsMod.push([]);
        for(var k = 0; k < tmpSpp.length; k++) {
          tmpValsInvert[j].push(tmpVals[k][j]);
          tmpValsMod[j].push(j);
        }
      }
    
      d3.select("#resRegTabCurrentCanvas" + i)
        .append("div")
        .attr("class", "canvasChartSmall")
        .html('<canvas id="tab2a-' + i + '" class="canvasChart" value="Tables">');

      d3.select("#tab2a-" + i).property("title", reg + " Exceedance by species");

      chartOpts["tab2a-" + i] = {};
      //***Small graph
      chartOpts["tab2a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
      chartOpts["tab2a-" + i].small.cl = regData;
      chartOpts["tab2a-" + i].small.type = 'horizontalBar';
      chartOpts["tab2a-" + i].small.data.yLabels = tmpSpp;
      chartOpts["tab2a-" + i].small.data.xLabels = tmpValsNums;

      tmpValsNums.forEach(function(stepVal,j) {
        chartOpts["tab2a-" + i].small.data.datasets[j] = {
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 1,
          data: tmpValsMod[j],
          label: ""
        }
      });

      chartOpts["tab2a-" + i].small.options.tooltips = {"enabled": false};
      chartOpts["tab2a-" + i].small.options.animation = {
        duration: 1,
        hover: {"animationDuration": 0},
        onComplete: function () {
          var chartInstance = this.chart;
          var ctx = chartInstance.ctx;
          ctx.font = "3px Arial";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

          this.data.datasets.forEach(function (dataset, i) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              if(bar._datasetIndex == 0 && outSpecies == "latin") {
                ctx.font = "italic 3px Arial";
              }
              else {
                ctx.font = "normal 3px Arial";
              }
              //var data = dataset.data[index];
              if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
                if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                  var tmpX = bar._model.x + binWidth;
                  var tmpY = bar._model.y - 2;
                  tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                    ctx.fillText(tmpLine, tmpX, tmpY + (3 * z));
                  });
                }
                else {
                  ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
                }
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            });
          });
        }
      }
      chartOpts["tab2a-" + i].small.options.animation.duration = 0;
      chartOpts["tab2a-" + i].small.options.events = ["click"];
      chartOpts["tab2a-" + i].small.options.onClick = function(evt, tmpArray) {
        chartCanvas["tab2a-" + i + "Small"].clear();
        chartCanvas["tab2a-" + i + "Small"].render();
        viewFig("tab2a-" + i); 
        setDataDL("tab2a-" + i, tmpVals, tmpXLabels);
        d3.selectAll(".canvasChart").classed("selected", false); 
        d3.select("#tab2a-" + i).classed("selected", true);
        setTimeout(function() {
          addInfo(chartCanvas["tab2a-" + i + "Small"], chartOpts["tab2a-" + i].small.cl[0], document.getElementById("tab2a-" + i).getBoundingClientRect(), "small", 1, "tab2a-" + i);
        }, 30);
      };

      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].stacked = true;
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].barPercentage = 1;
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].ticks.display = false;
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].gridLines.drawTicks = false;
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].zeroLineColor = "rgba(0,0,0,0)";
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].scaleLabel.display = false;
      chartOpts["tab2a-" + i].small.options.scales.yAxes[1] = {position: 'right', display: true, ticks:{display:false}, scaleLabel:{display:false}, gridLines:{display:false, color: "rgba(0,0,0,0.3)"}, zeroLineColor: 'rgba(0,0,0,0)'};
      chartOpts["tab2a-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].position = 'top';
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].type = 'category';
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab2a");
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].ticks.fontWeigth = "bold";
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].gridLines.tickMarkLength = 7;
      chartOpts["tab2a-" + i].small.options.scales.xAxes[0].gridLines.display = true;
      chartOpts["tab2a-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = true;
      chartOpts["tab2a-" + i].small.options.scales.xAxes[1].gridLines.color = "rgba(0,0,0,0.3)";
      chartOpts["tab2a-" + i].small.options.scales.xAxes[1].position = 'bottom';
      chartOpts["tab2a-" + i].small.options.scales.xAxes[1].scaleLabel.display = false;
      chartOpts["tab2a-" + i].small.options.layout.padding.top = 20;

  
      //***Large graph
      chartOpts["tab2a-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab2a-" + i].small));
      chartOpts["tab2a-" + i].large.options.scales.xAxes[0].gridLines.tickMarkLength = 30;
      chartOpts["tab2a-" + i].large.options.events = false;
      chartOpts["tab2a-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab2a-" + i].large.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        var chartDim = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();

        //ctx.font = (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            if(bar._datasetIndex == 0 && outSpecies == "latin") {
              ctx.font = "italic " + (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
            }
            else {
              ctx.font = "normal " + (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
            }
            //var data = dataset.data[index];
            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 7;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (14 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }

  
      //***Print graph
      chartOpts["tab2a-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab2a-" + i].large));
      chartOpts["tab2a-" + i].print.options.scales.xAxes[0].gridLines.tickMarkLength = 37;
      chartOpts["tab2a-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab2a-" + i].print.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = "17px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            if(bar._datasetIndex == 0 && outSpecies == "latin") {
              ctx.font = "italic 17px Arial";
            }
            else {
              ctx.font = "normal 17px Arial";
            }
            //var data = dataset.data[index];                            
            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 9;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (18 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }

      var tab2a_ctx = document.getElementById("tab2a-" + i).getContext('2d');
      chartCanvas["tab2a-" + i + "Small"] = new Chart(tab2a_ctx, chartOpts["tab2a-" + i].small);

      //***Disable animation in small table so header and legend can be added
      //chartOpts["tab2a-" + i].small.options.animation = false;
    } 
  });
}







function tab1c(tmpData) {
  //***Table 1c
  //console.log(tmpData);

  var tmpCF = crossfilter(tmpData[0]);
  var cl = {filter:{}};
  
  cl.keys = d3.keys(tmpData[0][0]);
  cl.vals = d3.values(tmpData[0][0]);

  cl.keys.forEach(function(key, i) {
    cl.filter[key] = tmpCF.dimension(function(d) { if(isNaN(cl.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[1]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[1][0]);
  exc.vals = d3.values(tmpData[1][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[2]);
  var ndep = {filter:{}};
  
  ndep.keys = d3.keys(tmpData[2][0]);
  ndep.vals = d3.values(tmpData[2][0]);

  ndep.keys.forEach(function(key, i) {
    ndep.filter[key] = tmpCF.dimension(function(d) { if(isNaN(ndep.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[3]);
  var area = {filter:{}};
  
  area.keys = d3.keys(tmpData[3][0]);
  area.vals = d3.values(tmpData[3][0]);

  area.keys.forEach(function(key, i) {
    area.filter[key] = tmpCF.dimension(function(d) { if(isNaN(area.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[4]);
  var range = {filter:{}};
  
  range.keys = d3.keys(tmpData[4][0]);
  range.vals = d3.values(tmpData[4][0]);

  range.keys.forEach(function(key, i) {
    range.filter[key] = tmpCF.dimension(function(d) { if(isNaN(range.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpSpp = range.filter.species.bottom(Infinity);
  var tmpSpecies = tmpSpp.map(function(d) { return d.species; });

  tmpSpecies.forEach(function(spp,i) {
    cl.filter.species.filterAll();
    cl.filter.species.filterFunction(function(d) { return d == spp; });
    exc.filter.species.filterAll();
    exc.filter.species.filterFunction(function(d) { return d == spp; });
    area.filter.species.filterAll();
    area.filter.species.filterFunction(function(d) { return d == spp; });
    range.filter.species.filterAll();
    range.filter.species.filterFunction(function(d) { return d == spp; });

    var clData = cl.filter.region_name.bottom(Infinity);
    var excData = exc.filter.region_name.bottom(Infinity);
    var ndepData = ndep.filter.region_name.bottom(Infinity);
    var areaData = area.filter.region_name.bottom(Infinity);
    var rangeData = range.filter.species.bottom(Infinity);

    var tmpNdep = clData.map(function(d) { return d.region_name; });

    regData = [{}];
    regData[0].region = ndepData[0].region;
    regData[0].minCL = rangeData[0].min;
    regData[0].maxCL = rangeData[0].max;
    regData[0].range = rangeData[0].range;
    regData[0].latin = spp;
    regData[0].common = speciesJSON[spp];
    if(outSpecies == "latin") {
      regData[0].title = "Critical Loads for " + spp + " in " + ndepData[0].region;
    }
    else {
      regData[0].title = "Critical Loads for " + speciesJSON[spp] + " in " + ndepData[0].region;
    }


    var tmpVals = [];
    var tmpValsNums = [0,1,2,3,4,5];
    if(outUnit == "hectares") {
      var tmpXLabels = ["Region Name", ["Region Area", "(ha)"], ["N Deposition", "(kg/ha/yr)"], ["Species Area", "(ha)"], ["Area N More", "Sensitive (ha)"], ["% Area N", "More Sensitive"]];
    }
    else {
      var tmpXLabels = ["Region Name", ["Region Area", "(ac)"], ["N Deposition", "(kg/ha/yr)"], ["Species Area", "(ac)"], ["Area N More", "Sensitive (ac)"], ["% Area N", "More Sensitive"]];
    }

    tmpNdep.forEach(function(reg,k) {
      var tmpBi = 0;
      ndepData.some(function(d,j) {
        if(d.region_name == reg) {
          tmpBi = j;
        }
        return tmpBi > 0;
      });

      tmpVals.push([]);
      tmpVals[k][0] = formatLabel(areaShortName[reg], tmpLength);
      tmpVals[k][2] = ndepData[tmpBi].min.toFixed(1) + " - " + ndepData[tmpBi].max.toFixed(1);
      if(outUnit == "hectares") {
        tmpVals[k][1] = Math.round(ndepData[tmpBi].shape_area_m2 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][3] = Math.round(clData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][4] = Math.round(clData[k].lo_count * 900 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      else {
        tmpVals[k][1] = Math.round(ndepData[tmpBi].shape_area_m2 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][3] = Math.round(clData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        tmpVals[k][4] = Math.round(clData[k].lo_count * 900 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      tmpVals[k][5] = parseFloat(clData[k].lo_percent).toFixed(1) + "%";
    });

    //***Invert data for horizontal bar graph
    var tmpValsInvert = [];
    var tmpValsMod = [];
    for(var j = 0; j < tmpVals[0].length; j++) {
      tmpValsInvert.push([]);
      tmpValsMod.push([]);
      for(var k = 0; k < tmpNdep.length; k++) {
        tmpValsInvert[j].push(tmpVals[k][j]);
        tmpValsMod[j].push(j);
      }
    }
    
    d3.select("#resRegTabCurrentCanvas-1")
      .append("div")
      .attr("class", "canvasChartSmall")
      .html('<canvas id="tab1c-' + i + '" class="canvasChart" value="Tables">');

    d3.select("#tab1c-" + i).property("title", spp + " Critical Loads in " + ndepData[0].region);

    chartOpts["tab1c-" + i] = {};
    //***Small graph
    chartOpts["tab1c-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
    chartOpts["tab1c-" + i].small.cl = regData;
    chartOpts["tab1c-" + i].small.type = 'horizontalBar';
    chartOpts["tab1c-" + i].small.data.yLabels = tmpNdep;
    chartOpts["tab1c-" + i].small.data.xLabels = tmpValsNums;

    tmpValsNums.forEach(function(stepVal,j) {
      chartOpts["tab1c-" + i].small.data.datasets[j] = {
        backgroundColor: 'rgba(0,0,0,0)',
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 1,
        data: tmpValsMod[j],
        label: ""
      }
    });

    chartOpts["tab1c-" + i].small.options.tooltips = {"enabled": false};
    chartOpts["tab1c-" + i].small.options.animation = {
      duration: 1,
      hover: {"animationDuration": 0},
      onComplete: function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = "3px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            //var data = dataset.data[index];
            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 2;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (3 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }
    }
    chartOpts["tab1c-" + i].small.options.animation.duration = 0;
    chartOpts["tab1c-" + i].small.options.events = ["click"];
    chartOpts["tab1c-" + i].small.options.onClick = function(evt, tmpArray) {
      chartCanvas["tab1c-" + i + "Small"].clear();
      chartCanvas["tab1c-" + i + "Small"].render();
      viewFig("tab1c-" + i); 
      setDataDL("tab1c-" + i, tmpVals, tmpXLabels);
      d3.selectAll(".canvasChart").classed("selected", false); 
      d3.select("#tab1c-" + i).classed("selected", true);
      setTimeout(function() {
        addInfo(chartCanvas["tab1c-" + i + "Small"], chartOpts["tab1c-" + i].small.cl[0], document.getElementById("tab1c-" + i).getBoundingClientRect(), "small", 1, "tab1c-" + i);
      }, 30);
    };

    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].stacked = true;
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].barPercentage = 1;
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].ticks.display = false;
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].gridLines.drawTicks = false;
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].zeroLineColor = "rgba(0,0,0,0)";
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].scaleLabel.display = false;
    chartOpts["tab1c-" + i].small.options.scales.yAxes[1] = {position: 'right', display: true, ticks:{display:false}, scaleLabel:{display:false}, gridLines:{display:false, color: "rgba(0,0,0,0.3)"}, zeroLineColor: 'rgba(0,0,0,0)'};
    chartOpts["tab1c-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].position = 'top';
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].type = 'category';
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab1c");
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].gridLines.tickMarkLength = 7;
    chartOpts["tab1c-" + i].small.options.scales.xAxes[0].gridLines.display = true;
    chartOpts["tab1c-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = true;
    chartOpts["tab1c-" + i].small.options.scales.xAxes[1].gridLines.color = "rgba(0,0,0,0.3)";
    chartOpts["tab1c-" + i].small.options.scales.xAxes[1].position = 'bottom';
    chartOpts["tab1c-" + i].small.options.scales.xAxes[1].scaleLabel.display = false;
    chartOpts["tab1c-" + i].small.options.layout.padding.top = 7;

  
    //***Large graph
    chartOpts["tab1c-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab1c-" + i].small));
    chartOpts["tab1c-" + i].large.options.scales.xAxes[0].gridLines.tickMarkLength = 30;
    chartOpts["tab1c-" + i].large.options.events = false;
    chartOpts["tab1c-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab1c-" + i].large.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      var chartDim = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();

      ctx.font = (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
            if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
              var tmpX = bar._model.x + binWidth;
              var tmpY = bar._model.y - 7;
              tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                ctx.fillText(tmpLine, tmpX, tmpY + (14 * z));
              });
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        });
      });
    }

  
    //***Print graph
    chartOpts["tab1c-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab1c-" + i].large));
    chartOpts["tab1c-" + i].print.options.scales.xAxes[0].gridLines.tickMarkLength = 37;
    chartOpts["tab1c-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
    chartOpts["tab1c-" + i].print.options.animation.onComplete = function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = "17px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          //var data = dataset.data[index];                            
          if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
            if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
              var tmpX = bar._model.x + binWidth;
              var tmpY = bar._model.y - 9;
              tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                ctx.fillText(tmpLine, tmpX, tmpY + (18 * z));
              });
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        });
      });
    }

    var tab1c_ctx = document.getElementById("tab1c-" + i).getContext('2d');
    chartCanvas["tab1c-" + i + "Small"] = new Chart(tab1c_ctx, chartOpts["tab1c-" + i].small);

    //***Disable animation in small table so header and legend can be added
    //chartOpts["tab1c-" + i].small.options.animation = false;
  });
}








function tab1a(tmpData) {
  //***Table 1a

  var tmpCF = crossfilter(tmpData[0]);
  var cl = {filter:{}};
  
  cl.keys = d3.keys(tmpData[0][0]);
  cl.vals = d3.values(tmpData[0][0]);

  cl.keys.forEach(function(key, i) {
    cl.filter[key] = tmpCF.dimension(function(d) { if(isNaN(cl.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[1]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[1][0]);
  exc.vals = d3.values(tmpData[1][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[2]);
  var ndep = {filter:{}};
  
  ndep.keys = d3.keys(tmpData[2][0]);
  ndep.vals = d3.values(tmpData[2][0]);

  ndep.keys.forEach(function(key, i) {
    ndep.filter[key] = tmpCF.dimension(function(d) { if(isNaN(ndep.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[3]);
  var area = {filter:{}};
  
  area.keys = d3.keys(tmpData[3][0]);
  area.vals = d3.values(tmpData[3][0]);

  area.keys.forEach(function(key, i) {
    area.filter[key] = tmpCF.dimension(function(d) { if(isNaN(area.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[4]);
  var range = {filter:{}};
  
  range.keys = d3.keys(tmpData[4][0]);
  range.vals = d3.values(tmpData[4][0]);

  range.keys.forEach(function(key, i) {
    range.filter[key] = tmpCF.dimension(function(d) { if(isNaN(range.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpReg = ndep.filter.region_name.bottom(Infinity);
  var tmpRegions = tmpReg.map(function(d) { return d.region_name; });

  tmpRegions.forEach(function(reg,i) {
    cl.filter.region_name.filterAll();
    cl.filter.region_name.filterFunction(function(d) { return d == reg; });
    exc.filter.region_name.filterAll();
    exc.filter.region_name.filterFunction(function(d) { return d == reg; });
    ndep.filter.region_name.filterAll();
    ndep.filter.region_name.filterFunction(function(d) { return d == reg; });
    area.filter.region_name.filterAll();
    area.filter.region_name.filterFunction(function(d) { return d == reg; });

    var clData = cl.filter.species.bottom(Infinity);
    var excData = exc.filter.species.bottom(Infinity);
    var ndepData = ndep.filter.region_name.bottom(Infinity);
    var areaData = area.filter.species.bottom(Infinity);
    var rangeData = range.filter.species.bottom(Infinity);

    var tmpSpp = clData.map(function(d) { return d.species; });

    if(tmpSpp.length > 0) {
      regData = [{}];
      regData[0].region = ndepData[0].region;
      regData[0].region_name = reg;
      regData[0].min = ndepData[0].min;
      regData[0].max = ndepData[0].max;
      regData[0].area_ha = Math.round(ndepData[0].shape_area_m2 * 0.0001);
      regData[0].area_acres = Math.round(ndepData[0].shape_area_m2 * 0.000247105);
      regData[0].title = "Critical Loads for species in " + reg;

      var tmpVals = [];
      var tmpValsNums = [0,1,2,3,4,5];
      if(outUnit == "hectares") {
        var tmpXLabels = ["Species", ["Species Area", "(ha)"], ["CL Most Protective of", "N More Sensitive", "Sites (kg/ha/yr)"], ["CL Most Protective of", "N Less Sensitive", "Sites (kg/ha/yr)"], ["Area N More", "Sensitive (ha)"], ["% Area N", "More Sensitive"]];
      }
      else {
        var tmpXLabels = ["Species", ["Species Area", "(ac)"], ["CL Most Protective of", "N More Sensitive", "Sites (kg/ha/yr)"], ["CL Most Protective of", "N Less Sensitive", "Sites (kg/ha/yr)"], ["Area N More", "Sensitive (ac)"], ["% Area N", "More Sensitive"]];
      }

      tmpSpp.forEach(function(spp,k) {
        var tmpBi = 0;
        rangeData.some(function(d,j) {
          if(d.species == spp) {
            tmpBi = j;
          }
          return tmpBi > 0;
        });

        tmpVals.push([]);
        if(outSpecies == "latin") {  
          tmpVals[k][0] = formatLabel(spp, 27);
        }
        else {
          tmpVals[k][0] = formatLabel(speciesJSON[spp], 27);
        }
        tmpVals[k][2] = rangeData[tmpBi].min.toFixed(1);
        tmpVals[k][3] = rangeData[tmpBi].max.toFixed(1);
        if(outUnit == "hectares") {
          tmpVals[k][1] = Math.round(clData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][4] = Math.round(clData[k].lo_count * 900 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        else {
          tmpVals[k][1] = Math.round(clData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          tmpVals[k][4] = Math.round(clData[k].lo_count * 900 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        tmpVals[k][5] = parseFloat(clData[k].lo_percent).toFixed(1) + "%";
      });

      //***Invert data for horizontal bar graph
      var tmpValsInvert = [];
      var tmpValsMod = [];
      for(var j = 0; j < tmpVals[0].length; j++) {
        tmpValsInvert.push([]);
        tmpValsMod.push([]);
        for(var k = 0; k < tmpSpp.length; k++) {
          tmpValsInvert[j].push(tmpVals[k][j]);
          tmpValsMod[j].push(j);
        }
      }
    
      d3.select("#resRegTabCurrentCanvas" + i)
        .append("div")
        .attr("class", "canvasChartSmall")
        .html('<canvas id="tab1a-' + i + '" class="canvasChart" value="Tables">');

      d3.select("#tab1a-" + i).property("title", reg + " Critical Loads by species");

      chartOpts["tab1a-" + i] = {};
      //***Small graph
      chartOpts["tab1a-" + i].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
      chartOpts["tab1a-" + i].small.cl = regData;
      chartOpts["tab1a-" + i].small.type = 'horizontalBar';
      chartOpts["tab1a-" + i].small.data.yLabels = tmpSpp;
      chartOpts["tab1a-" + i].small.data.xLabels = tmpValsNums;

      tmpValsNums.forEach(function(stepVal,j) {
        chartOpts["tab1a-" + i].small.data.datasets[j] = {
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 1,
          data: tmpValsMod[j],
          label: ""
        }
      });

      chartOpts["tab1a-" + i].small.options.tooltips = {"enabled": false};
      chartOpts["tab1a-" + i].small.options.animation = {
        duration: 1,
        hover: {"animationDuration": 0},
        onComplete: function () {
          var chartInstance = this.chart;
          var ctx = chartInstance.ctx;
          ctx.font = "3px Arial";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

          this.data.datasets.forEach(function (dataset, i) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              if(bar._datasetIndex == 0 && outSpecies == "latin") {
                ctx.font = "italic 3px Arial";
              }
              else {
                ctx.font = "normal 3px Arial";
              }
              //var data = dataset.data[index];
              if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
                if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                  var tmpX = bar._model.x + binWidth;
                  var tmpY = bar._model.y - 2;
                  tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                    ctx.fillText(tmpLine, tmpX, tmpY + (3 * z));
                  });
                }
                else {
                  ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
                }
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            });
          });
        }
      }
      chartOpts["tab1a-" + i].small.options.animation.duration = 0;
      chartOpts["tab1a-" + i].small.options.events = ["click"];
      chartOpts["tab1a-" + i].small.options.onClick = function(evt, tmpArray) {
        chartCanvas["tab1a-" + i + "Small"].clear();
        chartCanvas["tab1a-" + i + "Small"].render();
        viewFig("tab1a-" + i); 
        setDataDL("tab1a-" + i, tmpVals, tmpXLabels);
        d3.selectAll(".canvasChart").classed("selected", false); 
        d3.select("#tab1a-" + i).classed("selected", true);
        setTimeout(function() {
          addInfo(chartCanvas["tab1a-" + i + "Small"], chartOpts["tab1a-" + i].small.cl[0], document.getElementById("tab1a-" + i).getBoundingClientRect(), "small", 1, "tab1a-" + i);
        }, 30);
      };

      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].stacked = true;
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].barPercentage = 1;
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].ticks.display = false;
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].gridLines.drawTicks = false;
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].zeroLineColor = "rgba(0,0,0,0)";
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].scaleLabel.display = false;
      chartOpts["tab1a-" + i].small.options.scales.yAxes[1] = {position: 'right', display: true, ticks:{display:false}, scaleLabel:{display:false}, gridLines:{display:false, color: "rgba(0,0,0,0.3)"}, zeroLineColor: 'rgba(0,0,0,0)'};
      chartOpts["tab1a-" + i].small.options.scales.yAxes[0].categoryPercentage = 1;
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].position = 'top';
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].type = 'category';
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab1a");
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].ticks.fontWeigth = "bold";
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].gridLines.tickMarkLength = 10;
      chartOpts["tab1a-" + i].small.options.scales.xAxes[0].gridLines.display = true;
      chartOpts["tab1a-" + i].small.options.scales.xAxes[1].gridLines.drawBorder = true;
      chartOpts["tab1a-" + i].small.options.scales.xAxes[1].gridLines.color = "rgba(0,0,0,0.3)";
      chartOpts["tab1a-" + i].small.options.scales.xAxes[1].position = 'bottom';
      chartOpts["tab1a-" + i].small.options.scales.xAxes[1].scaleLabel.display = false;
      chartOpts["tab1a-" + i].small.options.layout.padding.top = 10;

  
      //***Large graph
      chartOpts["tab1a-" + i].large = JSON.parse(JSON.stringify(chartOpts["tab1a-" + i].small));
      chartOpts["tab1a-" + i].large.options.scales.xAxes[0].gridLines.tickMarkLength = 55;
      chartOpts["tab1a-" + i].large.options.events = false;
      chartOpts["tab1a-" + i].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab1a-" + i].large.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        var chartDim = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();

        //ctx.font = (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            if(bar._datasetIndex == 0 && outSpecies == "latin") {
              ctx.font = "italic " + (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
            }
            else {
              ctx.font = "normal " + (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
            }

            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 7;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (14 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }

  
      //***Print graph
      chartOpts["tab1a-" + i].print = JSON.parse(JSON.stringify(chartOpts["tab1a-" + i].large));
      chartOpts["tab1a-" + i].print.options.scales.xAxes[0].gridLines.tickMarkLength = 70;
      chartOpts["tab1a-" + i].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
      chartOpts["tab1a-" + i].print.options.animation.onComplete = function () {
        var chartInstance = this.chart;
        var ctx = chartInstance.ctx;
        ctx.font = "17px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
  
        var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

        this.data.datasets.forEach(function (dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function (bar, index) {
            if(bar._datasetIndex == 0 && outSpecies == "latin") {
              ctx.font = "italic 17px Arial";
            }
            else {
              ctx.font = "normal 17px Arial";
            }
            //var data = dataset.data[index];                            
            if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
              if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
                var tmpX = bar._model.x + binWidth;
                var tmpY = bar._model.y - 9;
                tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                  ctx.fillText(tmpLine, tmpX, tmpY + (18 * z));
                });
              }
              else {
                ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
              }
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          });
        });
      }

      var tab1a_ctx = document.getElementById("tab1a-" + i).getContext('2d');
      chartCanvas["tab1a-" + i + "Small"] = new Chart(tab1a_ctx, chartOpts["tab1a-" + i].small);

      //***Disable animation in small table so header and legend can be added
      //chartOpts["tab1a-" + i].small.options.animation = false;
    }
  });
}







function tab4a(tmpData) {
  //***Table 4a
  //console.log(tmpData);

  var tmpCF = crossfilter(tmpData[0]);
  var cl = {filter:{}};
  
  cl.keys = d3.keys(tmpData[0][0]);
  cl.vals = d3.values(tmpData[0][0]);

  cl.keys.forEach(function(key, i) {
    cl.filter[key] = tmpCF.dimension(function(d) { if(isNaN(cl.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[1]);
  var exc = {filter:{}};
  
  exc.keys = d3.keys(tmpData[1][0]);
  exc.vals = d3.values(tmpData[1][0]);

  exc.keys.forEach(function(key, i) {
    exc.filter[key] = tmpCF.dimension(function(d) { if(isNaN(exc.vals[i])) {return d[key];} else {return +d[key];} });
  });

  var tmpCF = crossfilter(tmpData[2]);
  var ndep = {filter:{}};
  
  ndep.keys = d3.keys(tmpData[2][0]);
  ndep.vals = d3.values(tmpData[2][0]);

  ndep.keys.forEach(function(key, i) {
    ndep.filter[key] = tmpCF.dimension(function(d) { if(isNaN(ndep.vals[i])) {return d[key];} else {return +d[key];} });
  });


  var clData = cl.filter.region_name.bottom(Infinity);
  var excData = exc.filter.region_name.bottom(Infinity);
  var ndepData = ndep.filter.region_name.bottom(Infinity);

  var tmpNdep = clData.map(function(d) { return d.region_name; });

  regData = [{}];
  regData[0].region = ndepData[0].region;
  regData[0].title = "Community critical loads and exceedance in " + ndepData[0].region;
  regData[0].subtitle = "CL A - Most protective of most sensitive species";

  var tmpVals = [];
  var tmpValsNums = [0,1,2,3,4,5,6];
  if(outUnit == "hectares") {
    var tmpXLabels = ["Region Name", ["Region Area", "(ha)"], ["Combined Species", "Area (ha)"], ["N Deposition", "(kg/ha/yr)"], ["CL Range"], ["Most Protective CL"], ["% Exceedance of", "Most Protective CL"]];
  }
  else {
    var tmpXLabels = ["Region Name", ["Region Area", "(ac)"], ["Combined Species", "Area (ac)"], ["N Deposition", "(kg/ha/yr)"], ["CL Range"], ["Most Protective CL"], ["% Exceedance of", "Most Protective CL"]];
  }

  tmpNdep.forEach(function(reg,k) {
    tmpVals.push([]);
    tmpVals[k][0] = formatLabel(areaShortName[reg], tmpLength);
    if(outUnit == "hectares") {
      tmpVals[k][1] = Math.round(ndepData[k].shape_area_m2 * 0.0001).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      tmpVals[k][2] = Math.round(clData[k].area_ha).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    else {
      tmpVals[k][1] = Math.round(ndepData[k].shape_area_m2 * 0.000247105).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      tmpVals[k][2] = Math.round(clData[k].area_acres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    tmpVals[k][3] = ndepData[k].min.toFixed(1) + " - " + ndepData[k].max.toFixed(1);
    tmpVals[k][4] = clData[k].min.toFixed(1) + " - " + clData[k].max.toFixed(1);
    tmpVals[k][5] = clData[k].min.toFixed(1);
    tmpVals[k][6] = parseFloat(excData[k].percentage).toFixed(1) + "%";
  });

  //***Invert data for horizontal bar graph
  var tmpValsInvert = [];
  var tmpValsMod = [];
  for(var j = 0; j < tmpVals[0].length; j++) {
    tmpValsInvert.push([]);
    tmpValsMod.push([]);
    for(var k = 0; k < tmpNdep.length; k++) {
      tmpValsInvert[j].push(tmpVals[k][j]);
      tmpValsMod[j].push(j);
     }
  }
  
  d3.select("#resRegTabCurrentCanvas-1")
    .append("div")
    .attr("class", "canvasChartSmall")
    .html('<canvas id="tab4a" class="canvasChart" value="Tables">');

  d3.select("#tab4a").property("title", "Community critical loads and exceedance in " + ndepData[0].region);

  chartOpts["tab4a"] = {};
  //***Small graph
  chartOpts["tab4a"].small = JSON.parse(JSON.stringify(chartOpts.default.bar));
  chartOpts["tab4a"].small.cl = regData;
  chartOpts["tab4a"].small.type = 'horizontalBar';
  chartOpts["tab4a"].small.data.yLabels = tmpNdep;
  chartOpts["tab4a"].small.data.xLabels = tmpValsNums;

  tmpValsNums.forEach(function(stepVal,j) {
    chartOpts["tab4a"].small.data.datasets[j] = {
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 1,
      data: tmpValsMod[j],
      label: ""
    }
  });

  chartOpts["tab4a"].small.options.tooltips = {"enabled": false};
  chartOpts["tab4a"].small.options.animation = {
    duration: 1,
    hover: {"animationDuration": 0},
    onComplete: function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;
      ctx.font = "3px Arial";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          //var data = dataset.data[index];
          if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
            if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
              var tmpX = bar._model.x + binWidth;
              var tmpY = bar._model.y - 2;
              tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
                ctx.fillText(tmpLine, tmpX, tmpY + (3 * z));
              });
            }
            else {
              ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
            }
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        });
      });
    }
  }
  chartOpts["tab4a"].small.options.animation.duration = 0;
  chartOpts["tab4a"].small.options.events = ["click"];
  chartOpts["tab4a"].small.options.onClick = function(evt, tmpArray) {
    chartCanvas["tab4a" + "Small"].clear();
    chartCanvas["tab4a" + "Small"].render();
    viewFig("tab4a"); 
    setDataDL("tab4a", tmpVals, tmpXLabels);
    d3.selectAll(".canvasChart").classed("selected", false); 
    d3.select("#tab4a").classed("selected", true);
    setTimeout(function() {
      addInfo(chartCanvas["tab4a" + "Small"], chartOpts["tab4a"].small.cl[0], document.getElementById("tab4a").getBoundingClientRect(), "small", 1, "tab4a");
    }, 30);
  };

  chartOpts["tab4a"].small.options.scales.yAxes[0].stacked = true;
  chartOpts["tab4a"].small.options.scales.yAxes[0].barPercentage = 1;
  chartOpts["tab4a"].small.options.scales.yAxes[0].ticks.display = false;
  chartOpts["tab4a"].small.options.scales.yAxes[0].gridLines.drawTicks = false;
  chartOpts["tab4a"].small.options.scales.yAxes[0].zeroLineColor = "rgba(0,0,0,0)";
  chartOpts["tab4a"].small.options.scales.yAxes[0].scaleLabel.display = false;
  chartOpts["tab4a"].small.options.scales.yAxes[1] = {position: 'right', display: true, ticks:{display:false}, scaleLabel:{display:false}, gridLines:{display:false, color: "rgba(0,0,0,0.3)"}, zeroLineColor: 'rgba(0,0,0,0)'};
  chartOpts["tab4a"].small.options.scales.yAxes[0].categoryPercentage = 1;
  chartOpts["tab4a"].small.options.scales.xAxes[0].position = 'top';
  chartOpts["tab4a"].small.options.scales.xAxes[0].gridLines.offsetGridLines = 'true';
  chartOpts["tab4a"].small.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
  chartOpts["tab4a"].small.options.scales.xAxes[0].type = 'category';
  chartOpts["tab4a"].small.options.scales.xAxes[0].ticks.fontSize = setFontSizeSmall("Tables", "tab4a");
  chartOpts["tab4a"].small.options.scales.xAxes[0].gridLines.tickMarkLength = 6;
  chartOpts["tab4a"].small.options.scales.xAxes[0].gridLines.display = true;
  chartOpts["tab4a"].small.options.scales.xAxes[1].gridLines.drawBorder = true;
  chartOpts["tab4a"].small.options.scales.xAxes[1].gridLines.color = "rgba(0,0,0,0.3)";
  chartOpts["tab4a"].small.options.scales.xAxes[1].position = 'bottom';
  chartOpts["tab4a"].small.options.scales.xAxes[1].scaleLabel.display = false;
  chartOpts["tab4a"].small.options.layout.padding.layout.top = 1;

  
  //***Large graph
  chartOpts["tab4a"].large = JSON.parse(JSON.stringify(chartOpts["tab4a"].small));
  chartOpts["tab4a"].large.options.scales.xAxes[0].gridLines.tickMarkLength = 32;
  chartOpts["tab4a"].large.options.events = false;
  chartOpts["tab4a"].large.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
  chartOpts["tab4a"].large.options.animation.onComplete = function () {
    var chartInstance = this.chart;
    var ctx = chartInstance.ctx;
    var chartDim = document.getElementById("canvasChartsLargeDiv").getElementsByTagName("canvas")[0].getBoundingClientRect();

    //ctx.font = (7 + (7 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

    this.data.datasets.forEach(function (dataset, i) {
      var meta = chartInstance.controller.getDatasetMeta(i);
      meta.data.forEach(function (bar, index) {
        if(bar._datasetIndex == 0) {
          ctx.font = (7 + (7 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
        }
        else {
          ctx.font = (8 + (8 * (Math.max((chartDim.width - 730),1)/730))) + "px Arial";
        }

        if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
          if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
            var tmpX = bar._model.x + binWidth;
            var tmpY = bar._model.y - 7;
            tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
              ctx.fillText(tmpLine, tmpX, tmpY + (14 * z));
            });
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        }
        else {
          ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
        }  
      });
    });
  }

  
  //***Print graph
  chartOpts["tab4a"].print = JSON.parse(JSON.stringify(chartOpts["tab4a"].large));
  chartOpts["tab4a"].print.options.scales.xAxes[0].gridLines.tickMarkLength = 42;
  chartOpts["tab4a"].print.options.scales.xAxes[0].ticks.callback = function(value, index, values) { return tmpXLabels[index]; };
  chartOpts["tab4a"].print.options.animation.onComplete = function () {
    var chartInstance = this.chart;
    var ctx = chartInstance.ctx;
    ctx.font = "17px Arial";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var binWidth = (chartInstance.controller.getDatasetMeta(1).data[0]._model.x - chartInstance.controller.getDatasetMeta(0).data[0]._model.x) / 2

    this.data.datasets.forEach(function (dataset, i) {
      var meta = chartInstance.controller.getDatasetMeta(i);
      meta.data.forEach(function (bar, index) {
        //var data = dataset.data[index];                            
        if(Array.isArray(tmpVals[bar._index][bar._datasetIndex])) {
          if(tmpVals[bar._index][bar._datasetIndex].length > 1) {
            var tmpX = bar._model.x + binWidth;
            var tmpY = bar._model.y - 9;
            tmpVals[bar._index][bar._datasetIndex].forEach(function(tmpLine, z) {
              ctx.fillText(tmpLine, tmpX, tmpY + (18 * z));
            });
          }
          else {
            ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
          }
        }
        else {
          ctx.fillText(tmpVals[bar._index][bar._datasetIndex], bar._model.x + binWidth, bar._model.y);
        }
      });
    });
  }

  var tab4a_ctx = document.getElementById("tab4a").getContext('2d');
  chartCanvas["tab4a" + "Small"] = new Chart(tab4a_ctx, chartOpts["tab4a"].small);

  //***Disable animation in small table so header and legend can be added
  //chartOpts["tab4a"].small.options.animation = false;
}
