L.Control.graph = L.Control.extend({
    options: {
        position: 'topright',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-graph');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function () { 
              if (d3.select("#filtersDiv").style("display") == "block") {
                d3.select("#filtersDiv").style("display", "none");
                d3.select("#chartControl").property("title", "Click to show charts window");
              }
              else {
                d3.select("#filtersDiv").style("display", "block");
                d3.select("#chartControl").property("title", "Click to hide charts window");
              }
            });

        var controlUI = L.DomUtil.create('div', 'leaflet-control-graph-interior', controlDiv);
        controlUI.id = "chartControl";
        controlUI.title = 'Click to show charts window';
        return controlDiv;
    }
});

L.control.graph = function (options) {
    return new L.Control.graph(options);
};