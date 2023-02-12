[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-builder?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-query-builder)

# OData Query Builder

Allows for building type-safe OData queries.

The query builder depends on generated models and q-objects to offer a powerful and easy-to-use API.
Models and q-objects are generated via `odata2ts` out of an existing OData service.

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

## Documentation
Main documentation for the odata2ts eco system:
[https://odata2ts.github.io](https://odata2ts.github.io/)

## Examples
See [example packages](https://github.com/odata2ts/odata2ts/tree/main/examples) for examples of how to integrate `odata2ts`.

## Spirit
* Adhere to the OData specification as much as possible
* Test Driven Development
* High Code Coverage: > 90%

## License
MIT
