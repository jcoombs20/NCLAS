L.Control.downLoadFile = L.Control.extend({
    options: {
        position: 'topright',
        collapsed: true
    },

    onAdd: function (map) {
        this._map = map;
        var className = 'leaflet-control-downLoadFile';
        var container = this._container = L.DomUtil.create('div', className);
        container.id = "download";
        L.DomEvent.disableClickPropagation(container);

        var dlFile = L.DomUtil.create('div', className + '-div');
        dlFile.id = "downloadFile";

        if (this.options.collapsed) {
            L.DomEvent.on(container, 'mouseover', this._expand, this);
            L.DomEvent.on(container, 'mouseout', this._collapse, this);

            var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
            link.href = '#';
            link.title = 'File Downloader';

            L.DomEvent.on(link, L.Browser.touch ? 'click' : 'focus', this._expand, this);

            this._map.on('movestart', this._collapse, this);
        } else {
            this._expand();
        }

        container.appendChild(dlFile);

        return container;
    },

    _expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-downLoadFile-expanded');
    },

    _collapse: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-control-downLoadFile-expanded');
    }

});

L.control.downLoadFile = function (options) {
    return new L.Control.downLoadFile(options);
};





//******Add show graph html elements
function completeGraph() {
  d3.select("body")
    .append("div")
    .attr("id","oldGraph")
    .attr("class", "choice")
    .style({"background":"beige", "display":"none", "text-align":"center", "padding":"20px"})
    .append("img")
    .attr("id", "graphImg");
    //.on("mouseleave", function() { d3.select(this).style("display", "none"); graphID.forEach(function(img, i) { d3.select("#graphImg-" + i).property("checked", false); }); });

  var graphID = ["lower_cl_percent", "cl_bins_area", "exc_min_cl_percent", "exc_min_cl_area", "cumulative_cl", "n_protection", "n_protection_eco2", "n_protection_eco3"];
  var graphTitles = ["% Area bottom CL by species", "Area CL bin by species", "% N exceedance of min CL", "Area N exceedance of min CL", "% Cumulative CL", "% Area protection - Total", "% Area protection - Level 2 ecoregions", "% Area protection - Level 3 ecoregions"];

  d3.select("#downloadFile")
    .append("div")
    .attr("id", "graphRadio")
    .append("h4")
    .text("Output Graphs")
    .style({"border-bottom": "1px solid black", "text-align": "center"});

  graphID.forEach(function(img, i) {
    d3.select("#graphRadio")
      .append("label")
      .style("display", "block")
      .html('<input id="graphImg-' + i + '" type="radio" name="graphImg"></input><span> ' + graphTitles[i] + '</span>');

    d3.select("#graphImg-" + i)
          .on("click", function() {graphImgSwitch(img); });

  });    
}


function graphImgSwitch(img) {
  d3.select("#oldGraph")
    .style("display", "block");

  d3.select("#graphImg")
    //.style("display", "block")
    .attr("src", "graphs/" + img + ".png");
}


//******Add download html elements
function completeDownload() {
  //******Add title information
  d3.select("#downloadFile")
    .append("div")
    .append("h4")
    .attr("id", "priorTitle")
    .attr("class", "legTitle")
    .text("Download Map Features")
    .property("title", "Download attributes of visible map features for the selected layer to the specified output format")
    .append("span")
    .style("margin-left", "20px")
    .html('<span id="testTT" class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Feature Download</center></b></u></p><p>Enables the user to download visible features from the crossings, streams, or catchments layer in a CSV, shapefile, or geoJSON format</p>"></span>');

  d3.select("#downloadFile")
    .append("hr")
    .attr("class", "hr")
    .style("border-top", "solid 1px");

  d3.select("#downloadFile")
    .append("div")
    .attr("id", "dlCrossings")
    .attr("class", "priorDiv")
    .style("padding-left", "55px")
    .append("input")
    .attr({type: "radio", name: "layer", value: "crossings", id: "dlCrossingsRadio", checked: true})
    .property("title", "Download visible features from crossings layer")
    .attr("class", "priorRadio");

  d3.select("#dlCrossings")
    .append("label")
    .text("Crossings")
    .property("title", "Download visible features from crossings layer")
    .attr("class", "priorLabel")
    .attr("for", "dlCrossingsRadio");
    
  d3.select("#downloadFile")
    .append("div")
    .attr("id", "dlStreams")
    .attr("class", "priorDiv")
    .style("padding-left", "55px")
    .append("input")
    .attr({type: "radio", name: "layer", value: "streams", id: "dlStreamsRadio"})
    .property("title", "Download visible features from streams layer")
    .attr("class", "priorRadio");

  d3.select("#dlStreams")
    .append("label")
    .text("Streams")
    .property("title", "Download visible features from streams layer")
    .attr("class", "priorLabel")
    .attr("for", "dlStreamsRadio");

  d3.select("#downloadFile")
    .append("div")
    .attr("id", "dlCatchments")
    .attr("class", "priorDiv")
    .style("padding-left", "55px")
    .append("input")
    .attr({type: "radio", name: "layer", value: "catchments", id: "dlCatchmentsRadio"})
    .property("title", "Download visible features from catchments layer")
    .attr("class", "priorRadio");

  d3.select("#dlCatchments")
    .append("label")
    .text("Catchments")
    .property("title", "Download visible features from catchments layer")
    .attr("class", "priorLabel")
    .attr("for", "dlCatchmentsRadio");

  d3.select("#downloadFile")
    .append("hr")
    .attr("class", "hr")
    .style("border-top", "solid 1px");

  d3.select("#downloadFile")
    .append("div")
    .attr("id", "dlSelectDiv")
    .append("select")
    .attr("id", "dlSelect")
    .property("title", "Select the download file format");

  d3.select("#dlSelect")
    .append("option")
    .attr("value", "csv")
    .text("CSV")
    .property("title", "Comma Separated Values");
    
  d3.select("#dlSelect")
    .append("option")
    .attr("value", "zip")
    .text("Shapefile")
    .property("title", "ESRI Shapefile");

  d3.select("#dlSelect")
    .append("option")
    .attr("value", "json")
    .text("GeoJSON")
    .property("title", "Geo Javascript Object Notation");

  d3.select("#downloadFile")
    .append("hr")
    .attr("class", "hr")
    .style("border-top", "solid 1px");

  d3.select("#downloadFile")
    .append("div")
    .style("text-align", "center")
    .append("a")
    .attr("id", "dlButton")
    .text("Download")
    .property("href", "#")
    .property("title", "Download attributes of visible map features for the selected layer to the specified output format")
    .on("click", function() { downloadFile(); });

}




