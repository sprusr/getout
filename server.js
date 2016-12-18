var express = require('express')
var bodyParser = require('body-parser')
var Nexmo = require('nexmo')
var config = require('./config')
var request = require('request')


var app = express()

var nexmo = new Nexmo(config.nexmo);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.post('/', function (req, res) {
  if (req.body.recording_url){
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
      console.log(buf);
    })

  }

})

app.get('/ncco', function (req, res) {
res.json(

    [  {
      "action": "talk",
      "text": "Please leave a message after the tone, then press #. We will get back to you as soon as we can",
      "voiceName": "Emma"
    },
    {
      "action": "record",
      "eventUrl": [
          "http://b09b8c93.ngrok.io/"
      ],
      "endOnSilence": "3",
      "endOnKey" : "#",
      "format" : "wav",
      "beepStart": "true"
    },
    {
      "action": "talk",
      "text": "Thank you for your message. Goodbye"
    } ]



    );

})

app.listen(3000)
