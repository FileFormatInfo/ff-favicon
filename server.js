// server.js
// where your node app starts

// init project
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const os = require('os');
const rp = require('request-promise-native');
const request = require('request');
const bodyParser = require('body-parser');
const gm = require('gm').subClass({imageMagick: true});
const async = require('async');
const multer  = require('multer');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

function getStatus() {
	const retVal = {}

	retVal["success"] = true;
	retVal["message"] = "OK";
	retVal["timestamp"] = new Date().toISOString();
	retVal["__dirname"] = __dirname;
	retVal["__filename"] = __filename;
	retVal["os.hostname"] = os.hostname();
	retVal["os.type"] = os.type();
	retVal["os.platform"] = os.platform();
	retVal["os.arch"] = os.arch();
	retVal["os.release"] = os.release();
	retVal["os.uptime"] = os.uptime();
	retVal["os.loadavg"] = os.loadavg();
	retVal["os.totalmem"] = os.totalmem();
	retVal["os.freemem"] = os.freemem();
	retVal["os.cpus.length"] = os.cpus().length;
	// too much junk: retVal["os.networkInterfaces"] = os.networkInterfaces();
	
	retVal["process.arch"] = process.arch;
	retVal["process.cwd"] = process.cwd();
	retVal["process.execPath"] = process.execPath;
	retVal["process.memoryUsage"] = process.memoryUsage();
	retVal["process.platform"] = process.platform;
	retVal["process.release"] = process.release;
  retVal["process.title"] = process.title;
	retVal["process.uptime"] = process.uptime();
	retVal["process.version"] = process.version;
	retVal["process.versions"] = process.versions;
	retVal["process.installPrefix"] = process.installPrefix;
	
	return retVal;
}

app.get('/status.json', function(req, res) {
  res.writeHead(200, {
        "Content-Type": "text/plain",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Max-Age': '604800',
      });

  sendJson(req, res, getStatus());
  return;
});

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16) 
  )
}
var sizes = [ 16, 32, 64, 128 ];

app.post('/url', asyncMiddleware(async (req, res, next) => {
  var url = req.body["url"];
  if (url == null) {
    res.write("ERROR: url is required");
    res.end();
    return;
  }
  
  var options = {
    url: url,
    encoding: null,
    headers: {
      'User-Agent': 'favicon-maker'
    },
    resolveWithFullResponse: true
  };
  
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.write("<html><head><title>Result</title></head><body><pre>");
  
  var response = await rp(options);
  console.log(response);
    /*if (error) {
      res.write("Error retrieving url '" + url + "': " + error);
      res.end();
      return;
    }*/
  var body = response.body;
    console.log("body buffer?", body instanceof Buffer);
    console.log("body buffer?", typeof body);
    var buf = Buffer.from(body, 'binary');
    var base64 = buf.toString('base64');
    res.write("HTTP Status      : " + (response && response.statusCode) + "\n");
    res.write("Content-Type     : " + response.headers['content-type'] + "\n");
    res.write("Content-Encoding : " + response.headers['content-encoding'] + "\n");
    res.write("Size             : " + body.length + "\n");
    res.write("Buffer size      : " + buf.length + "\n");
    res.write("Base64 size      : " + base64.length + "\n");
    res.write('Image            : <img style="max-width:64px;max-height:64px;vertical-align:top;border:1px solid black;background-color:ddd;" src="data:');
    res.write(response.headers['content-type']);
    res.write(';base64,');
    res.write(base64);
    res.write('" />\n');
    
    var pngs = [];
    
    async.map(sizes, function(size, cb) {
      console.log("generating " + size + "...");
      gm(buf).resize(size, size).background("none").gravity('Center').extent(size, size).toBuffer('PNG', function(err, buf) { if (err) { console.log(err); cb(null); } console.log(buf.toString('base64')); cb(null, buf); });
    }, function(err, results) {
      // results is now an array of stats for each file
      for (var loop = 0; loop < results.length; loop++) {
        res.write('Buf size       : ' + (results[loop] == null ? "(null)" : results[loop].length) + "\n");
        res.write('PNG Image      : <img style="vertical-align:top;border:1px solid black;background-color:#ddd;" src="data:image/png;base64,');
        res.write(results[loop].toString('base64'));
        res.write('"/>\n');
      }
      res.end();
    });
   
}));

