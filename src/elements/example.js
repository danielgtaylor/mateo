const BaseElement = require('./base');
const defaults = require('lodash.defaults');

module.exports = class Example extends BaseElement {
  constructor(options) {
    defaults(options, {
      request: null,
      response: null
    });
    super(options);
  }
};
