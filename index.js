var fs = require('fs');
var ACRCloud = require('acr-cloud');
var config = require('./config');
var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId : config.spotify.clientId,
  clientSecret : config.spotify.clientSecret
});

var acr = new ACRCloud({
  access_key: config.acr.access_key,
  access_secret: config.acr.access_secret,
  requrl: 'eu-west-1.api.acrcloud.com'
});

var buf = new Buffer(fs.readFileSync('sample.wav'));

var tracks = [];

spotifyApi.clientCredentialsGrant().then(function(data) {
  console.log('The access token expires in ' + data.body['expires_in']);
  console.log('The access token is ' + data.body['access_token']);

  spotifyApi.setAccessToken(data.body['access_token']);

  spotifyApi.getPlaylist('spotify', '3rjw5lJe4Yxd0ruERmNJ3s').then(function(data) {
    for(var i = 0; i < data.body.tracks.items.length; i++) {
      tracks.push(data.body.tracks.items[i].track.id);
    }
  }, function(err) {
    console.log('Something went wrong!', err);
  });
}, function(err) {
  console.log('Something went wrong when retrieving an access token', err);
});

acr.identify(buf).then(function(res) {
  if(tracks.indexOf(JSON.parse(res.body).metadata.music[0].external_metadata.spotify.track.id) >= 0) {
    console.log('Christmasy song!');
  } else {
    console.log('Run away')
  }
});
