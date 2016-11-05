const defaults = require('lodash.defaults');
const UriBaseElement = require('./uri-base');

module.exports = class Action extends UriBaseElement {
  constructor(options) {
    defaults(options, {
      name: 'Action',
      tags: [],
      method: null,
      methodSourcemap: null,
      deprecated: null,
      deprecatedSourcemap: null,
      requestHeadersSchema: null,
      requestBodySchema: null,
      requestBodySchemaSourcemap: null,
      responseHeadersSchema: null,
      responseBodySchema: null,
      responseBodySchemaSourcemap: null,
      examples: [],
    });
    super(options);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tags: this.tags.map(tag => tag.name),
      method: this.method,
      uriTemplate: this._uriTemplate,
      uriParams: this._uriParams,
      uriParamsSchema: this.uriParamsSchema,
      deprecated: this.deprecated,
      requestBodySchema: this.requestBodySchema,
      responseBodySchema: this.responseBodySchema,
      examples: this.examples
    };
  }

  get sourcemap() {
    return super.sourcemap || this.methodSourcemap;
  }

  get id() {
    let id = '';

    if (this.parent) {
      id += `${this.parent.id} > `;
    }

    id += `${this.name || this.method}`;

    return this.getUniqueId(id);
  }
};
