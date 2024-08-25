# FavIcon Generator [<img alt="ff-favicon Logo" src="https://favicon.fileformat.info/favicon.svg" height="90" align="right">](https://favicon.fileformat.info/)

A website to make favicons from SVGs or PNGs/JPEGs.

> [!NOTE]  
> This version is now archived: due to lack of updates to the `librsvg` npm module, I have switched to a rust-based version: see [FileFormatInfo/favicon-rs](https://github.com/FileFormatInfo/favicon-rs)

## Using

Go to [favicon.fileformat.info](https://favicon.fileformat.info/) and upload an `.svg` or `.png` file!

## Running

It is a simple node app.  It takes the follow environment variables:

On my dev machine, the `librsvg` npm module wouldn't compile until I installed the necessary native package:
```bash
apt-get install librsvg2-dev
```

## Contributing

Contributions are welcome!  Please follow the standard Github [Fork & Pull Request Workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962)

See the [to do list](TODO.md) for a list of things that are planned.

## License

[GNU Affero General Public License v3.0](LICENSE.txt)

## Credits

[![express.js](https://www.vectorlogo.zone/logos/expressjs/expressjs-ar21.svg)](https://expressjs.com/ "Web Framework")
[![Git](https://www.vectorlogo.zone/logos/git-scm/git-scm-ar21.svg)](https://git-scm.com/ "Version control")
[![Github](https://www.vectorlogo.zone/logos/github/github-ar21.svg)](https://github.com/ "Code hosting")
[![Google Analytics](https://www.vectorlogo.zone/logos/google_analytics/google_analytics-ar21.svg)](https://www.google.com/analytics "Traffic Measurement")
[![Google AppEngine](https://www.vectorlogo.zone/logos/google_appengine/google_appengine-ar21.svg)](https://cloud.google.com/appengine/ "Hosting")
[![ImageMagick](https://www.vectorlogo.zone/logos/imagemagick/imagemagick-ar21.svg)](https://www.imagemagick.org/ "Raster image processing")
[![JavaScript](https://www.vectorlogo.zone/logos/javascript/javascript-ar21.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript "Programming Language")
[![Node.js](https://www.vectorlogo.zone/logos/nodejs/nodejs-ar21.svg)](https://nodejs.org/ "Application Server")
[![npm](https://www.vectorlogo.zone/logos/npmjs/npmjs-ar21.svg)](https://www.npmjs.com/ "JS Package Management")
[![Shoelace CSS](https://www.vectorlogo.zone/logos/shoelacestyle/shoelacestyle-ar21.svg)](https://shoelace.style/ "CSS")

 * [rsvg](https://wiki.gnome.org/Projects/LibRsvg)
 * [request](https://github.com/request/request)
 * [gm](https://www.npmjs.com/package/gm)



 
