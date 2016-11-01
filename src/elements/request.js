const Action = require('./action');
const defaults = require('lodash.defaults');
const UriBaseElement = require('./uri-base');

module.exports = class Request extends UriBaseElement {
  constructor(options) {
    defaults(options, {
      name: 'Request',
      headers: [],
      body: '',
      bodySourcemap: null,
      _sourcemap: null,
    });
    super(options);
  }

  get contentType() {
    return this.headers
      .filter((header) => header.name.toLowerCase() === 'content-type')
      .map((header) => header.example)[0];
  }

  get contentTypeSourcemap() {
    return this.headers
      .filter((header) => header.name.toLowerCase() === 'content-type')
      .map((header) => header.sourcemap)[0] || this.sourcemap;
  }

  get sourcemap() {
    return this._sourcemap || this.bodySourcemap || this.schemaSourcemap;
  }

  get bodySchema() {
    return this.ancestor(Action).requestBodySchema;
  }

  get bodySchemaSourcemap() {
    return this.ancestor(Action).requestBodySchemaSourcemap;
  }
};
