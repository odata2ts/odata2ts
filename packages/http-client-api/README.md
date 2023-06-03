[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/http-client-api?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/http-client-api)

# HTTP Client API

Defines the contract between [odata2ts](https://github.com/odata2ts/odata2ts) and any HTTP client implementation.

The responsibilities of the HTTP Client are:
- HTTP request execution
- mapping responses to conventionalized structures
- custom request configuration (optional)
- automatic CSRF Token Handling (optional)

Features like **optimistic locking** (via `ETag`) or **batch requests** are currently not in scope
of the HTTP client and may never be.

## Documentation
[HTTP Client Documentation](https://odata2ts.github.io/docs/odata-client/http-client)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Tests
As this library provides the API as TypeScript types, there are no runtime
artefacts to test.

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
