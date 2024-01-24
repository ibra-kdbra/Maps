// Success callback for getting geolocation
function handleGeolocationSuccess(position) {
  map.setView([position.coords.latitude, position.coords.longitude], 13);
  showNotification('Location obtained', 'Your location is being displayed on the map.');
}

// Error callback for getting geolocation
function handleGeolocationError(error) {
  console.error("Error occurred while fetching geolocation: ", error);
  switch(error.code) {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
  }
}

// Function to show a notification
function showNotification(title, message) {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    var notification = new Notification(title, { body: message });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(title, { body: message });
      }
    });
  }
}

// Use the Geolocation API to get the user's location
navigator.geolocation.getCurrentPosition(handleGeolocationSuccess, handleGeolocationError);
