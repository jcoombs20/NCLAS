L.Control.maxExtent = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-maxExtent');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () { map.setView(new L.LatLng(42.74, -72.83), 10); });

        var controlUI = L.DomUtil.create('div', 'leaflet-control-maxExtent-interior', controlDiv);
        controlUI.title = 'Zoom to Deerfield watershed extent';
        return controlDiv;
    }
});

L.control.maxExtent = function (options) {
    return new L.Control.maxExtent(options);
};