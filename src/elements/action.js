const defaults = require('lodash.defaults');
const UriBaseElement = require('./uri-base');

module.exports = class Action extends UriBaseElement {
  constructor(options) {
    defaults(options, {
      name: 'Action',
      tags: [],
      Id: null,
      IdSourcemap: null,
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
      name: this.name,
      description: this.description,
      tags: (this.tags || []).map((tag) => tag.name),
      uriTemplate: this._uriTemplate,
      uriParams: this._uriParams,
      uriParamsSchema: this.uriParamsSchema
    };
  }

  get sourcemap() {
    return super.sourcemap || this.methodSourcemap;
  }
};
