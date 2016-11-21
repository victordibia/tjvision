/**
* Author : Victor Dibia
* Title : TJVision ... nodejs to capture and i
*/

var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var watson = require('watson-developer-cloud');
var fs = require('fs');
var RaspiCam = require("raspicam");
var config = require("./config");

var visual_recognition = new VisualRecognitionV3({
  api_key: config.VisionKey,
  version_date: config.VisionVersion
});

// Setup image options- height, width, rotation etc.
var options = {
  mode: "photo",
  w: 960,
  h: 540,
  rot: 180,
  q: 80,
  output: "shot.jpg"
}

var snapinterval =  10000 ; // take a picture every X milliseconds

var camera = new RaspiCam(options);


function launchVision(){
  setInterval(function () {
    //to take a snapshot, start a timelapse or video recording
    camera.start();
    //listen for the "read" event triggered when each new photo/video is saved
    camera.on("read", function(err, filename){
      //do stuff
      console.log("image saved ", filename)
      processImage("shot.jpg")
    });
  }, snapinterval);
}

/**
* [processImage send the given image file to Watson Vision Recognition for Analysis]
* @param  {[type]} imagefile [description]
* @return {[type]}           [description]
*/
function processImage(imagefile){
  var params = {
    images_file: fs.createReadStream(imagefile)
  };

  var resultstring = "Objects in the image are: " ;

  visual_recognition.classify(params, function(err, res) {
    if (err){
      console.log(err);
    } else {
      result = res.images[0].classifiers[0].classes
      if(result !== null & result.length > 0){
        result.forEach(function(obj){
          console.log(obj.class)
          resultstring = resultstring + obj.class + ", "
        })

        console.log(resultstring)
        speak(resultstring);
      }else {
        resultstring = "I could not understand that image. Try anoter?"
        console.log(resultstring)
        speak(resultstring);
      }
      //console.log("================\n",JSON.stringify(result), null, 2));
    }
  });
}


var Sound = require('node-aplay');
var music ;
var text_to_speech = watson.text_to_speech({
  username: config.TTSUsername,
  password: config.TTSPassword,
  version: 'v1'
});

function speak(textstring){
  var params = {
    text: textstring,
    voice: config.voice,
    accept: 'audio/wav'
  };
  text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')).on('close', function() {
    // var create_audio = exec('ffplay -autoexit output.wav', function (error, stdout, stderr) { // if on mac
    music = new Sound("output.wav");
    music.play();
    music.on('complete', function () {
      console.log('Done with playback!');
    });
  });
}
