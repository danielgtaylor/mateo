const NamedElement = require('./named-element');
const defaults = require('lodash.defaults');

module.exports = class UriParameter extends NamedElement {
  constructor(options) {
    defaults(options, {
      name: '',
      example: null,
    });
    super(options);
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      example: this.example
    };
  }

  get sourcemap() {
    return super.sourcemap || this.nameSourcemap || this.exampleSourcemap;
  }
};
