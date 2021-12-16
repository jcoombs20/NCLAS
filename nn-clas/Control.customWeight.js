L.Control.customWeight = L.Control.extend({
    options: {
        position: 'topright',
        collapsed: true
    },

    onAdd: function (map) {
        this._map = map;
        var className = 'leaflet-control-customWeight';
        var container = this._container = L.DomUtil.create('div', className);
        container.id = "prioritization";
        L.DomEvent.disableClickPropagation(container);

        //******Ecological Connectivity
        var weights = L.DomUtil.create('div', className + '-div');
        weights.id = "priorWeights";

        //******Ecological Connectivity
        var eco = L.DomUtil.create('div', className + '-div');
        eco.id = "eco";

        //******Transportation Connectivity 
        var transport = L.DomUtil.create('div', className + '-div');
        transport.id = "transport";

        //******Update 
        var update = L.DomUtil.create('div', className + '-div');
        update.id = "priorUpdate";

        if (this.options.collapsed) {
            L.DomEvent.on(container, 'mouseover', this._expand, this);
            L.DomEvent.on(container, 'mouseout', this._collapse, this);

            var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
            link.href = '#';
            link.title = 'prioritization';

            L.DomEvent.on(link, L.Browser.touch ? 'click' : 'focus', this._expand, this);

            this._map.on('movestart', this._collapse, this);
        } else {
            this._expand();
        }

        container.appendChild(weights);
        container.appendChild(eco);
        container.appendChild(transport);
        container.appendChild(update);

        return container;
    },

    _expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-customWeight-expanded');
    },

    _collapse: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-control-customWeight-expanded');
    }

});

L.control.customWeight = function (options) {
    return new L.Control.customWeight(options);
};




//******Notify user when metric has been updated
function addAlert(tmpText) {
  d3.select("body")
    .append("div")
    .attr("id", "addWeightContainer")
    .append("div")
    .attr("id", "addWeight")
    .append("p")
    .attr("id", "addWeightP")
    .text(tmpText);

  d3.select("#addWeight")
    .append("button")
    .attr("class", "addWeightButton")
    .text("OK")
    .on("click", function() { d3.select("#addWeightContainer").remove(); });
}




