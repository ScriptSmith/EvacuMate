var parse = require('csv-parse');
var https = require('https')
var geolib = require('geolib')


var url = 'https://www.data.brisbane.qld.gov.au/data/dataset/d14761ac-9bd9-4712-aefd-4bace8ca7148/resource/31b0c6e9-2f13-4cc6-9b35-45a8d08c1b8f/download/community-halls-information-and-location.csv';
var location = {
    "lat": -27.5007447,
    "lng": 153.020644
}

https.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        parse(body, {comment: '#'}, function(err, output){
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
                var lat = parseFloat(hall[1])
                var lng = parseFloat(hall[2])

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

            sendLinkMessage(sender, "Your nearest community centre is " + maximum["name"], "https://www.google.com/maps/?q=" + maximum["lat"] + "," + maximum['lng'])
        });
    });
}).on('error', function(e){
      console.log("Got an error: ", e);
});
