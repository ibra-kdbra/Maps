// Initialize the map
var map = L.map('map', {
  zoomControl: false
}).setView([51.505, -0.09], 13);

// Add the OSM tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

// Array to store the added markers
var markers = [];

// Function to handle the right-click event
function handleRightClick(event) {
  if (event.originalEvent.button === 2) {
    // Check if the right mouse button was clicked
    var marker = L.marker(event.latlng).addTo(map);
    var latLngText = "(" + event.latlng.lat.toFixed(6) + ", " + event.latlng.lng.toFixed(6) + ")";
    var description = prompt("Enter marker description:");

    // Prompt user for marker description
    marker.bindPopup('<div>' + description + '<br>Location: ' + latLngText + '</div>').openPopup();

    // Add the marker to the markers array
    markers.push(marker);
  }
}

// Event listener for the delete key press
document.addEventListener('keydown', function (event) {
  if (event.code === 'Delete') {
    if (markers.length > 0) {
      var lastMarker = markers[markers.length - 1];
      removeMarker(lastMarker);
    }
  }
});

// Event listener for double right-click
var rightClickTimer = null;
document.addEventListener('mousedown', function (event) {
  if (event.button === 2) {
    if (rightClickTimer === null) {
      rightClickTimer = setTimeout(function () {
        clearTimeout(rightClickTimer);
        rightClickTimer = null;
      }, 500);
    } else {
      clearTimeout(rightClickTimer);
      rightClickTimer = null;
      if (markers.length > 0) {
        var lastMarker = markers[markers.length - 1];
        removeMarker(lastMarker);
      }
    }
  }
});

function removeMarker(marker) {
  marker.remove();
  var markerIndex = markers.indexOf(marker);
  if (markerIndex > -1) {
    markers.splice(markerIndex, 1);
  }
}


// Event listener for the right-click event
map.on('contextmenu', handleRightClick);

// Search for a location
var searchButton = document.getElementById('search-button');
var searchInput = document.getElementById('search-input');

// Add event listener for 'click' event on search button
searchButton.addEventListener('click', searchLocation);

// Add event listener for 'keydown' event on search input
searchInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    searchLocation();
  }
});

function searchLocation() {
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
          var marker = L.marker(latlng).addTo(map);
          marker.bindPopup(data[0].display_name).openPopup();
          markers.push(marker);
        } else {
          alert('Location not found');
        }
      })
      .catch(function(error) {
        console.log('Error:', error);
      });
  }
}


// Add geolocation
var locateButton = document.getElementById('geolocation-button');

// Add event listener for 'click' event on locate button
locateButton.addEventListener('click', locateAddress);

function locateAddress() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var latlng = [position.coords.latitude, position.coords.longitude];
      map.flyTo(latlng, 13, {
        duration: 0.5
      });
      var marker = L.marker(latlng).addTo(map);
      marker.bindPopup('Your current location').openPopup();
      markers.push(marker);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}


// Dark mode toggle
var darkModeButton = document.getElementById('dark-mode-button');
darkModeButton.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  darkModeButton.querySelector('i').classList.toggle('fa-sun');
});

// // Loading the map 
// document.addEventListener('DOMContentLoaded', function() {
//   const sidePanel = document.getElementById('side-panel');

//   document.addEventListener('mouseover', function(event) {
//     if (!sidePanel.contains(event.target)) {
//       sidePanel.style.opacity = '0';
//     }
//   });

//   document.addEventListener('mouseout', function(event) {
//     if (!sidePanel.contains(event.target)) {
//       sidePanel.style.opacity = '0';
//     }
//   });
// });
