const ApiElements = require('../../src/importer/api-elements');
const ApiDescription = require('../../src/index');
const {expect} = require('chai');
const drafter = require('drafter.js');

// Strip leading whitespace from an indented block
function stripBlock(text) {
  let spaces = null;

  for (const line of text.split('\n').slice(1)) {
    if (line.length === 0) {
      continue;
    }

    const count = line.match(/^\s*/)[0].length;
    if (spaces === null) {
      spaces = count;
    } else if (count < spaces) {
      spaces = count;
    }
  }

  const lines = [];
  for (const line of text.split('\n')) {
    lines.push(line.substr(spaces));
  }

  return lines.join('\n');
}

function parseApi(apiDescription, done) {
  ApiDescription.parse(stripBlock(apiDescription), done);
}

describe('API Elements API Blueprint Importer', () => {
  let api;

  context('API', () => {
    before((done) => {
      const APIB = `
        FORMAT: 1A
        HOST: https://api.example.com

        # API Title

        API description
        `;

      parseApi(APIB, (err, result) => {
          api = result;
          done(err);
      });
    });

    it('should have a name', () => {
      expect(api)
        .to.have.property('name')
        .to.equal('API Title');
    });

    it('should have a name sourcemap', () => {
      expect(api)
        .to.have.deep.property('nameSourcemap')
        .to.deep.equal([[43, 13]]);
    });

    it('should have a description', () => {
      expect(api)
        .to.have.deep.property('description')
        .to.equal('API description');
    });

    it('should have a host name', () => {
      expect(api)
        .to.have.deep.property('servers[0].uriTemplate')
        .to.equal('https://api.example.com');
    });

    context('Convience generators', () => {
      before((done) => {
        const APIB = `
          FORMAT: 1A

          # API Title
          # Resource [/resource/{id}{?q}]

          + Parameters

              + id: foo

          # Get the resource [GET]

          + Parameters

              + q: abc

          + Request (application/json)

                  {}

          + Response 200 (application/json)

                  {}`;

        parseApi(APIB, (err, parsed) => {
          api = parsed;
          done(err);
        });
      });

      it('should have untagged resources iterable', () => {
        expect([...api.untaggedResources()])
          .to.have.length(1);
      });

      it('should have actions iterable', () => {
        expect([...api.actions()][0].name)
          .to.equal('Get the resource');
      });

      it('should have examples iterable', () => {
        expect([...api.examples()])
          .to.have.length(1);
      });

      it('should have requests iterable', () => {
        expect([...api.requests()])
          .to.have.length(1);
      });

      it('should have responses iterable', () => {
        expect([...api.responses()])
          .to.have.length(1);
      });

      it('should have URI parameters iterable', () => {
        expect([...api.uriParams()])
          .to.have.length(2);

        expect([...api.uriParams()].map((param) => param.name))
          .to.deep.equal(['id', 'q']);
      });
    });

    context('Resource referencing', () => {
      before((done) => {
        const APIB = `
          FORMAT: 1A

          # API Title
          # Resource [/resource]`;

        parseApi(APIB, (err, parsed) => {
          api = parsed;
          done(err);
        });
      });

      it('can get resource by name', () => {
        expect(api.resourceByName("Resource"))
          .to.exist
          .to.equal(api.resources[0]);
      });

      it('can get resource by URI', () => {
        expect(api.resourceByUri("/resource"))
          .to.exist
          .to.equal(api.resources[0]);
      });
    });
  });

  context('Resource Group', () => {
    before((done) => {
      const APIB = `
        FORMAT: 1A

        # API Title
        # Group My Resources
        Resource group description
        ## Resource [/resource]
        ## Another Resource [/another]`;

      parseApi(APIB, (err, parsed) => {
        api = parsed;
        done(err);
      });
    });

    it('should have API as parent', () => {
      expect(api)
        .to.have.deep.property('tags[0]')
        .to.have.property('parent')
        .to.equal(api);
    });

    it('should have a name', () => {
      expect(api)
        .to.have.deep.property('tags[0].name')
        .to.equal('My Resources');
    });

    it('should have a description', () => {
      expect(api)
        .to.have.deep.property('tags[0].description')
        .to.equal('Resource group description');
    });

    context('Convience generators', () => {
      it('should have two resources', () => {
        expect(api)
          .to.have.deep.property('tags[0].resources');

        expect([...api.tags[0].resources()])
          .to.have.length(2);
      });
    });
  });

  context('Resource', () => {
    before((done) => {
      const APIB = `
        FORMAT: 1A

        # API Title
        # Group My Resources
        ## Resource [/resource/{id}]
        Resource description

        + Parameters

            + id: 123`;

      parseApi(APIB, (err, parsed) => {
        api = parsed;
        done(err);
      });
    });

    it('should have API as parent', () => {
      expect(api)
        .to.have.deep.property('resources[0]')
        .to.have.property('parent')
        .to.equal(api);
    });

    it('should have a name', () => {
      expect(api)
        .to.have.deep.property('resources[0].name')
        .to.equal('Resource');
    });

    it('should have a URI template', () => {
      expect(api)
        .to.have.deep.property('resources[0].uriTemplate')
        .to.equal('/resource/{id}');
    });

    it('should have a description', () => {
      expect(api)
        .to.have.deep.property('resources[0].description')
        .to.equal('Resource description');
    });

    it('should have URI template variables', () => {
      expect(api)
        .to.have.deep.property('resources[0].uriParams');

      const variables = api.resources[0].uriParams;

      expect(variables.map((item) => item.name))
        .to.deep.equal(['id']);

      expect(variables.map((item) => item.example))
        .to.deep.equal(['123']);
    });

    it('should have URI template variables example object', () => {
      expect(api)
        .to.have.deep.property('resources[0].uriParamsExample')
        .to.deep.equal({
          id: '123'
        });
    });

    it('should have URI template variables schema', () => {
      expect(api)
        .to.have.deep.property('resources[0].uriParamsSchema');

      const schema = JSON.parse(api.resources[0].uriParamsSchema);

      expect(schema)
        .to.have.deep.property('properties.id.type')
        .to.equal('string');
    });
  });

  context('Action', () => {
    before((done) => {
      const APIB = `
        FORMAT: 1A

        # API Title
        # Group My Resources
        ## Resource [/resource/{id}]
        ### Get the resource [GET]
        Action description`;

      parseApi(APIB, (err, parsed) => {
        api = parsed;
        done(err);
      });
    });

    it('should have resource as parent', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0]')
        .to.have.property('parent')
        .to.equal(api.resources[0]);
    });

    it('should have a name', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].name')
        .to.equal('Get the resource');
    });

    it('should have a description', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].description')
        .to.equal('Action description');
    });

    it('should have a method', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].method')
        .to.equal('GET');
    });

    context('Shorthand PUT method', () => {
      before((done) => {
        const APIB = `
          FORMAT: 1A

          # API Title
          # Group My Resources
          ## Resource [/resource/{id}]
          ### PUT
          + Response 200 (text/plain)

                  Ok`;

        parseApi(APIB, (err, parsed) => {
          api = parsed;
          done(err);
        });
      });

      it('should properly set the method', () => {
        expect(api)
          .to.have.deep.property('resources[0].actions[0].method')
          .to.equal('PUT');
      });
    });
  });

  context('Example', () => {
    before((done) => {
      const APIB = `
        FORMAT: 1A

        # API Title
        # Group My Resources
        ## Resource [/resource/{id}]
        ### Get the resource [GET]
        + Response 200 (application/json)

            + Attributes

                + id: 123`;

      parseApi(APIB, (err, parsed) => {
        api = parsed;
        done(err);
      });
    });

    it('should have a request', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].examples[0].request')
        .to.exist;
    });

    it('should have a response', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].examples[0].response')
        .to.exist;
    });
  });

  context('Request', () => {
    it('should have blank name', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].examples[0].request.name')
        .to.equal('');
    });
  });

  context('Response', () => {
    it('should have a body', () => {
      expect(api)
        .to.have.deep.property('resources[0].actions[0].examples[0].response.body')
        .to.not.be.empty;
    });
  });
});
