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

var uuid = '';

app.post('/', function (req, res) {
  if(req.body.uuid) {
    uuid = req.body.uuid;
  }

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

      acr.identify(buf).then(function(acrRes) {
        var jsonRes = JSON.parse(acrRes.body);
        if(jsonRes.metadata) {
          if(tracks.indexOf(jsonRes.metadata.music[0].title) >= 0) {
            console.log('Christmasy song!');
            nexmo.calls.talk.start(uuid, {
              "text": "This room is acceptable"
            }, function(err, res) {
              console.log(err, res)
            });
          } else {
            console.log('Run away');
            nexmo.calls.talk.start(uuid, {
              "text": "GET OUT",
              "loop": 0
            }, function(err, res) {
              console.log(err, res)
            });
          }
        } else {
          console.log('No songs detected');
          nexmo.calls.talk.start(uuid, {
            "text": "No songs detected"
          }, function(err, res) {
            console.log(err, res)
          });
        }
      });
    });
  }
});

app.get('/ncco', function (req, res) {
  res.json([
    {
      "action": "talk",
      "text": "We'll tell you whether to leave the room. Press # when ready.",
      "voiceName": "Emma"
    }, {
      "action": "record",
      "eventUrl": [
          config.callbackUrl
      ],
      "endOnSilence": "3",
      "endOnKey" : "#",
      "format" : "wav",
      "beepStart": "true"
    }, {
      "action": "talk",
      "text": " ",
      "loop": 0
    }
  ]);
});

spotifyApi.clientCredentialsGrant().then(function(data) {
  spotifyApi.setAccessToken(data.body['access_token']);

  spotifyApi.getPlaylist('spotify_uk_', '64Op0QGofJxCKeNUqWTKZg').then(function(data) {
    for(var i = 0; i < data.body.tracks.items.length; i++) {
      tracks.push(data.body.tracks.items[i].track.name);
    }

    app.listen(3000);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
}, function(err) {
  console.log('Something went wrong when retrieving an access token', err);
});
