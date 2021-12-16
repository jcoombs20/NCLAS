L.Control.maxExtent = L.Control.extend({
    options: {
        position: 'topright',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-maxExtent');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () { //map.setView(new L.LatLng(44, -81.5), 6); });
          map.fitBounds([[24.5,-140],[50.7,-63]]);
/*
          if(window.innerWidth > 1900) {
            map.setView(new L.LatLng(43.5, -80), 6);
          }
          else {
            map.setView(new L.LatLng(40, -78), 5);
          }
*/
        });


        var controlUI = L.DomUtil.create('div', 'leaflet-control-maxExtent-interior', controlDiv);
        controlUI.title = 'Zoom to full extent';
        return controlDiv;
    }
});

L.control.maxExtent = function (options) {
    return new L.Control.maxExtent(options);
};