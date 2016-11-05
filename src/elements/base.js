const defaults = require('lodash.defaults');
const merge = require('lodash.merge');
const slug = require('slug');

slug.defaults.mode = 'rfc3986';

module.exports = class BaseElement {
  constructor(options={}) {
    defaults(options, {
      parent: null,
      _sourcemap: null,
    });
    merge(this, options);
    this._unique_ids = {};
    this._unique_id = null;
  }

  get sourcemap() {
    return this._sourcemap;
  }

  set sourcemap(sourcemap) {
    this._sourcemap = sourcemap;
  }

  get id() {
    return null;
  }

  get urlSafeId() {
    return this.id ? slug(this.id.replace(/>/g, '')) : null;
  }

  // Get a unique (to the element tree root, e.g. API-wide) element ID
  // based on a proposed input. If the input is already taken, then return
  // a proposed unique version of it. This method is a little bit complex
  // because it executes both on individual elements and on the root
  // element. TODO: Consider making this simpler.
  getUniqueId(id) {
    if (this._unique_id) {
      // ID has been cached, so don't recalculate.
      return this._unique_id;
    }

    if (this !== this.root) {
      // We are not the root, so let the root calculate it and then we
      // save it into this element's cache before returning.
      this._unique_id = this.root.getUniqueId(id);
      return this._unique_id;
    }

    // We are the root, so calculate and return the unique ID!
    const base = id;
    let number = 1;
    let unique_id = base;

    while (this._unique_ids[unique_id]) {
      unique_id = `${base} ${number}`;
      number++;
    }

    this._unique_ids[unique_id] = true;

    return unique_id;
  }

  // Get the root of the element tree
  get root() {
    let root = this;

    while(root.parent) {
      root = root.parent;
    }

    return root;
  }

  // Get an ancestor (optionally by type) of this element. If no type
  // is given, it just returns the first parent.
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
