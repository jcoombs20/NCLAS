L.Control.attributes = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-attributes');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function () {
              if (d3.select("#attributesDiv").style("display") == "block") {
                d3.select("#attributesDiv").style("display", "none");
                d3.select("#attributesControl").property("title", "Click to show feature attributes window");
              }
              else {
                d3.select("#attributesDiv").style("display", "block");
                d3.select("#attributesControl").property("title", "Click to hide feature attributes window");
              }
            });


        var controlUI = L.DomUtil.create('div', 'leaflet-control-attributes-interior', controlDiv);
        controlUI.id = "attributesControl";
        controlUI.title = 'Click to show feature attributes window';
        return controlDiv;
    }
});

L.control.attributes = function (options) {
    return new L.Control.attributes(options);
};