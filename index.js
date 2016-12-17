var fs = require('fs');
var ACRCloud = require('acr-cloud');
var config = require('./config')

var acr = new ACRCloud({
    access_key: config.acr.access_key,
    access_secret: config.acr.access_secret,
    requrl: 'eu-west-1.api.acrcloud.com'
});

var buf = new Buffer(fs.readFileSync('sample.wav'));

acr.identify(buf).then(function(res) {
  console.log(JSON.parse(res.body).metadata.music[0].external_metadata.spotify.track.id);
});
