[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/odata2ts/odata2ts/coverage.yml?branch=main&style=for-the-badge)](https://github.com/odata2ts/odata2ts/actions/workflows/coverage.yml)
[![Coveralls](https://img.shields.io/coveralls/github/odata2ts/odata2ts?style=for-the-badge)](https://coveralls.io/github/odata2ts/odata2ts?branch=main)

# odata2ts

If you use TypeScript and need to interact with an OData service, then `odata2ts` might
be for you. It centers around the generation of TypeScript artefacts 
out of readily available metadata descriptions of given OData services.

With the help of `odata2ts` you can:
* generate tailor-made TypeScript model interfaces for entities, complex types and what not
* generate powerful q-objects to leverage the type-safe and fluent query builder 
* generate a full-fledged, domain-savvy OData client supporting type-safe queries, CRUD operations and more

Feature Highlights:
* support for OData V2 and V4
* generation of compiled JS / DTS or (prettified) TypeScript files
* allows for handling multiple odata services
* TypeScript based configuration file
* powerful, type-safe and fluent query builder
* use existing or own converters to interact with data types of your choice
* allows for name mappings of attributes

The generated code artefacts can be used in Browser or Node.js environments.


## Documentation
Main documentation for the odata2ts eco system: 
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`. 

## Spirit
* Adhere to the OData specification as much as possible
* Test Driven Development
* High Code Coverage: > 90%

## License
MIT
