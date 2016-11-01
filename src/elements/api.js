const NamedElement = require('./named-element');
const defaults = require('lodash.defaults');

module.exports = class Api extends NamedElement {
  constructor(options={}) {
    defaults(options, {
      name: 'API Documentation',
      terms: null,
      contact: {
        name: '',
        email: '',
        url: ''
      },
      license: {
        name: '',
        url: ''
      },
      version: null,
      servers: [],
      tags: [],
      resources: []
    });
    super(options);
  }

  toJSON() {
    return {
      name: this.name,
      terms: this.terms,
      contact: this.contact,
      license: this.license,
      version: this.version,
      servers: this.servers,
      tags: this.tags,
      resources: this.resources
    };
  }

  resourceByName(name) {
    for (const resource of this.resources) {
      if (resource.name === name) {
        return resource;
      }
    }
  }

  resourceByUri(uri) {
    for (const resource of this.resources) {
      // TODO: Use a URI template matcher here?
      if (resource.uriTemplate === uri) {
        return resource;
      }

      for (const action of resource.actions) {
        if (action.hasOwnUriTemplate) {
          if (action.uriTemplate === uri) {
            return resource;
          }
        }
      }
    }
  }

  *untaggedResources() {
    for (const resource of this.resources) {
      if (!(resource.tags) || resource.tags.length === 0) {
        yield resource;
      }
    }
  }

  *actions() {
    for (const resource of this.resources) {
      yield* resource.actions;
    }
  }

  *examples() {
    for (const action of this.actions()) {
      yield* action.examples;
    }
  }

  *requests() {
    for (const example of this.examples()) {
      if (example.request) {
        yield example.request;
      }
    }
  }

  *responses() {
    for (const example of this.examples()) {
      yield example.response;
    }
  }

  *uriParams() {
    for (const resource of this.resources) {
      if (resource.hasOwnUriParams) {
        yield* resource.uriParams;
      }

      for (const action of resource.actions) {
        if (action.hasOwnUriParams) {
          yield* action.ownUriParams;
        }
      }
    }
  }
};
