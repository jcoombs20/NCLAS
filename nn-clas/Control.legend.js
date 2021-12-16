L.Control.legend = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-legend');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () { 
            if (d3.select("#legendDiv").style("display") == "block") {
              d3.select("#legendDiv").style("display", "none");
              d3.select("#legendControl").property("title", "Click to show legend window");
            }
            else {
              d3.select("#legendDiv").style("display", "block");
              d3.select("#legendControl").property("title", "Click to hide legend window");
            }
            });

        var controlUI = L.DomUtil.create('div', 'leaflet-control-legend-interior', controlDiv);
        controlUI.id = "legendControl";
        controlUI.title = 'Click to hide legend window';
        return controlDiv;
    }
});

L.control.legend = function (options) {
    return new L.Control.legend(options);
};