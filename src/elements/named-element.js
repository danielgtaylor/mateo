const BaseElement = require('./base');
const defaults = require('lodash.defaults');

module.exports = class NamedElement extends BaseElement {
  constructor(options={}) {
    defaults(options, {
      name: 'Element',
      nameSourcemap: null,
      description: '',
      descriptionSourcemap: null
    });
    super(options);
  }

  get sourcemap() {
    return super.sourcemap || this.nameSourcemap || this.descriptionSourcemap;
  }
};
