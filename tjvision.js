/**
* Author : Victor Dibia
* Title : TJVision ... nodejs to capture and i
*/

var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var watson = require('watson-developer-cloud');
var fs = require('fs');
var config = require("./config");
var child_process = require('child_process');

var visual_recognition = new VisualRecognitionV3({
  api_key: config.VisionKey,
  version_date: config.VisionVersion
});



var snapinterval =  20000 ; // take a picture every X milliseconds
var i = 0 ;
// setInterval(function () {
//   launchVision()
// }, snapinterval);

launchVision();

/**
* Process Images every X seconds
* @return {null} null
*/
function launchVision(){

  var filename = 'photos/pic_'+i+'.jpg';
   //var args = ['-vf', '-hf','-w', '960', '-h', '720', '-o', filename, '-t', '1'];
   var args = ['-w', '960', '-h', '720', '-o', filename, '-t', '5'];
   var spawn = child_process.spawn('raspistill', args);

   spawn.on('exit', function(code) {
     console.log('A photo is saved as '+filename+ ' with exit code, ' + code);
     let timestamp = Date.now();
     processImage(filename)
     i++;
   });

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

  var resultstring = "The objects I see in the image are " ;

  visual_recognition.classify(params, function(err, res) {
    if (err){
      console.log(err);
    } else {
      result = res.images[0].classifiers[0].classes
      if(result !== null & result.length > 0){
        result.forEach(function(obj){
          console.log(obj.class)
          resultstring = resultstring + ", " + obj.class
        })

        console.log(resultstring)
        speak(resultstring);
      }else {
        resultstring = "I could not understand that image. Try another?"
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


function deleteFile(filepath) {
  fs.unlink(filepath, function(err) {
    if (err) {
       return console.error(err);
    }
    console.log(filepath + ' has been deleted.');
  });
}
