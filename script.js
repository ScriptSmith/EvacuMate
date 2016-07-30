var styles =
[
    {
        "featureType": "landscape",
        "stylers": [
            {
                "hue": "#FFA800"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.highway",
        "stylers": [
            {
                "hue": "#53FF00"
            },
            {
                "saturation": -73
            },
            {
                "lightness": 40
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "stylers": [
            {
                "hue": "#FBFF00"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.local",
        "stylers": [
            {
                "hue": "#00FFFD"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 30
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "water",
        "stylers": [
            {
                "hue": "#00BFFF"
            },
            {
                "saturation": 6
            },
            {
                "lightness": 8
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "hue": "#679714"
            },
            {
                "saturation": 33.4
            },
            {
                "lightness": -25.4
            },
            {
                "gamma": 1
            }
        ]
    }
]


function initMap() {
    var infoWindow;

    function info(details){
        var contentString = "<b>" + details["name"] + "</b><br>" +
        "<i>" + details["details"] + "</i><<br>" +
        details["message"]

        infoWindow.setContent(contentString);
        infoWindow.open(map);
    }

    $.getJSON("./locations.json", function(data) {
        for (var g in data){
            affectedArea = data[g]
            for (var h in affectedArea["polygons"]){
                polygon = affectedArea["polygons"][h]

                for (var i in polygon){
                    polygon[i]["lat"] = polygon[i]["latitude"];
                    polygon[i]["lng"] = polygon[i]["longitude"];
                    delete polygon[i]["latitude"]
                    delete polygon[i]["longitude"]
                }

                var poly = new google.maps.Polygon({
                    paths: polygon,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35
                });
                poly.setMap(map);

                poly.addListener('click', info(data[g]))
            }
        }



    })


    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: {lat: -27.4999514, lng: 153.0154763}
    });

    map.setOptions({styles: styles});

    infoWindow = new google.maps.InfoWindow();

}
