const Action = require('./action');
const defaults = require('lodash.defaults');
const TransactionMixin = require('./transaction-mixin');
const UriBaseElement = require('./uri-base');

module.exports = class Request extends TransactionMixin(UriBaseElement) {
  constructor(options) {
    defaults(options, {
      name: 'Request',
      headers: []
    });
    super(options);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      uriParameters: this.uriParameters,
      headers: this.headers,
      body: this.body
    };
  }

  get id() {
    let id = '';

    if (this.parent) {
      id += `${this.parent.id} > `;
    }

    id += this.name || 'Request';

    return this.getUniqueId(id);
  }

  get bodySchema() {
    return this._bodySchema || this.ancestor(Action).requestBodySchema;
  }

  set bodySchema(schema) {
    this._bodySchema = schema;
  }

  get bodySchemaSourcemap() {
    return this._bodySchemaSourcemap ||
      this.ancestor(Action).requestBodySchemaSourcemap;
  }

  set bodySchemaSourcemap(sourcemap) {
    this._bodySchemaSourcemap = sourcemap;
  }
};
