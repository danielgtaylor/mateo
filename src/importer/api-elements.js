const Api = require('../elements/api');
const Server = require('../elements/server');
const Tag = require('../elements/tag');
const Resource = require('../elements/resource');
const Action = require('../elements/action');
const Example = require('../elements/example');
const Request = require('../elements/request');
const Response = require('../elements/response');
const Header = require('../elements/header');
const UriParameter = require('../elements/uri-parameter');

const get = require('lodash.get');
const {SourceMapConsumer} = require('source-map');

class ApiElementsImporter {
  constructor(sourcemap, source) {
    this.smc = sourcemap ? new SourceMapConsumer(sourcemap) : null;
    this.source = source;
  }

  /*
    Get the value of a refract element at the given path. For example,
    a `path` of `foo.bar` would search for a property named `foo`,
    then within that property look for another property named `bar`, then
    if that element has been refracted it will find its `content` and
    return the value.
  */
  v(root, path, defaultValue) {
    let element = path ? get(root, path) : root;

    while (element && element.content !== undefined) {
      element = element.content;
    }

    if (element && Object.keys(element).length === 1 && typeof(element.element) === 'string') {
      // This is an element but has no `content` key
      element = undefined;
    }

    return (element === undefined) ? defaultValue : element;
  }

  /*
    Get the source map (if present) of a path in the element.
  */
  s(root, path) {
    let sourcemap =  this.v(root,
      `${path ? path + '.' : ''}attributes.sourceMap[0]`, null);

    if (sourcemap) {
      sourcemap = this.convertSourcemap(sourcemap);
    }

    return sourcemap;
  }

  /*
    Determine whether an element contains the class name in `meta.classes`.
  */
  hasClass(element, className) {
    return this.v(element, 'meta.classes', []).indexOf(className) !== -1;
  }

  /*
    Convert from API Elements sourcemap into Mateo sourcemap.
  */
  convertSourcemap(sourcemap) {
    const newSourcemap = [];

    for (const entry of sourcemap) {
      let line = 1;
      let column = 0;

      for (let i = 0; i < entry[0]; i++) {
        column++;
        if (this.source[i] === '\n') {
          line++;
          column = 0;
        }
      }

      if (this.smc) {
        let original;

        // Rather than just getting the original position we have to loop and
        // find the LAST original position element. These are in generated-file
        // order so we just set it until it can't be set anymore.
        this.smc.eachMapping((m) => {
          if (m.generatedLine <= line) {
            original = m;
          }
        });

        newSourcemap.push({
          original: {
            source: original.source,
            line: original.originalLine,
            column: original.originalColumn,
          },
          generated: {
            pos: sourcemap[0][0],
            line,
            column
          },
          length: sourcemap[0][1]
        });
      } else {
        newSourcemap.push({
          original: {
            source: '',
            line,
            column
          },
          generated: {
            pos: sourcemap[0][0],
            line,
            column
          },
          length: sourcemap[0][1]
        });
      }
    }

    return newSourcemap;
  }

  process(element) {
    const contents = this.handleNestedContent(null, element);

    // There should only ever be one API category
    return contents.filter((item) => item instanceof Api)[0];
  }

  /*
    Get the name and description of an element, using a default value for
    the name if none is given.
  */
  getNameDescription(instance, element, defaultValue='') {
    instance.name = this.v(element, 'meta.title', defaultValue);
    instance.description = this.v(element, 'meta.description', '');

    instance.nameSourcemap = this.s(element, 'meta.title');
    instance.descriptionSourcemap = this.s(element, 'meta.description');

    for (const item of this.v(element, 'content', [])) {
      switch (item.element) {
      case 'copy':
        instance.description = `${instance.description}\n${this.v(item)}`.trim();
        // Resetting the sourcemap isn't technically correct, but it works
        // in practice and is easier than combining them.
        instance.descriptionSourcemap = this.s(item);
        break;
      }
    }
  }

