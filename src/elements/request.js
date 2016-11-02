const defaults = require('lodash.defaults');
const TransactionMixin = require('./transaction-mixin');
const UriBaseElement = require('./uri-base');

module.exports = class Request extends TransactionMixin(UriBaseElement) {
  constructor(options) {
    defaults(options, {
      name: 'Request',
    });
    super(options);
  }
};
