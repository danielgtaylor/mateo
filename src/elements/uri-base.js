const NamedElement = require('./named-element');
const defaults = require('lodash.defaults');

const OVERRIDE = Symbol('override');

// By default, my value always overwrites the parent value
function defaultOverride(parentValue, myValue) {
  return (myValue !== undefined && myValue !== null) ? myValue : parentValue;
}

// My parameters need to be merged with parent parameters, Removing
// any duplicates by name. If a duplicate exists, then use the one
// from my parameters rather than the parent paremeters.
function paramOverride(parentParams, myParams) {
  const seen = {};
  const all = (parentParams || []).concat(myParams || []);

  for (let i = all.length - 1; i > 0; i--) {
    if (seen[all[i].name]) {
      all.splice(i, 1);
      continue;
    }

    seen[all[i].name] = true;
  }

  return all;
}

module.exports = class UriBaseElement extends NamedElement {
  constructor(options) {
    defaults(options, {
      _uriTemplate: null,
      _uriTemplateSourcemap: null,
      _uriParams: null,
      _uriParamsSchema: null,
    });
    super(options);
  }

  [OVERRIDE](name, mergeFunc = defaultOverride) {
    const ancestor = this.ancestor(UriBaseElement);
    const parentValue = ancestor && ancestor[name];
    const myValue = this[`_${name}`];

    return mergeFunc(parentValue, myValue);
  }

  get hasOwnUriTemplate() {
    return !!this._uriTemplate;
  }

  get uriTemplate() {
    return this[OVERRIDE]('uriTemplate');
  }

  set uriTemplate(uriTemplate) {
    this._uriTemplate = uriTemplate;
  }

  get uriTemplateSourcemap() {
    return this[OVERRIDE]('uriTemplateSourcemap');
  }

  set uriTemplateSourcemap(sourcemap) {
    this._uriTemplateSourcemap = sourcemap;
  }

  get hasOwnUriParams() {
    return !!this._uriParams;
  }

  get ownUriParams() {
    return this._uriParams;
  }

  get uriParams() {
    return this[OVERRIDE]('uriParams', paramOverride);
  }

  set uriParams(uriParams) {
    this._uriParams = uriParams;
  }

  get uriParamsExample() {
    const example = {};

    for (const param of this.uriParams || []) {
      example[param.name] = param.example;
    }

    return example;
  }

  get hasOwnUriParamsSchema() {
    return !!this._uriParamsSchema;
  }

  get uriParamsSchema() {
    return this[OVERRIDE]('uriParamsSchema');
  }

  set uriParamsSchema(uriParamsSchema) {
    this._uriParamsSchema = uriParamsSchema;
  }
};
