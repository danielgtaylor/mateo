const defaults = require('lodash.defaults');
const UriBaseElement = require('./uri-base');

module.exports = class Resource extends UriBaseElement {
  constructor(options) {
    defaults(options, {
      name: 'Resource',
      tags: [],
      actions: []
    });
    super(options);
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      uriTemplate: this._uriTemplate,
      uriParams: this._uriParams,
      uriParamsSchema: this.uriParamsSchema,
      actions: this.actions
    };
  }

  get sourcemap() {
    return super.sourcemap || this.uriTemplateSourcemap;
  }
};
