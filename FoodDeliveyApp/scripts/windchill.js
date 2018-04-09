function windChill(hightemp, speed, lowtemp) {
    var averagetemp = (hightemp + lowtemp) / 2;
    var fahrenheit = 35.74 + (0.6215 * averagetemp) - (35.75 * Math.pow(speed, 0.16)) + (0.4275 * averagetemp * Math.pow(speed, 0.16));
    var results = fahrenheit.toFixed(2);
    return results;
}

var hightemperature = parseInt(document.getElementById("high").innerHTML);
var lowtemperature =parseInt(document.getElementById("low").innerHTML);
var windSpeed = parseInt(document.getElementById("max").innerHTML);
var wind = windChill(hightemperature, windSpeed, lowtemperature);

document.getElementById("windchill").innerHTML= wind;

