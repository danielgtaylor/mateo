# Mateo API Description Library

This project aims to provide a user-friendly interface to various API description formats, like Open API (Swagger) and API Blueprint, to efficiently build cross-format tools using common sense components. The overwhelming majority of use cases involve reading an API description and taking some (read-only) action:

- Generating documentation
- Generating server or client code
- Running a mock server
- Running automated tests
- Checking for errors / validation

To support these use cases while remaining simple, this library is read-only and cannot be used to edit an API description. This means it is purely a library to consume API description formats and cannot be used to convert between formats. The goals of this library are:

- Be *useful* to developers
- Be *straightforward* to use
- Be *convenient* whenever possible
- Be built on *existing popular standards* whenever possible
- Be built with *real world use cases* in mind

Currently supported API formats:

- API Blueprint
- Swagger 2.0

Due to the nature of various API description formats supporting different features, this library will attempt to massage various pieces to fit into common sense components without losing too much in translation. If you need 100% 1:1 accuracy, you may be better off parsing the format of your choice manually.

**Note**: This library is built using modern Javascript functionality without a transpiler, and thus requires either a recent Node.js version (6.0+) or to be run through a transpiler (e.g. Webpack + Babel for usage in a browser) before being used.

## Library Usage

The Mateo API description library can be installed via `npm`:

```bash
npm install --save mateo
```

Once installed, you can easily parse any supported API format:

```js
import Mateo from 'mateo';

Mateo.parse('...', (err, result) => {
  console.log(result.api);
});
```

## Library Documentation

### `Mateo`

#### `Mateo.parse(apiDescription, done)`

Parse an API description from a `string`. The `result` is a `ParseResult`.

```js
Mateo.parse('...', (err, result) => { /* ... */ });
```

#### `Mateo.parseFile(filename, done)`

Parse an API description from a file. The `api` is an `Api` instance.

```js
Mateo.parseFile('.../file.yaml', (err, api) => { /* ... */ });
```

### TODO

More documentation coming soon.

# License

https://dgt.mit-license.org/