//******Add prioritization html elements
function completePrioritization() {
  //******Add title information
  d3.select("#priorWeights")
    .append("div")
    .append("h4")
    .attr("id", "priorTitle")
    .attr("class", "legTitle")
    .text("Stream Crossing Prioritization")
    .property("title", "Create a custom-weighted stream crossing metric based on chosen ecological and transportation connectivity measures for use in prioritization decisions")
    .append("span")
    .html('<span id="testTT" class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Stream Crossing Prioritization</center></b></u></p><p>Enables the user to create a custom-weighted stream crossing metric based on chosen ecological and transportation connectivity measures for use in prioritization decisions</p>"></span>');

  //******Add ecological connectivity
  d3.select("#eco")
    .append("div")
    .attr("class", "horBorder")
    .attr("id", "connectEco")
    .append("input")
    .attr({type: "number", name: "priorWeight", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "ecoWeight")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance of the ecological connectivity value in calculation of prioritization metric");

  d3.select("#connectEco")
    .append("label")
    .attr("class", "priorTitle")
    .attr("id", "ecoConnTitle")
    .text("Ecological Connectivity")
    .property("title", "Enter a relative weight of importance for the selected measure of ecological connectivity in the calculation of the prioritization metric")
    .append("span")
    .html('<span class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Ecological Connectivity</center></b></u></p><p>Enables the user to enter a relative weight of importance for the selected ecological connectivity measure in the calculation of the prioritazation metric</p>"></span>');

  d3.select("#ecoConnTitle")
    .append("span")
    .attr("class", "glyphicon glyphicon-minus-sign pull-right minimize-button")
    .attr("id", "ecoGlyph")
    .style("margin-left", "10px")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#ecoDiv")
    .property("title", "Click to minimize panel")
    .on("click", function() { changeGlyph(this); });

  d3.select("#eco")
    .append("div")
    .attr("id", "ecoDiv")
    .attr("class", "collapse in")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnPassage")
    .append("input")
    .attr({type: "radio", name: "ecoConn", value: "Passage Score", id: "passRadio", checked: true})
    .property("title", "Aquatic passability score of stream crossing")
    .attr("class", "priorRadio")
    .on("change", function() {if (d3.select('input[name="ecoConn"]:checked').property("value") == "Cold Water Connectivity Restoration Potential") { $('#coldWaterDiv').collapse('show'); } else { $('#coldWaterDiv').collapse('hide'); } });

  d3.select("#ecoConnPassage")
    .append("label")
    .text("Passage Score")
    .property("title", "Aquatic passability score of stream crossing")
    .attr("class", "priorLabel")
    .attr("for", "passRadio");

  d3.select("#ecoDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnRestPot")
    .append("input")
    .attr({type: "radio", name: "ecoConn", value: "Connectivity Restoration Potential", id: "restRadio"})
    .property("title", "Need definition from Scott")
    .attr("class", "priorRadio")
    .on("change", function() {if (d3.select('input[name="ecoConn"]:checked').property("value") == "Cold Water Connectivity Restoration Potential") { $('#coldWaterDiv').collapse('show'); } else { $('#coldWaterDiv').collapse('hide'); } });

  d3.select("#ecoConnRestPot")
    .append("label")
    .text("Connectivity Restoration Potential")
    .property("title", "Need definition from Scott")
    .attr("class", "priorLabel")
    .attr("for", "restRadio");

  d3.select("#ecoDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWater")
    .append("input")
    .attr({type: "radio", name: "ecoConn", value: "Cold Water Connectivity Restoration Potential", id: "coldRadio"})
    .property("title", "Need definition from Scott")
    .attr("class", "priorRadio")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#coldWaterDiv")
    .on("change", function() {if (d3.select('input[name="ecoConn"]:checked').property("value") == "Cold Water Connectivity Restoration Potential") { $('#coldWaterDiv').collapse('show'); } else { $('#coldWaterDiv').collapse('hide'); } });

  d3.select("#ecoConnColdWater")
    .append("label")
    .text("Cold Water Connectivity Restoration Potential")
    .property("title", "Need definition from Scott")
    .attr("class", "priorLabel")
    .attr("for", "coldRadio");

  d3.select("#ecoConnColdWater")
    .append("div")
    .attr("id", "coldWaterDiv")
    .attr("class", "collapse")
    .append("div")
    .attr("id", "tempThreshDiv")
    .append("div")
    .attr("class", "horBorder")
    .append("h5")
    .attr("id", "tThreshTitle")
    .attr("class", "legTitle")
    .text("Threshold")
    .property("title", "The maximum water temperature value (celsius) for which to infer connectivity among stream reaches");
    
  d3.select("#tempThreshDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterTemp16")
    .append("input")
    .attr({type: "radio", name: "ecoConnTemp", value: "16", id: "tempRadio16"})
    .property("title", "16 degrees celsius")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterTemp16")
    .append("label")
    .text("16")
    .property("title", "16 degrees celsius")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio16");
    
  d3.select("#tempThreshDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterTemp18")
    .append("input")
    .attr({type: "radio", name: "ecoConnTemp", value: "18", id: "tempRadio18", checked: true})
    .property("title", "18 degrees celsius")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterTemp18")
    .append("label")
    .text("18")
    .property("title", "18 degrees celsius")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio18");

  d3.select("#tempThreshDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterTemp20")
    .append("input")
    .attr({type: "radio", name: "ecoConnTemp", value: "20", id: "tempRadio20"})
    .property("title", "20 degrees celsius")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterTemp20")
    .append("label")
    .text("20")
    .property("title", "20 degrees celsius")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio20");
   
  d3.select("#coldWaterDiv")
    .append("div")
    .attr("id", "tempYearDiv")
    .append("div")
    .attr("class", "horBorder")
    .append("h5")
    .attr("id", "tYearTitle")
    .attr("class", "legTitle")
    .text("Year")
    .property("title", "Year for which to infer connectivity among stream reaches based on selected water temperature threshold value");

  d3.select("#tempYearDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterYear2016")
    .append("input")
    .attr({type: "radio", name: "ecoConnYear", value: "2016", id: "tempRadio2016", checked: true})
    .property("title", "Year 2016")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterYear2016")
    .append("label")
    .text("2016")
    .property("title", "Year 2016")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio2016");

  d3.select("#tempYearDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterYear2050")
    .append("input")
    .attr({type: "radio", name: "ecoConnYear", value: "2050", id: "tempRadio2050"})
    .property("title", "Year 2050")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterYear2050")
    .append("label")
    .text("2050")
    .property("title", "Year 2050")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio2050");

  d3.select("#tempYearDiv")
    .append("div")
    .attr("class", "priorDiv")
    .attr("id", "ecoConnColdWaterYear2080")
    .append("input")
    .attr({type: "radio", name: "ecoConnYear", value: "2080", id: "tempRadio2080"})
    .property("title", "Year 2080")
    .attr("class", "priorRadio");

  d3.select("#ecoConnColdWaterYear2080")
    .append("label")
    .text("2080")
    .property("title", "Year 2080")
    .attr("class", "priorLabel")
    .attr("for", "tempRadio2080");





  //******Transportation Connectivity
  d3.select("#transport")
    .append("div")
    .attr("class", "horBorder")
    .attr("id", "connectTrans")
    .append("input")
    .attr({type: "number", name: "priorWeight", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "transWeight")
    .attr("class", "priorInput")
    .property("title", "Relative weight of transportation connectivity value in calculation of prioritization metric");

  d3.select("#connectTrans")
    .append("label")
    .attr("id", "transConnTitle")
    .attr("class", "priorTitle")
    .text("Transportation Connectivity")
    .property("title", "Enter a relative weight of importance for the selected measures of transportation connectivity in the calculation of the prioritization metric")
    .append("span")
    .html('<span id="testTT" class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Transportation Connectivity</center></b></u></p><p>Enables the user to enter a relative weight of importance for the selected traffic disruption and crossing risk of failure measures in the calculation of the prioritazation metric</p>"></span>');

  d3.select("#transConnTitle")
    .append("span")
    .attr("class", "glyphicon glyphicon-minus-sign pull-right minimize-button")
    .attr("id", "transGlyph")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#transDiv")
    .property("title", "Click to minimize panel")
    .on("click", function() { changeGlyph(this); });




  //******Disruption
  d3.select("#transport")
    .append("div")
    .attr("id", "transDiv")
    .attr("class", "collapse in")
    .append("div")
    .attr("id", "disrupt")
    .append("div")
    .attr("class", "connectDiv")
    .attr("id", "transConnDisruptTitle")
    .append("input")
    .attr({type: "number", name: "priorWeight", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "transDisruptWeight")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance for the selected traffic disruption measure in calculation of the transportation connectivity metric");

  d3.select("#transConnDisruptTitle")
    .append("label")
    .attr("id", "disruptTitle")
    .attr("class", "priorHeader")
    .text("Disruption")
    .property("title", "Enter a relative weight of importance for the selected stream crossing traffic disruption measure in the calculation of the transportation connectivity metric")
    .append("span")
    .html('<span class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Traffic Disruption</center></b></u></p><p>Enables the user to choose a traffic disruption measure for each stream crossing and weight its importance for calculation of transportation metric.</p>"></span>');

  d3.select("#disruptTitle")
    .append("span")
    .attr("class", "glyphicon glyphicon-minus-sign pull-right minimize-button")
    .attr("id", "disruptGlyph")
    .style("margin-left", "10px")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#disruptInput")
    .property("title", "Click to minimize panel")
    .on("click", function() { changeGlyph(this); });

  d3.select("#disrupt")
    .append("div")
    .attr("id", "disruptInput")
    .attr("class", "collapse in")
    .append("div")
    .attr("id", "disruptTotal")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "radio", name: "transConnDisrupt", value: "Total", id: "transConnDisruptTotal"})
    .property("title", "Total time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorRadio");

  d3.select("#disruptTotal")
    .append("label")
    .text("Total")
    .property("title", "Total time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorLabel")
    .attr("for", "transConnDisruptTotal");
   
  d3.select("#disruptInput")
    .append("div")
    .attr("id", "disruptAve")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "radio", name: "transConnDisrupt", value: "Average", id: "transConnDisruptAve"})
    .property("title", "Average time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorRadio");

  d3.select("#disruptAve")
    .append("label")
    .text("Average")
    .property("title", "Average time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorLabel")
    .attr("for", "transConnDisruptAve");

  d3.select("#disruptInput")
    .append("div")
    .attr("id", "disruptMax")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "radio", name: "transConnDisrupt", value: "Maximum", id: "transConnDisruptMax", checked: true})
    .property("title", "Maximum time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorRadio");

  d3.select("#disruptMax")
    .append("label")
    .text("Maximum")
    .property("title", "Maximum time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorLabel")
    .attr("for", "transConnDisruptMax");

  d3.select("#disruptInput")
    .append("div")
    .attr("id", "disruptComposite")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "radio", name: "transConnDisrupt", value: "Composite", id: "transConnDisruptComposite"})
    .property("title", "Combined total and maximum time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorRadio");

  d3.select("#disruptComposite")
    .append("label")
    .text("Composite")
    .property("title", "Combined total and maximum time of delay (minutes) to traffic if crossing was compromised") 
    .attr("class", "priorLabel")
    .attr("for", "transConnDisruptComposite");




  //******Risk of Failure
  d3.select("#transDiv")
    .append("div")
    .attr("id", "rof")
    .append("div")
    .attr("class", "connectDiv")
    .attr("id", "transConnRofTitle")
    .append("input")
    .attr({type: "number", name: "priorWeight", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "transRofWeight")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance for the selected risk of failure (ROF) measure in calculation of transportation connectivity metric");

  d3.select("#transConnRofTitle")
    .append("label")
    .attr("id", "rofTitle")
    .attr("class", "priorHeader")
    .text("Risk Of Failure")
    .property("title", "Enter a relative weight of importance for the selected stream crossing risk of failure (ROF) measure in the calculation of the transportation connectivity metric")
    .append("span")
    .html('<span class="glyphicon glyphicon-info-sign help-tooltip pull-right" data-toggle="tooltip" data-placement="left" title="" data-html="true" data-original-title="<p><u><b><center>Risk of Failure</center></b></u></p><p>Enables the user to select the maximum risk-of-failure (ROF) value for each stream crossing or create a custom weighted value based on its hydrologic, structural, and geomorphic ROF scores.</p>"></span>');

  d3.select("#rofTitle")
    .append("span")
    .attr("class", "glyphicon glyphicon-minus-sign pull-right minimize-button")
    .attr("id", "rofGlyph")
    .style("margin-left", "10px")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#rofInput")
    .property("title", "Click to minimize panel")
    .on("click", function() { changeGlyph(this); });

  d3.select("#rof")
    .append("div")
    .attr("id", "rofInput")
    .attr("class", "collapse in")
    .append("div")
    .attr("id", "rofInputMax")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "radio", name: "transConnRofInput", value: "Maximum", id: "transConnRofMax", checked: true})
    .property("title", "Maximum hydrologic, structural, or geomorphic risk of failure (ROF) value for a stream crossing") 
    .attr("class", "priorRadio")
    .on("change", function() {if (d3.select('input[name="transConnRofInput"]:checked').property("value") == "Weighted") { $('#rofWeights').collapse('show'); } else { $('#rofWeights').collapse('hide'); } });

  d3.select("#rofInputMax")
    .append("label")
    .text("Maximum")
    .property("title", "Maximum hydrologic, structural, or geomorphic risk of failure (ROF) value for a stream crossing") 
    .attr("class", "priorLabel")
    .attr("for", "transConnRofMax");

  d3.select("#rofInput")
    .append("div")
    .attr("id", "rofInputWeight")
    .attr("class", "priorDiv")
    .append("input")
    .attr("data-toggle", "collapse")
    .attr("data-target", "#rofWeights")
    .attr({type: "radio", name: "transConnRofInput", value: "Weighted", id: "transConnRofWeight"})
    .property("title", "Custom weighted hydrologic, structural, and geomorphic risk of failure (ROF) value for a stream crossing") 
    .attr("class", "priorRadio")
    .on("change", function() {if (d3.select('input[name="transConnRofInput"]:checked').property("value") == "Weighted") { $('#rofWeights').collapse('show'); } else { $('#rofWeights').collapse('hide'); } });

  d3.select("#rofInputWeight")
    .append("label")
    .text("Weighted")
    .property("title", "Custom weighted hydrologic, structural, and geomorphic risk of failure (ROF) value for a stream crossing") 
    .attr("class", "priorLabel")
    .attr("for", "transConnRofWeight");




  d3.select("#rofInputWeight")
    .append("div")
    .attr("id", "rofWeights")
    .attr("class", "collapse")
    .append("div")
    .attr("id", "rofInputs")
    .append("div")
    .attr("id", "hydroDiv")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "number", name: "ROF", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "hydroROF")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance of hydrologic risk of failure (ROF) value in calculation of the weighted ROF metric");

  d3.select("#hydroDiv")
    .append("label")
    .attr("class", "priorLabel")
    .text("Hydrologic")
    .property("title", "Relative weight of importance of hydrologic risk of failure (ROF) value in calculation of the weighted ROF metric");

  d3.select("#rofInputs")
    .append("div")
    .attr("id", "structDiv")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "number", name: "ROF", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "structROF")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance of structural risk of failure (ROF) value in calculation of the weighted ROF metric");

  d3.select("#structDiv")
    .append("label")
    .attr("class", "priorLabel")
    .text("Structural")
    .property("title", "Relative weight of importance of structural risk of failure (ROF) value in calculation of the weighted ROF metric");

  d3.select("#rofInputs")
    .append("div")
    .attr("id", "geomorphDiv")
    .attr("class", "priorDiv")
    .append("input")
    .attr({type: "number", name: "ROF", value: 1, size: 2, min: 0, step: 1})
    .attr("id", "geomorphROF")
    .attr("class", "priorInput")
    .property("title", "Relative weight of importance of geomorphic risk of failure (ROF) value in calculation of the weighted ROF metric");

  d3.select("#geomorphDiv")
    .append("label")
    .attr("class", "priorLabel")
    .text("Geomorphic")
    .property("title", "Relative weight of importance of geomorphic risk of failure (ROF) value in calculation of the weighted ROF metric");

  //******Updating elements
  d3.select("#priorUpdate")
    .append("hr")
    .attr("class", "priorHR");

  d3.select("#priorUpdate")
    .append("button")
    .text("Update")
    .property("title", "Click to update all priority metrics")
    .attr("class", "priorButton")
    .on("click", function() {createNewMetric();} );

}


