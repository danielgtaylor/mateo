const Action = require('./action');
const NamedElement = require('./named-element');
const defaults = require('lodash.defaults');

module.exports = class Response extends NamedElement {
  constructor(options) {
    defaults(options, {
      name: 'Request',
      statusCode: 200,
      headers: [],
      body: '',
      bodySourcemap: null,
      _sourcemap: null
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
    return this.ancestor(Action).responseBodySchema;
  }

  get bodySchemaSourcemap() {
    return this.ancestor(Action).responseBodySchemaSourcemap;
  }
};
