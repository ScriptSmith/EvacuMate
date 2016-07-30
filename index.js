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
        console.log(event)
        if (event.message && event.message.text) {
            let text = event.message.text;
            console.log("~ Message: '" + text + "'");

            // Geocode
            (function () {
                geocoder.geocode(text, function ( err, data ) {
                    if (data["results"].length < 1){
                        sendTextMessage(sender,text + " isn't a location I understand")
                    } else {
                        var senderLocation = data["results"][0]["geometry"]["location"];
                        var newLocations = getLocations(senderLocation);

                        if (newLocations.length < 1){
                            sendTextMessage(sender, "No warnings for " + text)
                        } else {
                            sendTextMessage(sender, newLocations[0]["message"])
                        }
                    }
                });
            })();
        }
        if (event.optin && event.optin.ref == "index"){
            sendTextMessage(sender, "Welcome to EvacuMate. During natural disasters, you can send me messages and I'll tell you about the status of a location.")
            sendTextMessage(sender, "Which location would you like to know about?")
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
            var polygons = location[j]["polygons"];
            for (var k in polygons){
                var polygon = polygons[k]
                console.log('poly')
                console.log(polygon)
                if (geolib.isPointInside({"latitude": senderLocation["lat"], "longitude": senderLocation["lng"]}, polygon)){
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
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
}

if (process.env.TESTING == 1){
    console.log("gotcha");
}
