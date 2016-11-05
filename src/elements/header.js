const defaults = require('lodash.defaults');
const NamedElement = require('./named-element');

module.exports = class Header extends NamedElement {
  constructor(options) {
    defaults(options, {
      example: undefined
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
    return super.sourcemap || this.nameSourcemap || this.descriptionSourcemap;
  }
};