app.post('/file', multer({ storage: multer.memoryStorage() }).single('file'), function(req, res) {

    if (req.file == null) {
      res.write("ERROR: no file uploaded!");
      return;
    }
  
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.write("<html><head><title>Result</title></head><body><pre>");
    res.write("Uploaded     : " + req.file.fieldname + "\n");
    res.write("Content-Type : " + req.file.mimetype + "\n");
    res.write("Size         : " + req.file.buffer.length + "\n");
    res.write('Original     : <img style="max-width:64px;max-height:64px;vertical-align:top;border:1px solid black;background-color:ddd;" src="data:');
    res.write(req.file.mimetype);
    res.write(';base64,');
    res.write(req.file.buffer.toString('base64'));
    res.write('" />\n')
    res.write("test: " + req.body.testfield + "\n");
    //res.write(body);
    res.end();

});

app.get('/', function(req, res) {
  if (process.env.ALLOW_LOCAL_FORM == "true") {
    fs.createReadStream("views/index.html").pipe(res);
  } else {
    res.redirect(process.env.REMOTE_FORM);
  }
  return;
});

app.post('/', multer({ storage: multer.memoryStorage() }).single('file'), asyncMiddleware(async (req, res, next) => {
  
  var buf = null;
  var mimetype = null;
  var filename = null;
  
  if (req.file == null || req.file.buffer == null || req.file.buffer.length == 0) {
    var url = req.body["url"];
    if (url == null) {
      res.write("ERROR: url or file is required");
      res.end();
      return;
    }
  
    var options = {
      url: url,
      encoding: null,
      headers: {
        'User-Agent': 'favicon-maker'
      },
      resolveWithFullResponse: true
    };
    var response = await rp(options);
    buf = response.body;
    mimetype = response.headers['content-type'];
  }
  else {
    buf = req.file.buffer;
    mimetype = req.file.mimetype;
  }
  
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.write("<html><head><style>img.preview {max-width:128px;max-height:128px;vertical-align:top;border:1px solid black;background-color:eee; }</style><title>Result</title></head><body><pre>");
  
  var base64 = buf.toString('base64');
  res.write("Content-Type     : " + mimetype + "\n");
  res.write("Buffer size      : " + buf.length + "\n");
  res.write("Base64 size      : " + base64.length + "\n");
  res.write('Image            : <img class="preview" src="data:');
  res.write(mimetype);
  res.write(';base64,');
  res.write(base64);
  res.write('" />\n');
  res.write("Working          : Generating intermediate images...\n");
  var uuid = uuidv4();
    
    var tasks = sizes.map(function(size) {
      return new Promise(function(resolve, reject) {
        var tmpfn = "/tmp/temp-" + uuid + "-" + size + ".png";
        gm(buf)
          .resize(size, size)
          .background("none")
          .gravity('Center')
          .extent(size, size)
          //.toBuffer('PNG', function(err, imgbuf) { if (err) { reject(err); return; } resolve(imgbuf); });
          .write(tmpfn, function(err) { if (err) { reject(err); return; } res.write("Working          : " + size + "x" + size + "...\n"); resolve(tmpfn); });
      });
    });
  
  var filenames = await Promise.all(tasks);
  
  res.write("Working          : Merging into ICO...\n");
  
  var icobuf = await new Promise(function(resolve, reject) {
    var cmd = gm().command("convert");
    filenames.map(function(fn){ cmd.in(fn); /*res.write("png: " + fn + "\n"); */});
    //cmd.out("-colors");
    //cmd.out("256");
    cmd.toBuffer('ICO', function(err, imgbuf) { if (err) { reject(err); return; } resolve(imgbuf); });
  });
  
  res.write("ICO size         : " + icobuf.length + "\n");
  res.write('ICO image        : <img class="preview" src="data:image/ico;base64,');
  res.write(icobuf.toString('base64'));
  res.write('"/>\n');
  res.write('                   <a href="data:image/ico;base64,');
  res.write(icobuf.toString('base64'));
  res.write('" download="favicon.ico" >download</a>\n');
  
  filenames.map(function(fn) {
    res.write("Cleaning up      : " + fn + "\n");
    fs.unlink(fn, function() { });
  });
  
  res.write("Complete!\n");
  res.write("</pre></body></html>"); 
  res.end();
   
}));

app.use(function (req, res, next) {
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.status(404).send("404: unable to find file '" + req.url + "'");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.status(500).send("500: " + err);
});

function sendJson(req, res, jsonObj) {
	if ('callback' in req.query)
	{
		res.write(req.query["callback"]);
		res.write("(");
		res.write(JSON.stringify(jsonObj));
		res.write(");");
	}
	else
	{
		res.write(JSON.stringify(jsonObj));
	}
  res.end();
}

var listener = app.listen(process.env.PORT, function () {
  console.log('Listening on port ' + listener.address().port);
});

