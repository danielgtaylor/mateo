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

/*
  Get the value of a refract element at the given path. For example,
  a `path` of `foo.bar` would search for a property named `foo`,
  then within that property look for another property named `bar`, then
  if that element has been refracted it will find its `content` and
  return the value.
*/
function v(root, path, defaultValue) {
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
function s(root, path) {
  return v(root, `${path ? path + '.' : ''}attributes.sourceMap[0]`, null);
}

/*
  Determine whether an element contains the class name in `meta.classes`.
*/
function hasClass(element, className) {
  return v(element, 'meta.classes', []).indexOf(className) !== -1;
}

function importApiElements(element) {
  const contents = handleNestedContent(null, element);

  // There should only ever be one API category
  const api = contents.filter((item) => item instanceof Api)[0];

  return api;
}

/*
  Get the name and description of an element, using a default value for
  the name if none is given.
*/
function getNameDescription(instance, element, defaultValue='') {
  instance.name = v(element, 'meta.title', defaultValue);
  instance.description = v(element, 'meta.description', '');

  instance.nameSourcemap = s(element, 'meta.title');
  instance.descriptionSourcemap = s(element, 'meta.description');

  for (const item of v(element, 'content', [])) {
    switch (item.element) {
    case 'copy':
      instance.description = `${instance.description}\n${v(item)}`.trim();
      // Resetting the sourcemap isn't technically correct, but it works
      // in practice and is easier than combining them.
      instance.descriptionSourcemap = s(item);
      break;
    }
  }
}

/*
  Transform a list of elements into a list of instances. Useful to handle
  e.g. element.contents for elements which contain other elements.
*/
function handleNested(parent, elementList) {
  let results = [];

  for (const item of elementList ? elementList : []) {
    if (item === undefined) {
      continue;
    }

    switch (item.element) {
    case 'category':
      if (hasClass(item, 'api')) {
        results.push(handleApiElement(item));
      } else if (hasClass(item, 'resourceGroup')) {
        const [tag, resources] = handleTagElement(parent, item);

        results.push(tag);

        for (const resource of resources) {
          results.push(resource);
        }
      }
      break;
    case 'resource':
      results.push(handleResourceElement(parent, item));
      break;
    case 'transition':
      results.push(handleActionElement(parent, item));
      break;
    case 'httpTransaction':
      results.push(handleExampleElement(parent, item));
      break;
    case 'httpRequest':
      results.push(handleRequestElement(parent, item));
      break;
    case 'httpResponse':
      results.push(handleResponseElement(parent, item));
      break;
    }
  }

  return results;
}

/*
  Shortcut to call `handleNested` on the element's content array
*/
function handleNestedContent(parent, element) {
  return handleNested(parent, v(element, 'content', []));
}

function handleApiElement(element) {
  const api = new Api();

  getNameDescription(api, element);

  for(const item of v(element, 'attributes.meta', [])) {
    if (v(item, 'content.key', '') === 'HOST') {
      api.servers.push(new Server({
        uriTemplate: v(item, 'content.value'),
        uriTemplateSourcemap: s(item)
      }));
    }
  }

  const contents = handleNestedContent(api, element);
  api.tags = contents.filter((item) => item instanceof Tag);
  api.resources = contents.filter((item) => item instanceof Resource);

  return api;
}

function handleTagElement(parent, element) {
  const tag = new Tag({parent});

  getNameDescription(tag, element);

  const contents = handleNestedContent(tag, element);

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

function handleResourceElement(parent, element) {
  const resource = new Resource({parent});

  getNameDescription(resource, element);

  resource.uriTemplate = v(element, 'attributes.href', '');
  resource.uriTemplateSourcemap = s(element, 'attributes.href');

  getUriParameters(resource, element);

  const contents = handleNestedContent(resource, element);
  resource.actions = contents.filter((item) => item instanceof Action);

  return resource;
}

function handleActionElement(parent, element) {
  const action = new Action({parent});

  getNameDescription(action, element);

  action.uriTemplate = v(element, 'attributes.href');
  action.uriTemplateSourcemap = s(element, 'attributes.href');

  for (const transaction of v(element, '', [])) {
    if (transaction && transaction.element === 'httpTransaction') {
      for (const asset of v(transaction, '', [])) {
        if (asset && asset.element === 'httpRequest') {
          if (!action.method) {
            action.method = v(asset, 'attributes.method');
            action.methodSourcemap = s(asset, 'attributes.method');
          }

          if (!action.requestBodySchema) {
            const requestBodySchema = v(asset, 'content', []).filter(
              (item) => hasClass(item, 'messageBodySchema')
            )[0];
            action.requestBodySchema = v(requestBodySchema);
            action.requestBodySchemaSourcemap = s(requestBodySchema);
          }
        } else if (asset && asset.element === 'httpResponse') {
          if (!action.responseBodySchema) {
            const responseBodySchema = v(asset, 'content', []).filter(
              (item) => hasClass(item, 'messageBodySchema')
            )[0];
            action.responseBodySchema = v(responseBodySchema);
            action.responseBodySchemaSourcemap = s(responseBodySchema);
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

  getUriParameters(action, element, parent);

  const contents = handleNestedContent(action, element);
  action.examples = contents.filter((item) => item instanceof Example);

  return action;
}

function handleExampleElement(parent, element) {
  const example = new Example({parent});

  const contents = handleNestedContent(example, element);
  example.request = contents.filter((item) => item instanceof Request)[0];
  example.response = contents.filter((item) => item instanceof Response)[0];

  return example;
}

function getAssets(instance, element) {
  const assets = v(element, 'content', []).filter(
    (item) => item && item.element === 'asset');

  const body = assets.filter(
    (item) => hasClass(item, 'messageBody')
  )[0];

  instance.body = v(body);
  instance.bodySourcemap = s(body);
}

function getHeaders(instance, element) {
  instance.headers = v(element, 'attributes.headers', [])
    .map((member) => {
      return new Header({
        name: v(member, 'content.key'),
        description: v(member, 'meta.description'),
        example: v(member, 'content.value'),
        sourcemap: s(member)
      });
    });
}

function handleRequestElement(parent, element) {
  const request = new Request({parent});

  getNameDescription(request, element, '');
  getUriParameters(request, element, parent);
  getHeaders(request, element);
  getAssets(request, element);

  return request;
}

function handleResponseElement(parent, element) {
  const response = new Response({parent});

  getNameDescription(response, element, '');
  getHeaders(response, element);
  getAssets(response, element);

  response.statusCode = parseInt(
    v(element, 'attributes.statusCode', '200'), 10);
  response.statusCodeSourcemap = s(element, 'attributes.statusCode');

  return response;
}

function getUriParameters(instance, element) {
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

  for (const member of v(element, 'attributes.hrefVariables', [])) {
    let parameter = handleHrefVariable(member, schema);
    parameter.parent = instance;
    parameters.push(parameter);
  }

  if (parameters.length) {
    instance.uriParams = parameters;
    instance.uriParamsSchema = JSON.stringify(schema, null, 2);
  }
}

function handleHrefVariable(element, allSchema) {
  const parameter = new UriParameter();

  parameter.sourcemap = s(element);

  parameter.name = v(element, 'content.key', '');
  parameter.nameSourcemap = s(element, 'content.key');

  parameter.description = v(element, 'attributes.description', '');
  parameter.descriptionSourcemap = s(element, 'attributes.description');

  let type = v(element, 'content.value.element', 'string');
  let required = v(element, 'attributes.typeAttributes', [])
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
    parameter.example = v(element, 'content.value.content[0]');
  } else {
    parameter.example = v(element, 'content.value', '');
  }

  parameter.exampleSourcemap = s(element, 'content.value');

  return parameter;
}

module.exports = {import: importApiElements};