  /*
    Transform a list of elements into a list of instances. Useful to handle
    e.g. element.contents for elements which contain other elements.
  */
  handleNested(parent, elementList) {
    let results = [];

    for (const item of elementList ? elementList : []) {
      if (item === undefined) {
        continue;
      }

      switch (item.element) {
      case 'category':
        if (this.hasClass(item, 'api')) {
          results.push(this.handleApiElement(item));
        } else if (this.hasClass(item, 'resourceGroup')) {
          const [tag, resources] = this.handleTagElement(parent, item);

          results.push(tag);

          for (const resource of resources) {
            results.push(resource);
          }
        }
        break;
      case 'resource':
        results.push(this.handleResourceElement(parent, item));
        break;
      case 'transition':
        results.push(this.handleActionElement(parent, item));
        break;
      case 'httpTransaction':
        results.push(this.handleExampleElement(parent, item));
        break;
      case 'httpRequest':
        results.push(this.handleRequestElement(parent, item));
        break;
      case 'httpResponse':
        results.push(this.handleResponseElement(parent, item));
        break;
      }
    }

    return results;
  }

  /*
    Shortcut to call `handleNested` on the element's content array
  */
  handleNestedContent(parent, element) {
    return this.handleNested(parent, this.v(element, 'content', []));
  }

  handleApiElement(element) {
    const api = new Api();

    this.getNameDescription(api, element);

    for(const item of this.v(element, 'attributes.meta', [])) {
      if (this.v(item, 'content.key', '') === 'HOST') {
        api.servers.push(new Server({
          uriTemplate: this.v(item, 'content.value'),
          uriTemplateSourcemap: this.s(item)
        }));
      }
    }

    const contents = this.handleNestedContent(api, element);
    api.tags = contents.filter((item) => item instanceof Tag);
    api.resources = contents.filter((item) => item instanceof Resource);

    return api;
  }

  handleTagElement(parent, element) {
    const tag = new Tag({parent});

    this.getNameDescription(tag, element);

    const contents = this.handleNestedContent(tag, element);

    const resources = contents.filter((item) => item instanceof Resource);

    resources.forEach((resource) => {
      // Resource parent should be the API, not the tag
      resource.parent = parent;

      if (resource.tags === undefined) {
        resource.tags = [];
      }

      if (tag.name) {
        resource.tags.push(tag);
      }
    });

    return [tag, resources];
  }

  handleResourceElement(parent, element) {
    const resource = new Resource({parent});

    this.getNameDescription(resource, element);

    resource.uriTemplate = this.v(element, 'attributes.href', '');
    resource.uriTemplateSourcemap = this.s(element, 'attributes.href');

    this.getUriParameters(resource, element);

    const contents = this.handleNestedContent(resource, element);
    resource.actions = contents.filter((item) => item instanceof Action);

    return resource;
  }

  handleActionElement(parent, element) {
    const action = new Action({parent});

    this.getNameDescription(action, element);

    action.uriTemplate = this.v(element, 'attributes.href');
    action.uriTemplateSourcemap = this.s(element, 'attributes.href');

    for (const transaction of this.v(element, '', [])) {
      if (transaction && transaction.element === 'httpTransaction') {
        for (const asset of this.v(transaction, '', [])) {
          if (asset && asset.element === 'httpRequest') {
            if (!action.method) {
              action.method = this.v(asset, 'attributes.method');
              action.methodSourcemap = this.s(asset, 'attributes.method');
            }

            if (!action.requestBodySchema) {
              const requestBodySchema = this.v(asset, 'content', []).filter(
                (item) => this.hasClass(item, 'messageBodySchema')
              )[0];
              action.requestBodySchema = this.v(requestBodySchema);
              action.requestBodySchemaSourcemap = this.s(requestBodySchema);
            }
          } else if (asset && asset.element === 'httpResponse') {
            if (!action.responseBodySchema) {
              const responseBodySchema = this.v(asset, 'content', []).filter(
                (item) => this.hasClass(item, 'messageBodySchema')
              )[0];
              action.responseBodySchema = this.v(responseBodySchema);
              action.responseBodySchemaSourcemap = this.s(responseBodySchema);
            }
          }
        }
      }
    }

    if (!action.method) {
      // Maybe missing a request, so let's assume this is a GET.
      // This is just a limitation of API Elements (the format).
      action.method = 'GET';
    }

    this.getUriParameters(action, element, parent);

    const contents = this.handleNestedContent(action, element);
    action.examples = contents.filter((item) => item instanceof Example);

    return action;
  }

