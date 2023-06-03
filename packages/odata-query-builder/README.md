[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-builder?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-query-builder)

# OData Query Builder

The **OData Query Builder** allows for building type-safe OData queries for V2 and V4 services.

The query builder depends on generated models and q-objects to offer a powerful and easy-to-use API.
These models and q-objects are generated via [odata2ts](https://github.com/odata2ts/odata2ts) out of an existing OData service.

The query builder offers operations which you probably know from SQL:
`select`, `filter`, `count`, `skip`, `top`. 
You also get the ability to expand related entities which in turn can be
filtered, selected or further expanded.

Selecting and expanding really means that the client has the power to shape the response structure.
[GraphQL](https://graphql.org/) should come to mind...

Additionally, OData V4 specifies even more functionalities like searching or aggregation.

## What Does it Look Like?

A complex query could look like this:

```ts
import { createUriBuilderV4 } from "@odata2ts/odata-uri-builder";
import { qPerson } from "../generated-src/QTrippin.ts"

// In this minimal example the path ("People") as well as the q-object (qPerson) are provided manually.
// When using the generated service you will be provided with the builder and the proper q-object
createQueryBuilderV4("People", qPerson)
  .select("lastName", "age")                            // typesafe: only model attributes are allowed
  .filter(qPerson.userName.equals("russellwhyte"))      // typesafe: only string values are allowed for comparison with string props
  .expand("homeAddress")                                // typesafe: only expandable properties are allowed
  .expanding("trips", (builder, qTrip) => {             // typesafe: only expandable properties are allowed
    builder
      .select("tripId", "budget", "description")
      .top(1)
      .filter(qTrip.budget.gt(1000));
  })
  .build();

```
Result without encoding:<br>
`/People?$select=LastName,Age`<br>
`&$filter=UserName eq 'russellwhyte'`<br>
`&$expand=HomeAddress,Trips($select=TripId,Budget,Description;top=5;$filter=Budget gt 1000)`

## Server Capabilities
Be aware that the OData service you use does not have to implement all querying capabilities.

When using an unsupported operation, then the server should respond with `501: Not Implemented`
(since the world's not perfect, you might face `500: Server Error` instead).

Some OData services advertise their capabilities via annotations, but this is not covered by
the OData spec. In any case `odata2ts` doesn't support annotations currently.

## Inspiration
The approach of generating certain objects to provide type-specific and type-safe query capabilities is by no means an
invention of `odata2ts`. On the contrary, `odata2ts` has been built in order to realize this approach for the domain
of OData queries.

For us, this concept originates in two outstanding Java libraries which are designed for the domain of
database queries: [QueryDsl](https://querydsl.com/) and [jOOQ](https://www.jooq.org/).

`odata2ts` diverges in some aspects from those libraries, but the similarities should be quite obvious,
especially when it comes to filtering.

## Documentation
[Query Builder Documentation](https://odata2ts.github.io/docs/query-builder/overview-and-setup)

Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Tests
See folder [test](https://github.com/odata2ts/odata2ts/tree/main/packages/odata-query-builder/test) 
for unit tests.

The [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) also contain some
integration tests for querying.

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
