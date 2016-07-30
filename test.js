var parse = require('csv-parse');
var fs = require('fs');
var geolib = require('geolib');

fs.readFile('./QldSESGroupLocations.csv', 'utf8', function(err, contents){
    parse(contents, {comment: '#'}, function(err, output){
        output = output.slice(1, output.length + 1)

        var maximum = {
            name: "None",
            lat: -27.509489,
            lng: 153.03389,
            distance: 100000
        }

        for (var i in output){
            var hall = output[i]

            var name = hall[0]
            var lat = parseFloat(hall[2])
            var lng = parseFloat(hall[3])

            var distance = geolib.getDistance(
                {latitude: lat, longitude: lng},
                {latitude: location["lat"], longitude: location["lng"]}
            )

            if (distance < maximum["distance"]){
                maximum["name"] = name
                maximum["lat"] = lat
                maximum["lng"] = lng
                maximum["distance"] = distance
            }

        }
        sendLinkMessage(sender, "Your nearest State Emergency Service is in " + maximum["name"], "https://www.google.com/maps/?q=" + maximum["lat"] + "," + maximum['lng'])
    });
})
