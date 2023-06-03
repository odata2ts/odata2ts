[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-service?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-service)

# OData Service
Main runtime dependency of [odata2ts](https://github.com/odata2ts/odata2ts) when using
the generated full-fledged odata client.

This module provides the base classes for the generated services and pulls in all other dependencies
like `odata-query-builder` and `odata-query-objects`. 

## Documentation
[Main Service Documentation](https://odata2ts.github.io/docs/category/main-service)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Tests
See folder [test](https://github.com/odata2ts/odata2ts/tree/main/packages/odata-service/test)
for unit tests.

See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for integration tests
using the generated services.

## Support, Feedback, Contributing
This project is open to feature requests, suggestions, bug reports, usage questions etc.
via [GitHub issues](https://github.com/odata2ts/odata2ts/issues).

Contributions and feedback are encouraged and always welcome.

See the [contribution guidelines](https://github.com/odata2ts/odata2ts/blob/main/CONTRIBUTING.md) for further information.

## Spirit
This project and this module have been created and are maintained in the following spirit:

* adhere to the **OData specification** as much as possible
  * support any OData service implementation which conforms to the spec
  * allow to work around faulty implementations if possible
* stability matters
  * exercise Test Driven Development
  * bomb the place with unit tests (code coverage > 95%)
  * ensure that assumptions & understanding are correct by creating integration tests

## License
MIT - see [License](./LICENSE).
