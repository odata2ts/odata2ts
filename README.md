[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/odata2ts/odata2ts/coverage.yml?branch=main&style=for-the-badge)](https://github.com/odata2ts/odata2ts/actions/workflows/coverage.yml)
[![Coveralls](https://img.shields.io/coveralls/github/odata2ts/odata2ts?style=for-the-badge)](https://coveralls.io/github/odata2ts/odata2ts?branch=main)

# ODATA 2 TS

Monorepo for a set of tools for generating useful stuff out of given OData services:
From TypeScript model interfaces to complete TypeScript based OData client services.

The generated code artefacts can be used in Browser or Node.js environments.

##  Features
* OData V2 and V4 are supported
* generates compiled JS / DTS files or TypeScript files (prettified or not)
* can handle multiple odata services
* typescript based configuration file
* allows to add converters to interact with data types of your choice instead of OData's data formats
  * [v2-to-v4-converter](https://www.npmjs.com/package/@odata2ts/converter-v2-to-v4)
  * [luxon-converter](https://www.npmjs.com/package/@odata2ts/converter-luxon)
  * see [converter-api](https://www.npmjs.com/package/@odata2ts/converter-api) to roll your own converter
* extensive configuration options regarding the naming of the generated artefacts
* configure properties individually
  * name mapping
  * mark property as managed (not editable), e.g. id fields or fields like "lastModified"

## Generated Artefacts
At the heart of the project lies the generator - called `odata2ts` -  which takes the meta description of 
an OData service, evaluates most of its information and generates the following artefacts
based on that information: 

* TypeScript model interfaces
  * per EntityType, ComplexType, Singleton: Model including optional and required properties
  * per EntityType and ComplexType: Editable model versions for create, update, and patch operations
  * per EntityType: Model representing entity id
  * Per Function / Action: Model representing all parameters of that operation
* Query Objects
  * per EntityType, ComplexType, EnumType, and any form of collection: QueryObject for querying
  * per EntityType: one id function to format and parse entity paths, e.g. `/Person(userName='russellwhyte')` 
  * per function or action: QFunction or QAction to handle operation calls
* OData Client Service
  * one main odata service as entry point
  * per EntityType, ComplexType, EnumType, and any form of collection: one service

Each artefact type depends on the existence of the former artefact type. So you can either generate 
1. only models,
2. models and qobjects or 
3. models, qobjects and services.


## Use Cases
In all cases `@odata2ts\odata2ts` should be installed as dev dependency.

### Data Models Only
In the most simple case you are only interested in TypeScript interfaces, representing input and output
models of the given OData service.

Set `mode = models` to only generate models.

Runtime dependencies: None. The generated interfaces do not have any dependencies themselves.

By default `odata2ts` will generate all kinds of models. You can opt out of that via configuration:
* skipEditableModels
* skipIdModels
* skipParamModels

You can also fine-tune the naming of the generated models via config option `naming.models`. 

### Type-safe Querying
The most helpful part of `odata2ts` is the 
[OData Query Builder](https://www.npmjs.com/package/@odata2ts/odata-query-builder) which enables type-safe
querying and offers a fluent API.
It abstracts away the tricky parts about formulating a valid OData URL, reduces the necessary amount of 
knowledge about the OData protocol, and allows for mapped names and converted values.

The query builder makes use of so-called "query-objects", which provide all the necessary functionality.

Set `mode = qobjects` to generate models and query objects.

Runtime dependency: `@odata2ts/odata-query-builder`

You can fine-tune the naming of the generated models via config option `naming.queryObjects`.
All model settings also apply.

### Full-Fledged OData Client
This is the default mode, which can be explicitly set via `mode = services` or `mode = all`.

Runtime dependencies: 
* `@odata2ts/odata-service`
* `@odata2ts/axios-odata-client` or any module implementing `@odata2ts/odata-client-api`

You can fine-tune the naming of the generated services via config option `naming.services`.
All model and query object settings also apply.

## Examples

See `examples` packages for examples of how to integrate `odata2ts`. 

