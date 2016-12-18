var express = require('express');
var bodyParser = require('body-parser');
var Nexmo = require('nexmo');
var request = require('request');
var ACRCloud = require('acr-cloud');
var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var app = express();

var spotifyApi = new SpotifyWebApi({
  clientId : config.spotify.clientId,
  clientSecret : config.spotify.clientSecret
});

var acr = new ACRCloud({
  access_key: config.acr.access_key,
  access_secret: config.acr.access_secret,
  requrl: 'eu-west-1.api.acrcloud.com'
});

var nexmo = new Nexmo(config.nexmo);

var tracks = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/', function (req, res) {
  if (req.body.recording_url) {
    var jwt = nexmo.generateJwt();
    var bufs = [];

    request.get(req.body.recording_url, {
      'auth': {
        'bearer': jwt
      }
    }).on('error', function(err) {
      console.log('ERROR: ' + err);
    }).on('data', function(d) {
      bufs.push(d);
    }).on('end', function() {
      var buf = Buffer.concat(bufs);

      acr.identify(buf).then(function(res) {
        if(tracks.indexOf(JSON.parse(res.body).metadata.music[0].external_metadata.spotify.track.id) >= 0) {
          console.log('Christmasy song!');
        } else {
          console.log('Run away');
        }
      });
    });
  }
});

app.get('/ncco', function (req, res) {
  res.json([
    {
      "action": "talk",
      "text": "Please leave a message after the tone, then press #. We will get back to you as soon as we can",
      "voiceName": "Emma"
    }, {
      "action": "record",
      "eventUrl": [
          "http://b09b8c93.ngrok.io/"
      ],
      "endOnSilence": "3",
      "endOnKey" : "#",
      "format" : "wav",
      "beepStart": "true"
    }, {
      "action": "talk",
      "text": "Thank you for your message. Goodbye"
    }
  ]);
});

spotifyApi.clientCredentialsGrant().then(function(data) {
  console.log('The access token expires in ' + data.body['expires_in']);
  console.log('The access token is ' + data.body['access_token']);

  spotifyApi.setAccessToken(data.body['access_token']);

  spotifyApi.getPlaylist('spotify', '3rjw5lJe4Yxd0ruERmNJ3s').then(function(data) {
    for(var i = 0; i < data.body.tracks.items.length; i++) {
      tracks.push(data.body.tracks.items[i].track.id);
    }

    app.listen(3000);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
}, function(err) {
  console.log('Something went wrong when retrieving an access token', err);
});
