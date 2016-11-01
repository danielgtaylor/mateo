const BaseElement = require('./base');
const defaults = require('lodash.defaults');

module.exports = class Server extends BaseElement {
  constructor(options) {
    defaults(options, {
      description: '',
      descriptionSourcemap: null,
      uriTemplate: '',
      uriTemplateSourcemap: null,
      uriParams: null
    });
    super(options);
  }

  toJSON() {
    return {
      description: this.description,
      uriTemplate: this.uriTemplate,
      uriParams: this.uriParams,
    };
  }

  get sourcemap() {
    return super.sourcemap || this.uriTemplateSourcemap || this.descriptionSourcemap;
  }
};
