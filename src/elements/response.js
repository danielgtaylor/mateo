const Action = require('./action');
const defaults = require('lodash.defaults');
const NamedElement = require('./named-element');
const TransactionMixin = require('./transaction-mixin');

module.exports = class Response extends TransactionMixin(NamedElement) {
  constructor(options) {
    defaults(options, {
      name: '',
      statusCode: 200,
      statusCodeSourcemap: null,
      headers: []
    });
    super(options);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      statusCode: this.statusCode,
      headers: this.headers,
      body: this.body
    };
  }

  get id() {
    let id = '';

    if (this.parent) {
      id += `${this.parent.id} > `;
    }

    id += this.name || `Response ${this.statusCode}`;

    return this.getUniqueId(id);
  }

  get bodySchema() {
    let property = 'responseBodySchema';

    if (this.statusCode >= 300) {
      property = 'responseErrorSchema';
    }

    return this._bodySchema || this.ancestor(Action)[property];
  }

  set bodySchema(schema) {
    this._bodySchema = schema;
  }

  get bodySchemaSourcemap() {
    return this._bodySchemaSourcemap ||
      this.ancestor(Action).responseBodySchemaSourcemap;
  }

  set bodySchemaSourcemap(sourcemap) {
    this._bodySchemaSourcemap = sourcemap;
  }
};
