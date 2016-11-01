const NamedElement = require('./named-element');
const defaults = require('lodash.defaults');

module.exports = class Tag extends NamedElement {
  constructor(options) {
    defaults(options, {
      name: 'Tag'
    });
    super(options);
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description
    };
  }

  *resources() {
    yield* this.parent.resources.filter(
      (resource) => resource.tags.includes(this)
    );
  }

  *actions() {
    for (const resource of this.parent.resources) {
      yield* resource.actions.filter(
        (action) => action.tags && action.tags.includes(this)
      );
    }
  }
};
