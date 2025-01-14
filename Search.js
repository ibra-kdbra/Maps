// Search for a location
var searchButton = document.getElementById('search-button');
var searchInput = document.getElementById('search-input');

// Function to execute the search
function executeSearch() {
  var inputValue = searchInput.value;
  if (inputValue !== '') {
    var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(inputValue);
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
}

// Event listener for the search button
searchButton.addEventListener('click', executeSearch);

// Event listener for the 'Enter' key in the search input field
searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    executeSearch();
  }
});