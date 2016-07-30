var geocoder = require('geocoder');

// Geocoding
geocoder.geocode("15 Wunburra CIrcle", function ( err, data ) {
  console.log(data["results"][0]["geometry"])
});
