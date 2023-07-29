[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata2ts?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata2ts)

# odata2ts

The basic idea of `odata2ts` is to leverage the readily available metadata of any OData service
to generate different sorts of typed artefacts which you use in your TypeScript code.
This package (`@odata2ts/odata2ts`) realizes the generation process.

The generator is supposed to be used with a TypeScript based configuration file.
Then it's able to handle the generation for multiple OData services.

It comes with powerful configuration options. Some highlights:

- generation of TypeScript files or compiled JS / DTS files
- name or rename stuff
  - naming of pretty much any aspect of the generated artefacts
  - e.g. all types should be prefixed with an "I", Person => IPerson
  - consistent casing (as in "camelCase" or "PascalCase") even for property names of entity types
- use type converters

See the [generator documentation](https://odata2ts.github.io/docs/generator/setup-and-usage) for more information.

## Installation

```
npm install --save-dev @odata2ts/odata2ts
```

### Implicit Dependencies

Most of the generated artefacts depend on other libraries. `odata2ts` lists them as peer dependencies.

Depending on your use case, you will need to add runtime dependencies matching the mentioned peer dependencies.
See the [Getting Started Guide](https://odata2ts.github.io/docs/category/getting-started/) of the documentation
for guidance.

## Documentation

[Generator Documentation](https://odata2ts.github.io/docs/generator/setup-and-usage)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Examples

See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`.

## Tests

See folder [test](https://github.com/odata2ts/odata2ts/tree/main/packages/odata2ts/test)
for unit tests.

See folder [int-test](https://github.com/odata2ts/odata2ts/tree/main/packages/odata2ts/int-test) for integration
tests of the CLI.

Each example package serves as integration test of the generator.

## Support, Feedback, Contributing

This project is open to feature requests, suggestions, bug reports, usage questions etc.
via [GitHub issues](https://github.com/odata2ts/odata2ts/issues).

Contributions and feedback are encouraged and always welcome.

See the [contribution guidelines](https://github.com/odata2ts/odata2ts/blob/main/CONTRIBUTING.md) for further information.

## Spirit

This project and this module have been created and are maintained in the following spirit:

- adhere to the **OData specification** as much as possible
  - support any OData service implementation which conforms to the spec
  - allow to work around faulty implementations if possible
- stability matters
  - exercise Test Driven Development
  - bomb the place with unit tests (code coverage > 95%)
  - ensure that assumptions & understanding are correct by creating integration tests

## License

MIT - see [License](./LICENSE).
