const ApiElements = require('./importer/api-elements');
const fs = require('fs');
const minim = require('minim').namespace()
  .use(require('minim-parse-result'));
const SwaggerParser = require('fury-adapter-swagger');
const {transcludeString} = require('hercule');

let drafter = null;

function parse(apiDescription, options={}, done) {
  let imported;

  if (typeof options === 'function') {
    done = options;
    options = {};
  }

  if (arguments.length <= 2 && done === undefined) {
    // This is the promise-based interface, called with one or two
    // arguments and no callback. This returns a promise.
    return new Promise((resolve, reject) => {
      parse(apiDescription, options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  if (SwaggerParser.detect(apiDescription)) {
    SwaggerParser.parse({
      minim, source: apiDescription, generateSourceMap: true
    }, (err, result) => {
      if (err) return done(err);

      if (process.env.DUMP) {
        fs.writeFileSync(
          'swagger.json', JSON.stringify(result.toRefract(), null, 2), 'utf8');
      }

      try {
        imported = ApiElements.import(result.toRefract(), null, apiDescription);
      } catch (importErr) {
        return done(importErr);
      }

      if (process.env.DUMP) {
        fs.writeFileSync(
          'api-desc.json', JSON.stringify(imported, null, 2), 'utf8');
      }

      done(null, imported, apiDescription);
    });
  } else {
    // Probably API Blueprint
    if (drafter === null) {
      // Lazy import of (possibly) huge dependency
      drafter = require('drafter');
    }

    const herculeOptions = {
      source: options.filename
    };

    transcludeString(apiDescription, herculeOptions, (err, transcluded, sourcemap) => {
      drafter.parse(transcluded, {exportSourcemap: true}, (err, parsed) => {
        if (err) return done(err);

        if (process.env.DUMP) {
          fs.writeFileSync('apib.json', JSON.stringify(parsed, null, 2), 'utf8');
        }

        try {
          imported = ApiElements.import(parsed, sourcemap, transcluded);
        } catch (importErr) {
          return done(importErr);
        }

        if (process.env.DUMP) {
          fs.writeFileSync(
            'api-desc.json', JSON.stringify(imported, null, 2), 'utf8');
        }

        done(null, imported, transcluded);
      });
    });
  }
}

function parseFile(filename, done) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return done(err);
    }

    parse(data, {filename}, done);
  });
}

module.exports = {
  elements: require('./elements'),
  parse,
  parseFile
};
