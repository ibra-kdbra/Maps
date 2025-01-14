// Import the polyline library
var polyline = require('@mapbox/polyline');

// Basic routing feature
var routeButton = document.getElementById('route-button');
routeButton.addEventListener('click', function() {
  var fromInput = document.getElementById('from-input').value;
  var toInput = document.getElementById('to-input').value;
  if (fromInput !== '' && toInput !== '') {
    // Use the Mapbox Directions API to get directions
    // Replace 'your-mapbox-access-token' with your actual Mapbox access token
    var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + encodeURIComponent(fromInput) + ';' + encodeURIComponent(toInput) + '?access_token=your-mapbox-access-token';
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.routes.length > 0) {
          var route = data.routes[0];
          // Decode the route geometry
          var routeGeometry = polyline.toGeoJSON(route.geometry);
          // Add the route to the map
          var routeLayer = L.geoJSON(routeGeometry).addTo(map);

          // Prepare the information to display
          var info = 'Distance: ' + route.distance + ' meters, ' +
                     'Duration: ' + route.duration + ' seconds';

          // Bind a popup to the route layer with the information
          routeLayer.bindPopup(info).openPopup();
        } else {
          alert('Route not found');
        }
      })
      .catch(function(error) {
        console.log('Error:', error);
      });
  }
});
