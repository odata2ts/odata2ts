[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/fetch-odata-client?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/fetch-odata-client)

# Fetch OData Client
The **Fetch OData Client** serves as HTTP client for [odata2ts](https://github.com/odata2ts/odata2ts)
and uses - as its name suggests - [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 
for realizing the HTTP communication.

It supports:

- request configuration
- automatic CSRF token handling

## Installation

Install package `@odata2ts/fetch-odata-client` as runtime dependency:

```bash
npm install --save @odata2ts/fetch-odata-client
```

## Documentation
[Fetch OData Client](https://odata2ts.github.io/docs/http-client/fetch-odata-client)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how
to integrate the client.

## Tests
Admittedly, there are no unit tests as of now.

However, the Axios OData Client is used by most integration tests.
See [examples](#examples) and watch out for the `int-test` folder:
[Trippin example](https://github.com/odata2ts/odata2ts/blob/main/examples/trippin/int-test/TrippinIntegration.test.ts).

## Support, Feedback, Contributing

This project is open to feature requests, suggestions, bug reports, usage questions etc. 
via [GitHub issues](https://github.com/odata2ts/odata2ts/issues). 

Contributions and feedback are encouraged and always welcome.

See the [contribution guidelines](https://github.com/odata2ts/odata2ts/blob/main/CONTRIBUTING.md) for further information.

## License
MIT - see [License](./LICENSE).
