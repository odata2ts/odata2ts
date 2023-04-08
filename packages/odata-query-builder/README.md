[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-builder?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-query-builder)

# OData Query Builder

The **OData Query Builder** allows for building type-safe OData queries.

The query builder depends on generated models and q-objects to offer a powerful and easy-to-use API.
These Models and q-objects are generated via [odata2ts](https://github.com/odata2ts/odata2ts) out of an existing OData service.

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

createQueryBuilderV4("People", qPerson)
  .select("lastName", "age") // => typesafe: only model attributes are allowed
  .filter(qPerson.userName.equals("russellwhyte"))
  .expand("homeAddress") // => typesafe: only expandable properties are allowed
  .expanding("trips", (builder, qTrip) => {
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

## Feature Support
Be aware that the OData service you use does not have to implement all querying functionalities.

When using an unsupported operation, then the server should respond with `501: Not Implemented`
(since the world's not perfect, you might face `500: Server Error` instead).

## Documentation
Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

On-Topic: [Query Builder Documentation](https://odata2ts.github.io/docs/query-builder/overview-and-setup)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`.

## Tests
See folder [test](https://github.com/odata2ts/odata2ts/tree/main/packages/odata-query-builder/test) 
for unit tests.

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