//*******Attach to download button
function downloadFile() {
  var outLayer = document.querySelector('input[name=layer]:checked').value;
 
  var outData = topos[outLayer].filter.featureid.top(Infinity);


  if (outData.length > 0) {
    //******CSV output
    if (d3.select("#dlSelect").node().value == "csv") {
      var outKeys = d3.keys(outData[0]);
      var titleKeys = [];
      outKeys.forEach(function(key) { titleKeys.push(topos[outLayer].title[key]); });

      if (outLayer == "crossings") {
        var strOutData = titleKeys.join() + ",Longitude,Latitude" + String.fromCharCode(13);
        var tmpData = d3.selectAll(".crossings").data();
        var tmpID = tmpData.map(function(d) {return d["properties"][topos.crossings.uniqueID];});
      }
      else {
        var strOutData = titleKeys.join() + String.fromCharCode(13);
      }

      outData.forEach(function(row) { 
        var lineData = [];
        outKeys.forEach(function(key) { 
          var tmpVal = backTransformData(topos[outLayer]["scale"][key], [row[key]], topos[outLayer]["max"][key]);
          if (topos[outLayer]["data_type"][key] == "date" & tmpVal != -9999) {
            var formatDate = d3.time.format("%-m/%-d/%Y");
            lineData.push(formatDate(new Date(parseFloat(tmpVal))));
          }
          else {
            lineData.push(tmpVal);
          }
        });
        
        if (outLayer == "crossings") {
          var tmpPoint = tmpData[tmpID.indexOf(row[topos.crossings.uniqueID])].geometry.coordinates;
          lineData.push(tmpPoint[0]);
          lineData.push(tmpPoint[1]);
        }
        strOutData += lineData.join() + String.fromCharCode(13);
      });

      var blob = new Blob([strOutData], {type: "text/plain"});
    }

    //******Shapefile and geoJSON output
    else {           
      var tmpData = d3.selectAll("." + outLayer).data();
      var tmpIDs = outData.map(function(d) { return d[topos[outLayer].uniqueID]; });

      var strOutData = {};
      strOutData.type = 'FeatureCollection';
      strOutData.features = [];

      tmpData.forEach(function(d) { if(tmpIDs.indexOf(d.properties[topos[outLayer].uniqueID]) != -1) { strOutData.features.push(d); } });
      
      //******Convert utm dates to string
      var formatDate = d3.time.format("%-m/%-d/%Y");
      strOutData = JSON.parse(JSON.stringify(strOutData));

      strOutData.features.forEach(function(d) {
        d3.keys(d.properties).forEach(function(key) { if (topos[outLayer]["data_type"][key] == "date") {
          if(parseFloat(d.properties[key]) != -9999) {
            d.properties[key] = formatDate(new Date(parseFloat(d.properties[key])));
          }
          else {
            d.properties[key] = d.properties[key].toString();
          }
        }});
      });

      //******Shapefile output
      if (d3.select("#dlSelect").node().value == "zip") {
        var shpwrite = require('shp-write');
        
        var options = {
          folder: outLayer,
          types: {
            point: outLayer,
            polygon: outLayer,
            line: outLayer,
            polyline: outLayer
          }
        }
        

        var byteString = shpwrite.zip(strOutData, options);

        var byteCharacters = window.atob(byteString);

        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        var blob = new Blob([byteArray], {type: 'application/zip'});       
      }

      //******GeoJSON output
      else {
        strOutData = JSON.stringify(strOutData);
        var blob = new Blob([strOutData], {type: "text/plain"});
      }
    }       

    //*******Add to download link
    //var blob = new Blob([strOutData], {type: "text/plain"});
    var url = URL.createObjectURL(blob);
    var a = d3.select("#dlButton");
    a.property("download", outLayer + "." + d3.select("#dlSelect").node().value);
    a.property("href", url);
  }
  else {
    alert("No data selected to output");
  }
}