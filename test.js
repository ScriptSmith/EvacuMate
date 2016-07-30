

var polygon = [
    {"latitude": 110.390625, "longitude": -7.710992},
    {"latitude": 153.984375, "longitude": -6.315299},
    {"latitude": 153.984375, "longitude": -45.089036},
    {"latitude": 108.984375, "longitude": -42.032974},
    {"latitude": 110.390625, "longitude": -7.710992}
];

var geolib = require('geolib');

console.log(geolib.isPointInside({"latitude": 153.0204498, "longitude": -27.5007447}, polygon))
