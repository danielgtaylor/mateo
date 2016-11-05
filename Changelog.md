# 0.3.0 - 2016-11-5

- All elements now have a `root` property, which is the root of the element
  tree, e.g. the top level API element in most cases.
- Add API-unique `id` to tags, resources, actions, examples, requests, and
  responses.
- Add `urlSafeId` property to all elements which have an `id`.
- Add `Header` element.
- Some JSON serialization fixes to make debugging easier.
- Additional test coverage.

# 0.2.0 - 2016-11-01

- Add `uriTemplateElements` convenience generator.
- Refactor request/response to use common `TransactionMixin`.
- Add status code sourcemaps.
- Additional test coverage.

# 0.1.0 - 2016-10-31

- Initial release.
