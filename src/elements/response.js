const defaults = require('lodash.defaults');
const NamedElement = require('./named-element');
const TransactionMixin = require('./transaction-mixin');

module.exports = class Response extends TransactionMixin(NamedElement) {
  constructor(options) {
    defaults(options, {
      name: '',
      statusCode: 200,
      statusCodeSourcemap: null
    });
    super(options);
  }
};
