L.Control.political = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-political');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () { 
            if (d3.select("#polFilterDiv").style("display") == "block") {
              d3.select("#polFilterDiv").style("display", "none");
              d3.select("#polFilterControl").property("title", "Click to show filter window");
            }
            else {
              d3.select("#polFilterDiv").style("display", "block");
              d3.select("#polFilterControl").property("title", "Click to hide filter window");
            }
            });

        var controlUI = L.DomUtil.create('div', 'leaflet-control-political-interior', controlDiv);
        controlUI.id = "polFilterControl";
        controlUI.title = 'Click to show filter window';
        return controlDiv;
    }
});

L.control.political = function (options) {
    return new L.Control.political(options);
};