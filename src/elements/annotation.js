const BaseElement = require('./base');
const defaults = require('lodash.defaults');

module.exports = class Annotation extends BaseElement {
  constructor(options) {
    defaults(options, {
      severity: 'error',
      message: ''
    });
    super(options);
  }

  toJSON() {
    return {
      message: this.message
    };
  }
};
