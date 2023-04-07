[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-client-api?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-client-api)

# OData Client API

Defines the contract between [odata2ts](https://github.com/odata2ts/odata2ts) and any HTTP client implementation.
This API is largely based on how [axios](https://github.com/axios/axios) defines and handles things.

The responsibilities of the HTTP Client are:
- HTTP request execution
- Mapping responses to conventionalized structures
- Custom request configuration (optional)
- Automatic CSRF Token Handling (optional)

Features like **optimistic locking** (via `ETag`) or **batch requests** are currently not in scope
of the HTTP client and may never be.

## Documentation
Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

On-Topic: [OData Client Documentation](https://odata2ts.github.io/docs/http-client/odata-client)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`.

## Tests
As this library provides the API as TypeScript types, there are no runtime
artefacts to test.

## Support, Feedback, Contributing
This project is open to feature requests, suggestions, bug reports, usage questions etc.
via [GitHub issues](https://github.com/odata2ts/odata2ts/issues).

Contributions and feedback are encouraged and always welcome.

## Spirit
* Adhere to the OData specification as much as possible
* Test Driven Development
* High Code Coverage: > 90%

## License
MIT - see [License](./LICENSE).
