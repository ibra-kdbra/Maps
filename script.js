// Initialize the map
var map = L.map('map', {
  zoomControl: false
}).setView([51.505, -0.09], 13);

// Add the OSM tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

// Add a marker to the map
L.marker([51.5, -0.09]).addTo(map)
  .bindPopup('A marker on the map.')
  .openPopup();

// Search for a location
var searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', function() {
  var searchInput = document.getElementById('search-input').value;
  if (searchInput !== '') {
    var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(searchInput);
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.length > 0) {
          var latlng = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          map.flyTo(latlng, 13, {
            duration: 0.5
          });
          L.marker(latlng).addTo(map)
            .bindPopup(data[0].display_name)
            .openPopup();
        } else {
          alert('Location not found');
        }
      })
      .catch(function(error) {
        console.log('Error:', error);
      });
  }
});

// Dark mode toggle
var darkModeButton = document.getElementById('dark-mode-button');
darkModeButton.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  darkModeButton.querySelector('i').classList.toggle('fa-sun');
});
