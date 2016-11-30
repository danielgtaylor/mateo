# 0.6.0 - 2016-11-29

- Upgrade to Hercule 3.2.2 for better sourcemap support from API Blueprint input with multiple referenced files.
- Differentiate between success and error response schemas. An `Action` now has both `responseBodySchema` and `responseErrorSchema` available if responses with <400 and >=400 status codes are present, respectively. Individual responses continue to just have a `bodySchema` regardless of status code.
- Fix a bug where a request would fall back to the action's response schema rather than the request schema.

# 0.5.0 - 2016-11-17

- Expose parser annotations via the `api.annotations` property. The sourcemaps match the new format from Mateo 0.4.0 described below.
- Add a new optional promise-based interface by leaving off the callback.

# 0.4.0 - 2016-11-16

- Use [Hercule](https://github.com/jamesramsay/hercule) for API Blueprint transclusion.
- Updated source map format. They now look like:

  ```js
  {
    original: {
      source: 'included.apib'
      line: 3,
      column: 0
    },
    generated: {
      pos: 45,
      line: 5,
      column: 0
    },
    length: 10
  }
  ```

- `Mateo.parse` now takes an options object where you can set the `options.filename` when parsing string input.

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
