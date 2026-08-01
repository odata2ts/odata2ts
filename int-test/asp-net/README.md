# Integration Tests: ASP.NET Core

Runs odata2ts against [`odata2ts/test-server-asp-net`](https://github.com/odata2ts/test-server-asp-net),
the ASP.NET Core implementation of the standardized "Library" OData V4 feature test model.

See [../README.md](../README.md) for how this group fits into the repository and for the test-file scheme
used here. The server is consumed as a Docker image, started and stopped around the test run by
`test/globalSetup.ts`:

```bash
yarn int-test:asp-net
```

Override the image with `ASPNET_SERVER_IMAGE`, or point at an already running server with
`LIBRARY_BASE_URL` to work without Docker.

## Why this package exists next to `cap`

The same reference model, a completely different server stack - which is the point: a feature that works
against one implementation is not thereby proven. Two things in particular are only testable here.

**The binding notations.** `test/feature/Binding.test.ts` is the first place `@odata.bind` and the 4.01
`{"@id": …}` are exercised end to end. Until now the feature (odata2ts#38) was proven at generator level
only, against fixtures - and a fixture cannot show that the link actually moved on the other side. The
file asserts the round trip _and_ that the previously linked entity is left untouched, because getting
that wrong is silent: the server answers 204 either way.

**Query options in the request body.** `test/feature/QueryInRequestBody.test.ts` proves odata2ts#383:
`asPostRequest()` moves the query string into a `text/plain` body of `POST <resource>/$query`. It is the
only end-to-end coverage the feature has, because the live Trippin service does not implement `$query` -
it answers 500 to any POST against it, whatever the body, and so cannot tell a correct request from a
broken one. The file also covers the case the feature exists for: a query whose URL exceeds the server's
8 KB request line, rejected as a GET and answered as a POST.

**Operation overloads.** The reference model carries two overload pairs, and generating this client is
what surfaced odata2ts#423 - both overloads produced the same Q-object name, so the generated file did
not compile. `test/core/Operations.test.ts` covers the resulting behaviour.

## Generation

The client is generated offline from `resource/library.xml`, a committed snapshot of the server's actual
`$metadata`, so generation stays server-independent. That metadata deliberately is what ASP.NET Core
OData really emits, not the idealized reference model: it has no `TypeDefinition`, no `Partner`
attributes and no `SRID` facets, none of which the model builder can express. The server's
`FEATURE-COVERAGE.md` records why.

`enableBindingProps` is switched on, since proving the binding notations is the point of this package.