  handleExampleElement(parent, element) {
    const example = new Example({parent});

    const contents = this.handleNestedContent(example, element);
    example.request = contents.filter((item) => item instanceof Request)[0];
    example.response = contents.filter((item) => item instanceof Response)[0];

    return example;
  }

  getAssets(instance, element) {
    const assets = this.v(element, 'content', []).filter(
      (item) => item && item.element === 'asset');

    const body = assets.filter(
      (item) => this.hasClass(item, 'messageBody')
    )[0];

    instance.body = this.v(body);
    instance.bodySourcemap = this.s(body);
  }

  getHeaders(instance, element) {
    instance.headers = this.v(element, 'attributes.headers', [])
      .map((member) => {
        return new Header({
          name: this.v(member, 'content.key'),
          description: this.v(member, 'meta.description'),
          example: this.v(member, 'content.value'),
          sourcemap: this.s(member)
        });
      });
  }

  handleRequestElement(parent, element) {
    const request = new Request({parent});

    this.getNameDescription(request, element, '');
    this.getUriParameters(request, element, parent);
    this.getHeaders(request, element);
    this.getAssets(request, element);

    return request;
  }

  handleResponseElement(parent, element) {
    const response = new Response({parent});

    this.getNameDescription(response, element, '');
    this.getHeaders(response, element);
    this.getAssets(response, element);

    response.statusCode = parseInt(
      this.v(element, 'attributes.statusCode', '200'), 10);
    response.statusCodeSourcemap = this.s(element, 'attributes.statusCode');

    return response;
  }

  getUriParameters(instance, element) {
    const parameters = [];
    let schema = {
      '$schema': 'http://json-schema.org/draft-04/schema#',
      'type': 'object',
      'properties': {},
      'additionalProperties': false
    };
    let ancestor = instance.parent;

    while (ancestor && !ancestor.uriParamsSchema) {
      ancestor = ancestor.parent;
    }

    if (ancestor && ancestor.uriParamsSchema) {
      schema = JSON.parse(ancestor.uriParamsSchema);
    }

    for (const member of this.v(element, 'attributes.hrefVariables', [])) {
      let parameter = this.handleHrefVariable(member, schema);
      parameter.parent = instance;
      parameters.push(parameter);
    }

    if (parameters.length) {
      instance.uriParams = parameters;
      instance.uriParamsSchema = JSON.stringify(schema, null, 2);
    }
  }

  handleHrefVariable(element, allSchema) {
    const parameter = new UriParameter();

    parameter.sourcemap = this.s(element);

    parameter.name = this.v(element, 'content.key', '');
    parameter.nameSourcemap = this.s(element, 'content.key');

    parameter.description = this.v(element, 'attributes.description', '');
    parameter.descriptionSourcemap = this.s(element, 'attributes.description');

    let type = this.v(element, 'content.value.element', 'string');
    let required = this.v(element, 'attributes.typeAttributes', [])
      .indexOf('required') !== -1;

    let schema = {type};

    allSchema.properties[parameter.name] = schema;

    if (required) {
      if (allSchema.required === undefined) {
        allSchema.required = [];
      }

      allSchema.required.push(parameter.name);
    }

    if (element && element.content && element.content.value && element.content.value.element === 'enum') {
      parameter.example = this.v(element, 'content.value.content[0]');
    } else {
      parameter.example = this.v(element, 'content.value', '');
    }

    parameter.exampleSourcemap = this.s(element, 'content.value');

    return parameter;
  }
}

function importApiElements(element, sourcemap, source) {
  const importer = new ApiElementsImporter(sourcemap, source);
  return importer.process(element);
}

module.exports = {import: importApiElements, ApiElementsImporter};
