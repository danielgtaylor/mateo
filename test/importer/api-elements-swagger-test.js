const ApiElements = require('../../src/importer/api-elements');
const ApiDescription = require('../../src/index');
const {expect} = require('chai');
const drafter = require('drafter.js');

const SWAGGER = `swagger: '2.0'
info:
  title: Swagger API
  version: '1.0'
paths:
  /foo:
    x-summary: Foo resource
    get:
      summary: Get the resource
      responses:
        200:
          description: Successful response
`

describe('API Elements Swagger Importer', () => {
  let api;

  before((done) => {
    ApiDescription.parse(SWAGGER, (err, result) => {
      if (err) {
        return done(err)
      }

      api = result;
      done();
    });
  });

  context('API', () => {

    it('should have actions shortcut', () => {
      expect([...api.actions()][0].name).to.equal('Get the resource');
    });
  });

  context('Resource', () => {
    it('should have a name', () => {
        expect(api)
          .to.have.deep.property('resources[0].name')
          .to.equal('Foo resource')
    });
  });
});
