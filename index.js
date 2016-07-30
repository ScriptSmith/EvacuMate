'use strict'
// Webhooks
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

//Geocoding
var geocoder = require('geocoder');

//Check if inside polygon
var geolib = require('geolib')

//List of locations
var locations = require('./locations.json');

//Check warnings
var FeedParser = require('feedparser')
var http = require('http')

//Check for infrastructure
var parse = require('csv-parse');
var https = require('https')

//Check SES data
var fs = require('fs')

// Port for webhook
app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})

// Main function
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        // console.log("~~~~~~~~~~~~~~~~~~~")
        // console.log(event)
        // console.log("~~~~~~~~~~~~~~~~~~~")

        if (event.optin && event.optin.ref == "index"){
            sendTextMessage(sender, "G'day!")
            sendTextMessage(sender, "Welcome to EvacuMate. During natural disasters, you can send me messages and I'll tell you about the status of a location.")
            sendTextMessage(sender, "Which location would you like to know about?")
        }

        if (event.message && event.message.text) {
            let text = event.message.text;

            // Geocode
            (function () {
                geocoder.geocode(text + " Queensland", function ( err, data ) {
                    // console.log("%%%%%%%%%%%%%%%%%%%")
                    // console.log(data)
                    // console.log("%%%%%%%%%%%%%%%%%%%")
                    if (data["results"].length < 1){
                        sendTextMessage(sender, text + " isn't a location that I understand")
                    } else {
                        var senderLocation = data["results"][0]["geometry"]["location"];
                        var newLocations = getLocations(senderLocation);

                        if (newLocations.length < 1){
                            sendTextMessage(sender, "There are no warnings in " + text)
                        } else {
                            sendMapMessage(sender, newLocations[0]["message"])

                            checkCommunityInfrastructure(sender,senderLocation);
                            checkWifiHotspots(sender,senderLocation);
                            checkSESBuildings(sender,senderLocation);
                        }
                    }
                }, {"key" : process.env.GMAPS_API});
            })();
        }

        if (event.message && !event.message.text) {
            sendMainMessage(sender)
        }


        if (event.postback && event.postback.payload == "warnings"){
            var req = request('http://www.bom.gov.au/fwo/IDZ00056.warnings_qld.xml')
              , feedparser = new FeedParser();

            req.on('error', function (error) {
              // handle any request errors
            });
            req.on('response', function (res) {
              var stream = this;

              if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

              stream.pipe(feedparser);
            });


            feedparser.on('error', function(error) {
              // always handle errors
            });
            feedparser.on('readable', function() {
              // This is where the action is!
              var stream = this
                , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                , item;

              while (item = stream.read()) {
                sendLinkMessage(sender,item["title"],item["link"]);
              }
            });
        }
    }
    res.sendStatus(200)
})

const token = "EAAYcrDXsQRIBAJHdyUwYu1jRJTJmaNHBFWjorn45swL0uRUy9ZBZB29MtzzB3V5shvXgzu3r7oIIJCzZBZCtiZCE7zCJ2vcgz3H8EJhuhZAY8wf0OKgyuFZAmZBkZBXYhVZCiaXWo74jFxnn0HqzP1W87SQPaNdvwEPywXvLWTDX5VvwZDZD"

function getLocations(senderLocation) {
    var returnedLocations = [];
    for (var i in locations) {
        var location = locations[i]
        for (var j in location["polygons"]){
            var polygon = location["polygons"][j];
            if (geolib.isPointInside({"latitude": senderLocation["lat"], "longitude": senderLocation["lng"]}, polygon)){
                returnedLocations.push(location);
            }
        }
    }
    return returnedLocations;
}


function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
}
function sendMapMessage(sender, text) {
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                      "type":"web_url",
                      "url":"http://evacumate.xyz/map.html",
                      "title":"View More"
                    }
                ]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
}
function sendLinkMessage(sender, text, link) {
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                      "type":"web_url",
                      "url": link,
                      "title":"Open link"
                    }
                ]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
}
function sendMainMessage(sender) {
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": "Options:",
                "buttons":[
                    {
                      "type":"web_url",
                      "url":"http://evacumate.xyz/map.html",
                      "title":"Show map"
                    },
                    {
                        "type":"postback",
                        "title":"Weather warnings",
                        "payload":"warnings"
                    }
                ]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
}

function checkCommunityInfrastructure(sender, location){
    var url = 'https://www.data.brisbane.qld.gov.au/data/dataset/d14761ac-9bd9-4712-aefd-4bace8ca7148/resource/31b0c6e9-2f13-4cc6-9b35-45a8d08c1b8f/download/community-halls-information-and-location.csv';

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

                sendLinkMessage(sender, "Your nearest Brisbane community centre is " + maximum["name"], "https://www.google.com/maps/?q=" + maximum["lat"] + "," + maximum['lng'])
            });
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}


function checkWifiHotspots(sender, location){
    var url = 'https://www.data.brisbane.qld.gov.au/data/dataset/17fb3724-ecfc-4802-8f16-62839fb73fc0/resource/9851b9fd-8a46-4268-9ece-4e45b143e8c9/download/WiFi-dataset-Open-data.csv';

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
                    var hotspot = output[i]

                    var name = hotspot[0]
                    var lat = parseFloat(hotspot[3])
                    var lng = parseFloat(hotspot[4])

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

                sendLinkMessage(sender, "Your nearest WiFi hotspot is " + maximum["name"], "https://www.google.com/maps/?q=" + maximum["lat"] + "," + maximum['lng'])
            });
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });

}

function checkSESBuildings(sender, location){

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
            sendLinkMessage(sender, "Your nearest State Emergency Service building is in " + maximum["name"], "https://www.google.com/maps/?q=" + maximum["lat"] + "," + maximum['lng'])
        });
    })
}




if (process.env.TESTING == 1){
    console.log("gotcha");
}
