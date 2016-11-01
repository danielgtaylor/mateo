const defaults = require('lodash.defaults');
const merge = require('lodash.merge');

module.exports = class BaseElement {
  constructor(options={}) {
    defaults(options, {
      parent: null,
      _sourcemap: null,
    });
    merge(this, options);
  }

  get sourcemap() {
    return this._sourcemap;
  }

  set sourcemap(sourcemap) {
    this._sourcemap = sourcemap;
  }

  ancestor(type) {
    let ancestor = this.parent;

    while (ancestor) {
      if (!type) {
        break;
      } else if (ancestor instanceof type) {
        break;
      }

      ancestor = ancestor.parent;
    }

    return ancestor;
  }
};
