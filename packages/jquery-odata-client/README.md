[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/jquery-odata-client?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/jquery-odata-client)

# JQuery OData Client
[odata2ts](https://github.com/odata2ts/odata2ts) compatible odata client based on [JQuery](https://jquery.com/).

The **JQuery OData Client** serves as HTTP client for `odata2ts`.
It uses [JQuery](https://jquery.com/) to perform HTTP requests, specifically the [ajax method](https://api.jquery.com/Jquery.ajax/).

JQuery is used by this client but not installed (declared as peer dependency).
The existing JQuery instance must be provided when initializing the client.

The whole client is meant to support usage of `odata2ts` in UI5 apps, which use Jquery for HTTP communication.

## Setup

Install package `@odata2ts/jquery-odata-client` as runtime dependency:

```bash
npm install --save @odata2ts/jquery-odata-client
```

JQuery is a peer-dependency of this package, so it's not contained in or installed through this package.

## Documentation
Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

On-Topic: [JQuery OData Client Documentation](https://odata2ts.github.io/docs/http-client/jquery-odata-client)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`.

## Tests
Admittedly, there are no unit tests as of now.

## Support, Feedback, Contributing
This project is open to feature requests, suggestions, bug reports, usage questions etc.
via [GitHub issues](https://github.com/odata2ts/odata2ts/issues).

Contributions and feedback are encouraged and always welcome.

## License
MIT - see [License](./LICENSE).
