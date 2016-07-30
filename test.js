'use strict'


//Geocoding
var geocoder = require('geocoder');

//List of locations
var locations = require('./locations.json');

var text = "15 Wunburra Circle";

// Geocode
(function () {
    geocoder.geocode(text, function ( err, data ) {
        var senderLocation = data["results"][0]["geometry"]["location"]
        console.log(getLocations(senderLocation));
    });
})();

function getLocations(senderLocation) {
    var returnedLocations = [];
    for (var i in locations) {
        var location = locations[i]
        for (var j in location){
            var boxes = location[j]
            for (var k in boxes){
                var box = boxes[k]
                if (senderLocation["lat"] >= box["minLat"] && senderLocation["lat"] <= box["maxLat"] && senderLocation["lng"] >= box["minLng"] && senderLocation["lng"] <= box["maxLng"]){
                    returnedLocations.push(location);
                }
            }
        }
    }
    return returnedLocations;
}
