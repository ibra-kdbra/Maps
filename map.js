// Initialize the map
var map = L.map('map', {
  zoomControl: false
}).setView([51.505, -0.09], 13);

// Add the OSM tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);


map.on('contextmenu', function(e) {
  // Ask the user for a name for the marker
  var name = prompt('Enter a name for the marker:');
  if (name !== null) {
    // Add a marker at the clicked location
    var marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
      .bindPopup(name + '<button style="position: absolute; top: 0; right: 0;">x</button>')
      .openPopup();

    // Add an event listener for the delete button
    marker.on('popupopen', function() {
      var deleteButton = marker._popup._container.querySelector('button');
      deleteButton.addEventListener('click', function() {
        map.removeLayer(marker);
      });
    });

    // Add a 'dblclick' event listener to the marker
    marker.on('dblclick', function() {
      map.removeLayer(marker);
    });
  }
});


