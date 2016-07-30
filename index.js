'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

//Geocoding
var geocoder = require('geocoder');

//List of locations
var locations = require('./locations.json');


var options = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyC5_74zprCJ8ZZdHJrNbTcGxl6nNdNRlsA', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

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
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text;
            console.log("~~~~~~~~~~ " + text)

            // Geocode
            (function () {
                geocoder.geocode(text, function ( err, data ) {
                    var senderLocation = data["results"][0]["geometry"]["location"];
                    console.log(getLocations(senderLocation));
                });
            })();
        }
    }
    res.sendStatus(200)
})

const token = "EAAYcrDXsQRIBAJHdyUwYu1jRJTJmaNHBFWjorn45swL0uRUy9ZBZB29MtzzB3V5shvXgzu3r7oIIJCzZBZCtiZCE7zCJ2vcgz3H8EJhuhZAY8wf0OKgyuFZAmZBkZBXYhVZCiaXWo74jFxnn0HqzP1W87SQPaNdvwEPywXvLWTDX5VvwZDZD"

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
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

if (process.env.TESTING == 1){
    console.log("gotcha")
}
