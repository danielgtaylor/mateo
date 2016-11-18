const {expect} = require('chai');
const mateo = require('../src');

describe('Mateo library', () => {
  it('can parse string with callback', (done) => {
    mateo.parse('# My API', (err, api) => {
      if (err) {
        return done(err);
      }

      if (api === undefined) {
        return done(new Error('API should exist'));
      }

      done();
    });
  });

  it('can parse string with promise', () => {
    return mateo.parse('# My API').then((api) => {
      expect(api).to.exist;
    });
  });

  it('can parse string and options with promise', () => {
    return mateo.parse('# My API', {filename: 'test.apib'}).then((api) => {
      expect(api).to.exist;
    });
  });
});
