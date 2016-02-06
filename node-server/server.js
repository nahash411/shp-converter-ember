//var sys = require('sys')
var exec = require('child_process').exec;
var express = require('express');
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs-extra'));
var app = express();
var path = require('path');
var Shp = require('shp');
var busboy = require('connect-busboy');
var unzip = require('unzip');

var port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(busboy());
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, './shapes')));

app.post('/api/shapes', function (req, res) {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    var fileBase = filename.slice(0, -4);
    var filePath = __dirname + '/shapes/' + fileBase + '.zip';
    var shapeJson = __dirname + '/shapes/' + fileBase + '.json';
    var topoJson = __dirname + '/shapes/' + fileBase + '.topo.json';
    var shapeFile = __dirname + '/shapes/' + fileBase;
    // if (fileExists(shapeJson)) {
    //   console.log('Already converted');
    //   res.sendStatus(200);
    // } else {
      fstream = fs.createWriteStream(filePath);
      file.pipe(fstream);
      fstream.on('close', function () {    
        console.log("Upload Finished of " + filename);  
        fs.createReadStream(filePath)
          .pipe(unzip.Extract({ path: __dirname + '/shapes/' }))
          .on('close', function() {
            Shp.readFile(shapeFile, function(error, data){
              fs.writeJsonSync(shapeJson, data);
            })
            exec("topojson -o " + topoJson + " " + shapeJson, puts);
            res.sendStatus(201);
          });            
      });
    // }
  });
});

app.listen(port, function () {
  console.log('Listening on ', port);
})

function puts (error, stdout, stderr) {
  if(error) {
    console.log(error);
  }
}

function fileExists (filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
