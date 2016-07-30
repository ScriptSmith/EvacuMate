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

    var heatMapData = [];

    function getHeatMapData(){
        return heatMapData;
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

                poly.objDetails = data[g];
                poly.latLng = polygon[0];

                poly.addListener('click', function(){
                    var contentString = "<b>" + this.objDetails["name"] + "</b><br>" +
                    "<i>" + this.objDetails["details"] + "</i><br>" +
                    this.objDetails["message"]

                    infoWindow.setContent(contentString);
                    infoWindow.setPosition(this.latLng);
                    infoWindow.open(map);
                })
            }
        }
    })


    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: {lat: -27.4999514, lng: 153.0154763},
        styles: styles
    });

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        map: map
    });


    infoWindow = new google.maps.InfoWindow();

    setInterval(function(){
        $.ajax({
            url: "http://flood-risk-api.app.skyops.io/address-flood-risk/geo-search",
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            headers: {"x-iag-api-key": "iag-gov-hack-api"},
            data: '{"longitude": ' + map.getCenter().lng() + ',"latitude": ' + map.getCenter().lat() +',"max_distance": 100,"limit": 20}',
            success: function (data) {
                console.log(data)
                for (var i in data){
                    var point = data[i]
                    var heatMarker = new google.maps.LatLng({lat: parseInt(point["latitude"]), lng: parseInt(point["longitude"])});
                    heatMapData.push(heatMarker)
                    console.log(heatMapData)
                }
            },
            error: function(){
                alert("Cannot get data");
            }
        });
    }, 5000)
}

//[{"gnaf_pid":"GAQLD163295784","longitude":153.00319657,"latitude":-27.49026287,"full_address":"55 HOOGLEY STREET","locality":"WEST END","postcode":"4101","state":"QLD","reliability":"2","iag_coordinate":"1","source_type":"OTHER GOVERNMENT FLOOD DATA","average_annual_damage":"H","flood_frequency":"H","distance":90.37934318887578}]