function createNewMetric() {
  //get weights
  var hROF = Number(d3.select("#hydroROF").property("value"));
  var sROF = Number(d3.select("#structROF").property("value"));
  var gROF = Number(d3.select("#geomorphROF").property("value"));

  //******Add weighted ROF variable option to keys, legend select box, and histogram select box
  var tmpKey = "ROF_" + hROF + "-" + sROF + "-" + gROF;
  if (topos.crossings.keys.indexOf(tmpKey) == -1) {
    topos.crossings.keys.push(tmpKey);
    topos.crossings.title[tmpKey] = "ROF " + hROF + ":" + sROF + ":" + gROF;
    topos.crossings.unit[tmpKey] = "";
    topos.crossings.tooltip[tmpKey] = "Combined risk of failure (ROF) score (0 = Good, 1 = Poor) for a stream crossing with hydrologic, structural, and geomorphic ROF weightings of " + hROF + ", " + sROF + ", and " + gROF; 
    topos.crossings.direction[tmpKey] = "reverse";
    topos.crossings.covType[tmpKey] = "number";
    topos.crossings.data_type[tmpKey] = "decimal";
    topos.crossings.scale[tmpKey] = "linear";
    topos.crossings.conversion[tmpKey] = {};

    d3.select("#crossingsSelect")
      .append("option")
      .attr("value", tmpKey)
      .text(topos.crossings.title[tmpKey]);
 
    if (d3.select("#layerFilterSelect").node().value == "crossings") {
      d3.select("#attributeFilterSelect")
        .append("option")
        .attr("value", tmpKey)
        .text(topos.crossings.title[tmpKey]);
    }
  }
  else {
    addAlert("This weighting combination has previously been used and is already present as an attribute option");
    return;
  }

  //******Calculate weighted ROF value
  var sumWeight = gROF + hROF + sROF;

  gROF = gROF/sumWeight;
  hROF = hROF/sumWeight;
  sROF = sROF/sumWeight;

  for (var i=0; i<crossingCov.length; i++) {
    crossingCov[i][tmpKey] = crossingCov[i].geo_rof*gROF + crossingCov[i].hydro_rof*hROF + crossingCov[i].struct_rof*sROF;
  };


  //******Find max value
  topos.crossings.max[tmpKey] = d3.max(crossingCov, function(d) {return d[tmpKey];});

  //******Add new weighted ROF to crossfilter
  cfDimension(topos.crossings, crossingCov);

  //******Add new weighted ROF to topoJSON
  var tmpMap = d3.map(crossingCov, function(d) {return d[topos.crossings.uniqueID];});

  topos.crossings.features.forEach(function(d) { 
    d.properties[tmpKey] = tmpMap.get(d.id)[tmpKey];
  });
  
  addAlert("A custom weighted condition attribute has been added to the 'Crossings' options in both the Legend and Charts windows");  
}
