[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/odata2ts/odata2ts/coverage.yml?branch=main&style=for-the-badge)](https://github.com/odata2ts/odata2ts/actions/workflows/coverage.yml)
[![Coveralls](https://img.shields.io/coveralls/github/odata2ts/odata2ts?style=for-the-badge)](https://coveralls.io/github/odata2ts/odata2ts?branch=main)

# odata2ts

If you use TypeScript and need to interact with an OData service, then `odata2ts` might
be for you. It centers around the generation of TypeScript artefacts
out of readily available metadata descriptions of given OData services.

With the help of `odata2ts` you can:

- generate tailor-made TypeScript model interfaces for entities, complex types and what not
- generate a full-fledged, domain-savvy OData client supporting type-safe queries, CRUD operations and more

Feature Highlights:

- support for OData V2 and V4
- generation of compiled JS / DTS or (prettified) TypeScript files
- allows for handling multiple OData services
- TypeScript based configuration file
- powerful, type-safe and fluent query builder
- use existing or own converters to interact with data types of your choice
- allows for name mappings of attributes

The generated code artefacts can be used in Browser or Node.js environments.

## Documentation

[Getting Started](https://odata2ts.github.io/docs/category/getting-started)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Testing Strategy

1. Unit tests cover the generator and the runtime packages themselves
2. `int-test/cli` covers the generation run: argument parsing, config discovery, service selection
3. `int-test/config-variants` generates the same model under a set of configurations and type-checks the result
4. `int-test/asp-net`, `int-test/cap` and `int-test/olingo-v2` run generated clients against real OData servers

Since `odata2ts` has quite some few configuration options, it becomes relevant to distinguish between 3 (cheap)
and 4 (expensive) and where an option takes effect is the decisive factor of how it is tested:

- options that only shape the generated code are type checked only
- options that rename properties, change the value (type converter), URL or payload, are tested against a running server

Each server tries to implement the same ["Library" reference model](https://github.com/odata2ts/test-reference-model).
The server implementations:

- ASP.NET Core: Feature rich, probably most spec compliant, Microsoft backed and V4 only
- SAP CAP: Feature rich, with fast development cycles, v4 based, diverges from OData spec, especially composition over inheritance
- Apache Olingo 2: Stable and actually archived already, but maybe the only viable V2 server to be easily containerizeds

See [int-test](https://github.com/odata2ts/odata2ts/tree/main/int-test) for the details and actual usage examples
against real servers.

## Support, Feedback, Contributing

This project is open to bug reports and feature requests via [GitHub issues](https://github.com/odata2ts/odata2ts/issues).
For suggestions, usage questions and everything else via [GitHub Discussions](https://github.com/odata2ts/odata2ts/discussions).

Contributions and feedback are welcome.

See the [contribution guidelines](https://github.com/odata2ts/odata2ts/blob/main/CONTRIBUTING.md) for further information.

## Spirit

This project has been created and is maintained in the following spirit:

- abstract away OData implementation details where possible
- must be easy to use
- strive for the same API regarding V2 and V4 while favouring the latter
- adhere to the **OData specification** as much as possible
  - support any OData service implementation which conforms to the spec
  - allow to work around faulty implementations if possible
- stability matters
  - bomb the place with unit tests (code coverage > 95%)
  - ensure that assumptions & understanding are correct by integration tests

## License

MIT - see [License](./LICENSE).
