// Element.prototype.hide = function(){
//     this.style.display = 'none';
// }

// Element.prototype.show = function() {
//     this.style.display = '';
// }



// Initialize the map
function initMap() {
    // Create a map object
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7128, lng: -74.0060}, // New York City coordinates
      zoom: 12
    });
  
    // Add a marker to the map
    var marker = new google.maps.Marker({
      position: {lat: 40.7128, lng: -74.0060},
      map: map,
      title: 'New York City'
    });
  }
  
  // Load the Google Maps API
  function loadMapScript() {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap';
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
  }
  
  // Call the loadMapScript function to load the map
  loadMapScript();
  

  // Note: To use the Google Maps API, you need to sign up for a Google Cloud account and enable the Maps JavaScript API. 
  // You will also need to obtain an API key and replace 'YOUR_API_KEY' with your actual API key in the JavaScript code.