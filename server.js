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
const Rsvg = new require('librsvg-prebuilt').Rsvg;
const multer  = require('multer');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/status.json', function(req, res) {
    const retVal = {};

    retVal["success"] = true;
    retVal["message"] = "OK";
    retVal["timestamp"] = new Date().toISOString();
    retVal["lastmod"] = process.env.LASTMOD || null;
    retVal["commit"] = process.env.COMMIT || null;
    retVal["tech"] = "NodeJS " + process.version;
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

    res.writeHead(200, {
        "Content-Type": "text/plain",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Max-Age': '604800',
    });

    if ('callback' in req.query)
    {
        res.write(req.query["callback"]);
        res.write("(");
        res.write(JSON.stringify(retVal));
        res.write(");");
    }
    else
    {
        res.write(JSON.stringify(retVal));
    }
    res.end();
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
const sizes = [ 16, 32, 64, 128 ];

app.get('/', function(req, res) {
    if (process.env.ALLOW_LOCAL_FORM == "true") {
        fs.createReadStream("views/index.html").pipe(res);
    } else {
        res.redirect(process.env.REMOTE_FORM);
    }
});

function rsvg_convert(res, buf, size) {

    res.write("Working          : " + size + "x" + size + "...\n");
    const tmpfn = "/tmp/temp-" + uuidv4() + "-" + size + ".png";

    const svg = new Rsvg(buf);

    const png = svg.render({
        format: 'png',
        width: size,
        height: size
    }).data;

    res.write("Size             : " + png.length + "\n");
    res.write('Image            : <img class="preview" src="data:image/png;base64,');
    res.write(png.toString('base64'));
    res.write('" />\n');

    fs.writeFileSync(tmpfn, png);
    return Promise.resolve(tmpfn);
}

function gm_convert(res, buf, size) {

    const tmpfn = "/tmp/temp-" + uuidv4() + "-" + size + ".png";

    return new Promise(function(resolve, reject) {
        gm(buf)
            .resize(size, size)
            .background("none")
            .gravity('Center')
            .extent(size, size)
            //.toBuffer('PNG', function(err, imgbuf) { if (err) { reject(err); return; } resolve(imgbuf); });
            .write(tmpfn, function(err) { if (err) { res.write("Error            : " + err); console.log(err); reject(err); return; } res.write("Working          : " + size + "x" + size + "...\n"); resolve(tmpfn); });
    })
}

app.post('/', multer({ storage: multer.memoryStorage() }).single('file'), asyncMiddleware(async (req, res, next) => {

    let buf = null;
    let mimetype = null;
    let filename = null;

    if (req.file == null || req.file.buffer == null || req.file.buffer.length == 0) {
        const url = req.body["url"];
        if (url == null) {
            res.write("ERROR: url or file is required");
            res.end();
            return;
        }

        const options = {
            url: url,
            encoding: null,
            headers: {
                'User-Agent': 'favicon-maker'
            },
            resolveWithFullResponse: true
        };
        const response = await rp(options);
        buf = response.body;
        mimetype = response.headers['content-type'];
    }
    else {
        buf = req.file.buffer;
        mimetype = req.file.mimetype;
    }

    res.setHeader("content-type", "text/html; charset=utf-8");
    res.write("<html><head><style>img.preview {max-width:128px;max-height:128px;vertical-align:top;border:1px solid black;background-color:eee; }</style><title>Result</title></head><body><pre>");

    const base64 = buf.toString('base64');
    res.write("Content-Type     : " + mimetype + "\n");
    res.write("Buffer size      : " + buf.length + "\n");
    res.write("Base64 size      : " + base64.length + "\n");
    res.write('Image            : <img class="preview" src="data:');
    res.write(mimetype);
    res.write(';base64,');
    res.write(base64);
    res.write('" />\n');
    var converter = gm_convert;
    if (mimetype && (mimetype.startsWith("image/svg") || mimetype.startsWith("text/"))) {
        converter = rsvg_convert;
    }
    res.write("Working          : Generating intermediate images...\n");

    const tasks = [];

    for (const size of sizes) {
       tasks.push( converter(res, buf, size) );
    }

    const filenames = await Promise.all(tasks);

    res.write("Working          : Merging into ICO...\n");

    const icobuf = await new Promise(function(resolve, reject) {
        const cmd = gm().command("convert");
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
    res.write("<a href=\"/\">Make another</a>\n");
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

const listener = app.listen(process.env.PORT, function () {
    console.log('Listening on port ' + listener.address().port);
});

