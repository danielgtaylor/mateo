const fs = require('fs');
const minim = require('minim').namespace()
  .use(require('minim-parse-result'));
const SwaggerParser = require('fury-adapter-swagger');
const ApiElements = require('./importer/api-elements');

let drafter = null;

function parse(apiDescription, done) {
  let imported;

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
        imported = ApiElements.import(result.toRefract());
      } catch (importErr) {
        return done(importErr);
      }

      if (process.env.DUMP) {
        fs.writeFileSync(
          'api-desc.json', JSON.stringify(imported, null, 2), 'utf8');
      }

      done(null, imported);
    });
  } else {
    // Probably API Blueprint
    if (drafter === null) {
      // Lazy import of (possibly) huge dependency
      drafter = require('drafter');
    }

    drafter.parse(apiDescription, {exportSourcemap: true}, (err, parsed) => {
      if (err) return done(err);

      if (process.env.DUMP) {
        fs.writeFileSync('apib.json', JSON.stringify(parsed, null, 2), 'utf8');
      }

      try {
        imported = ApiElements.import(parsed);
      } catch (importErr) {
        return done(importErr);
      }

      if (process.env.DUMP) {
        fs.writeFileSync(
          'api-desc.json', JSON.stringify(imported, null, 2), 'utf8');
      }

      done(null, imported);
    });
  }
}

function parseFile(filename, done) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return done(err);
    }

    parse(data, done);
  });
}

module.exports = {
  elements: require('./elements'),
  parse,
  parseFile
};
