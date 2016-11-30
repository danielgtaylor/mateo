const defaults = require('lodash.defaults');

module.exports = Base => class TransactionMixin extends Base {
  constructor(options) {
    defaults(options, {
      headers: [],
      body: '',
      bodySourcemap: null,
      _bodySchema: null,
      _bodySchemaSourcemap: null
    });
    super(options);
  }

  get contentType() {
    return this.headers
      .filter((header) => header.name.toLowerCase() === 'content-type')
      .map((header) => header.example)[0];
  }

  get contentTypeSourcemap() {
    return this.headers
      .filter((header) => header.name.toLowerCase() === 'content-type')
      .map((header) => header.sourcemap)[0] || this.sourcemap;
  }

  get sourcemap() {
    return this._sourcemap || this.bodySourcemap || this.bodySchemaSourcemap;
  }
};
