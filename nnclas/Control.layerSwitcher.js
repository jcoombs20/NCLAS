function createLayerSwitcher() {
      //******Create custom legend
      var legendParts = ["base", "abiotic", "area", "comm", "species"];
      d3.select(".leaflet-control-layers-list").attr("id", "legendForm");

      //******Add in custom base layers
      var baseLayers = [states, googleHybrid, googleSatellite, googleStreet, googleTerrain, bingHybrid, bingSatellite, bingStreet, usgsTopo, blank];
      var baseLayerTitles = ["State Borders", "Google Hybrid", "Google Satellite", "Google Street", "Google Terrain", "Bing Hybrid", "Bing Satellite", "Bing Street", "USGS Topo", "None"]

      map.addLayer(states);
      var baseLayerNow = states;

      d3.select(".leaflet-control-layers-base")
        .insert("label", ":first-child")
        .attr("id", "baseLayersLabel")
        .attr("class", "layerHeading")
        .property("title", "Click to show layers")
        .html('<span> Basemap Layers </span>');

      d3.select("#baseLayersLabel")
        .insert("span", ":first-child")
        .attr("id", "baseLayersGlyph")
        .attr("class", "glyphicon glyphicon-plus-sign")
        .attr("data-toggle", "collapse")
        .attr("data-target", "#baseLayersDiv")
        .on("click", function() { resize(this); changeGlyph(this); });

      d3.select("#baseLayersLabel")
        .append("span")
        .attr("class", "glyphicon glyphicon-remove-sign pull-right")
        .property("title", "Click to hide layers window")
        .on("click", function() { d3.select(".leaflet-control-layers.leaflet-control").classed("leaflet-control-layers-expanded", false); });

      d3.select(".leaflet-control-layers-base")
        .append("div")
        .attr("class", "layerDiv")
        .property("id", "baseLayersDiv")
        .style("margin-left", "15px")
        .attr("class", "collapse");

      baseLayers.forEach(function(data, i) {
        d3.select("#baseLayersDiv")
          .append("label")
          .html('<input id="baseLayer-' + i + '" type="radio" name="baseLayer"></input><span> ' + baseLayerTitles[i] + ' </span>');

        d3.select("#baseLayer-" + i)
          .on("click", function() {baseLayerSwitch(data); });
      });
      
      d3.select("#baseLayer-0").property("checked", true);

      //******Switch out basemap layers
      function baseLayerSwitch(layer) {
        map.removeLayer(baseLayerNow);
        baseLayerNow = layer;
        map.addLayer(layer);
      }

      //******Add in legend div for geoserver layers
      d3.select("body")
        .append("div")
        .attr("id", "gsLegendDiv")
        .html('<h4 id="gsLegendHeader" class="popupHeader"></h4><img id="gsLegendImg">');

      //******Add in opacity div for geoserver layers
      d3.select("body")
        .append("div")
        .attr("id", "gsOpacityDiv")
        .on("mouseleave", function() { d3.select(this).style("display", "none"); })
        .html('<h4 id="gsOpacityHeader" class="popupHeader"></h4><input id="gsOpacityRange" type="range" min="0" max="1" step="0.01" title="1" data-layer="0"></input>');

      //******Add in custom abiotic overlays
      d3.select(".leaflet-control-layers-overlays")
        .insert("label", ":first-child")
        .attr("id", "abioticLayersLabel")
        .attr("class", "layerHeading")
        .property("title", "Click to show layers")
        .html('<span> Abiotic Layers </span>');

      d3.select("#abioticLayersLabel")
        .insert("span", ":first-child")
        .attr("id", "abioticLayersGlyph")
        .attr("class", "glyphicon glyphicon-plus-sign")
        .attr("data-toggle", "collapse")
        .attr("data-target", "#abioticLayersDiv")
        .on("click", function() {resize(this); changeGlyph(this);});

      d3.select(".leaflet-control-layers-overlays")
        .append("div")
        .attr("class", "layerDiv")
        .property("id", "abioticLayersDiv")
        .style("margin-left", "15px")
        .attr("class", "collapse");

      abioticLayers.forEach(function(data, i) {
        d3.select("#abioticLayersDiv")
          .append("label")
          .html('<input id="abioticLayer-' + i + '" type="checkbox"></input><span> ' + abioticTitles[i] + ' </span><span id="abioticLegend-' + i + '" class="glyphicon glyphicon-modal-window label-glyph" data-title="' + abioticTitles[i] + '" data-src="http://ecosheds.org:8080/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&LAYER=CL:' + abioticID[i] + '"></span><span id="abioticOpacity-' + i + '" class="glyphicon glyphicon-certificate label-glyph" data-layer="' + i + '"></span><a href="zips/' + abioticID[i] + '.zip"><span id="abioticDownload-' + i + '" class="glyphicon glyphicon-save label-glyph" title="Click to download ' + abioticTitles[i] + ' layer"></span></a>');

        d3.select("#abioticLayer-" + i)
          .property("checked", false)
          .on("click", function() {layerToggle(this.checked, data); });

        d3.select("#abioticLegend-" + i)
          .property("title", "Hover to display layer legend")
          .datum(function() {return this.dataset; })
          .on("mouseover", function(d) { d3.select("#gsLegendHeader").text(d.title); d3.select("#gsLegendImg").attr("src", d.src); d3.select("#gsLegendDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); })
          .on("mouseout", function(d) { d3.select("#gsLegendDiv").style("display", "none"); });

        d3.select("#abioticOpacity-" + i)
          .property("title", "Hover to display layer opacity control when layer is checked")
          .datum(function() {return this.dataset; })
          .on("mouseover", function(d) {
            if (d3.select("#abioticLayer-" + d.layer).property("checked") == true) {
              d3.select("#gsOpacityRange")
                .property("value", abioticLayers[d.layer].valueOf().options.opacity)
                .property("title", abioticLayers[d.layer].valueOf().options.opacity)
                .on("input", function() {
                  abioticLayers[d.layer].setOpacity(this.value); 
                  d3.select(this).property("title", this.value);
                }); 
              d3.select("#gsOpacityHeader").text(abioticTitles[i]); 
              d3.select("#gsOpacityDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); 
            }
          })
      });


      //******Add in divider bar
      d3.select(".leaflet-control-layers-overlays")
        .append("hr")
        .attr("class", "leaflet-control-layers-separator");


      //******Add in area select SVGs
      d3.select(".leaflet-control-layers-overlays")
        .append("label")
        .attr("id", "areaLayersLabel")
        .attr("class", "layerHeading")
        .property("title", "Click to show layers")
        .html('<span> Area Layers </span>');

      d3.select("#areaLayersLabel")
        .insert("span", ":first-child")
        .attr("id", "areaLayersGlyph")
        .attr("class", "glyphicon glyphicon-plus-sign")
        .attr("data-toggle", "collapse")
        .attr("data-target", "#areaLayersDiv")
        .on("click", function() {resize(this); changeGlyph(this);});

      d3.select(".leaflet-control-layers-overlays")
        .append("div")
        .attr("class", "layerDiv")
        .property("id", "areaLayersDiv")
        .style("margin-left", "15px")
        .attr("class", "collapse");

      areaLayers.forEach(function(data, i) {
        d3.select("#areaLayersDiv")
          .append("label")
          .html('<input id="areaLayer-' + i + '" type="checkbox" class="areaLayers"></input><span> ' + areaTitles[i] + ' </span><a href="zips/' + areaID[i] + '.zip"><span id="areaDownload-' + i + '" class="glyphicon glyphicon-save label-glyph" title="Click to download ' + areaTitles[i] + ' layer"></span></a>');

        d3.select("#areaLayer-" + i)
          .property("checked", false)
          .on("click", function() {layerToggle(this.checked, data); });
      });


      //******Add in divider bar
      d3.select(".leaflet-control-layers-overlays")
        .append("hr")
        .attr("class", "leaflet-control-layers-separator");

      //******Add in community layers
      d3.select(".leaflet-control-layers-overlays")
        .append("label")
        .attr("id", "commLayersLabel")
        .property("title", "Click to show layers")
        .html('<span> Community Outputs </span>');

      d3.select("#commLayersLabel")
        .insert("span", ":first-child")
        .attr("id", "commLayersGlyph")
        .attr("class", "glyphicon glyphicon-plus-sign")
        .attr("data-toggle", "collapse")
        .attr("data-target", "#" + "commLayersDiv")
        .on("click", function() {resize(this); changeGlyph(this);});

      d3.select(".leaflet-control-layers-overlays")
        .append("div")
        .attr("class", "layerDiv")
        .property("id", "commLayersDiv")
        .style("margin-left", "30px")
        .attr("class", "collapse");

      commLayers.forEach(function(data, i) {
        d3.select("#commLayersDiv")
          .append("label")
          .html('<input id="commLayer-' + i + '" type="checkbox"></input><span> ' + commTitles[i] + ' </span><span id="commLegend-' + i + '" class="glyphicon glyphicon-modal-window label-glyph" data-title="' + commTitles[i] + '" data-src="http://ecosheds.org:8080/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&LAYER=CL:' + commID[i] + '"></span><span id="commOpacity-' + i + '" class="glyphicon glyphicon-certificate label-glyph" data-layer="' + i + '"></span><a href="zips/' + commID[i] + '.zip"><span id="commDownload-' + i + '" class="glyphicon glyphicon-save label-glyph" title="Click to download ' + commTitles[i] + ' layer"></span></a>');

        d3.select("#commLayer-" + i)
          .property("checked", false)
          .on("click", function() {layerToggle(this.checked, data); });

        d3.select("#commLegend-" + i)
          .property("title", "Hover to display layer legend")
          .datum(function() {return this.dataset; })
          .on("mouseover", function(d) { d3.select("#gsLegendHeader").text(d.title); d3.select("#gsLegendImg").attr("src", d.src); d3.select("#gsLegendDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); })
          .on("mouseout", function(d) { d3.select("#gsLegendDiv").style("display", "none"); });

        d3.select("#commOpacity-" + i)
          .property("title", "Hover to display layer opacity control when layer is added")
          .datum(function() {return this.dataset; })
          .on("mouseover", function(d) {
            if (d3.select("#commLayer-" + d.layer).property("checked") == true) {
              d3.select("#gsOpacityRange")
                .property("value", commLayers[d.layer].valueOf().options.opacity)
                .property("title", commLayers[d.layer].valueOf().options.opacity)
                .on("input", function() {
                  commLayers[d.layer].setOpacity(this.value); 
                  d3.select(this).property("title", this.value);
                }); 
              d3.select("#gsOpacityHeader").text(commTitles[i]); 
              d3.select("#gsOpacityDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); 
            }
          })
      });

      //******Add in divider bar
      d3.select(".leaflet-control-layers-overlays")
        .append("hr")
        .attr("class", "leaflet-control-layers-separator");


      //******Add in custom species overlays
      d3.select(".leaflet-control-layers-overlays")
        .append("label")
        .attr("id", "speciesLayersLabel")
        .attr("class", "layerHeading")
        .property("title", "Click to show layers")
        .html('<span> Species Outputs </span>');

      d3.select("#speciesLayersLabel")
        .insert("span", ":first-child")
        .attr("id", "speciesLayersGlyph")
        .attr("class", "glyphicon glyphicon-plus-sign")
        .attr("data-toggle", "collapse")
        .attr("data-target", "#speciesLayersDiv")
        .on("click", function() {resize(this); changeGlyph(this);});

      d3.select(".leaflet-control-layers-overlays")
        .append("div")
        .attr("class", "layerDiv")
        .property("id", "speciesLayersDiv")
        .style("margin-left", "15px")
        .attr("class", "collapse");

      speciesLayers.forEach(function(spp, i) {
        d3.select("#speciesLayersDiv")
          .append("label")
          .attr("id", speciesID[i] + "LayersLabel")
          .property("title", speciesTitles[i] + " (" + speciesNames[i] + ")")
          .html('<span> ' + speciesTitles[i] + ' </span>');

        d3.select("#" + speciesID[i] + "LayersLabel")
          .insert("span", ":first-child")
          .attr("id", speciesID[i]+ "LayersGlyph")
          .attr("class", "glyphicon glyphicon-plus-sign")
          .attr("data-toggle", "collapse")
          .attr("data-target", "#" + speciesID[i]+ "LayersDiv")
          .on("click", function() {changeGlyph(this);});

        d3.select("#speciesLayersDiv")
          .append("div")
          .attr("class", "layerDiv")
          .property("id", speciesID[i] + "LayersDiv")
          .style("margin-left", "30px")
          .attr("class", "collapse");

        spp.forEach(function(data, j) {
          d3.select("#" + speciesID[i]+ "LayersDiv")
            .append("label")
            .html('<input id="' + speciesID[i] + 'Layer-' + j + '" type="checkbox"></input><span> ' + layerExtTitles[j] + ' </span><span id="' + speciesID[i] + 'Legend-' + j + '" class="glyphicon glyphicon-modal-window label-glyph" data-title="' + speciesTitles[i] + '-' + layerExtTitles[j] + '" data-src="http://ecosheds.org:8080/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&LAYER=CL:' + speciesID[i] + layerExt[j] + '"></span><span id="' + speciesID[i] + 'Opacity-' + j + '" class="glyphicon glyphicon-certificate label-glyph" data-layer="' + j + '" data-species="' + i + '"></span>');

          d3.select("#" + speciesID[i]+ "Layer-" + j)
            .property("checked", false)
            .on("click", function() {layerToggle(this.checked, data); });

          d3.select("#" + speciesID[i] + "Legend-" + j)
            .property("title", "Hover to display layer legend")
            .datum(function() {return this.dataset; })
            .on("mouseover", function(d) { d3.select("#gsLegendHeader").text(d.title); d3.select("#gsLegendImg").attr("src", d.src); d3.select("#gsLegendDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); })
            .on("mouseout", function(d) { d3.select("#gsLegendDiv").style("display", "none"); 2});

          d3.select("#" + speciesID[i] + "Opacity-" + j)
            .property("title", "Hover to display layer opacity control when layer is added")
            .datum(function() {return this.dataset; })
            .on("mouseover", function(d) {
              if (d3.select("#" + speciesID[i]+ "Layer-" + d.layer).property("checked") == true) {
                d3.select("#gsOpacityRange")
                  .property("value", speciesLayers[d.species][d.layer].valueOf().options.opacity)
                  .property("title", speciesLayers[d.species][d.layer].valueOf().options.opacity)
                  .on("input", function() {
                    speciesLayers[d.species][d.layer].setOpacity(this.value); 
                    d3.select(this).property("title", this.value);
                  }); 
                d3.select("#gsOpacityHeader").text(speciesTitles[i] + "-" + layerExtTitles[j]); 
                d3.select("#gsOpacityDiv").style({"top": d3.event.pageY + "px", "right": "292px", "display": "inline-block"}); 
              }
            })


        });
      });


      //******Adjust max height of visible legend divs
      function resize(tmpGlyph) {
        var tmpDivs = [];
        if (d3.select(tmpGlyph).classed("glyphicon-plus-sign") == true) { displayCnt = 1; tmpDivs.push(tmpGlyph.id.replace("LayersGlyph", "")); } else { displayCnt = 0; }

        legendParts.forEach(function(part) {
          if (tmpGlyph.id.includes(part) == false) {
            if (d3.select("#" + part + "LayersGlyph").classed("glyphicon-minus-sign") == true) {
              displayCnt += 1;
              tmpDivs.push(part);
            }
          }
        });

        var labelHeight = document.getElementById(legendParts[0] + "LayersLabel").getBoundingClientRect().height * legendParts.length;
        var hrHeight = d3.selectAll(".leaflet-control-layers-separator")[0].length * 11;
        var formHeight = Number(window.getComputedStyle(document.getElementById("legendForm"), null).getPropertyValue("max-height").replace("px",""));
        var tmpMaxHeight = (formHeight - labelHeight - hrHeight - (legendParts.length * 5))/displayCnt;

        tmpDivs.forEach(function(div, i) { 
            d3.select("#" + div + "LayersDiv").style("max-height", tmpMaxHeight + "px");
        });
      }

}


      //******Turn map layers on and off
      function layerToggle(tmpCheck, layer) {
        if (tmpCheck == true) {
          map.addLayer(layer);
        }
        else {
          map.removeLayer(layer);
        }
      }



