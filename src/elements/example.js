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

  toJSON() {
    return {
      id: this.id,
      request: this.request,
      response: this.response
    };
  }

  get id() {
    let id = '';

    if (this.parent) {
      id += `${this.parent.id} > `;
    }

    id += 'Example';

    return this.getUniqueId(id);
  }
};
