# odata2ts Examples

These examples use publicly available OData services from odata.org to show how to integrate `odata2ts`.
They were also used internally as basis for integration tests, a time from which some tests are still left.

However, these public available services are all problematic in their own way:

- not all features are implemented
- all have their own bugs
- and state manipulation is a problem on its own

So this is more of a stale archive now than anything else.

## Trippin

OData2ts generation example based on the publicly available [Trippin service](https://www.odata.org/odata-services/).

The Trippin service is a V4 OData service and features a variety of different types
(enums, complex types, collections of those, collections of primitive types) and functionalities.
The Trippin service serves as basis of a variety of examples.

### The Domain

Contains a lot of features like different data types, `Enum`, `Complex Type` extending `Complex Type`,
primitive collections, `Singleton` etc.
Hence, the model is more complex than other examples.

Here's just an excerpt of the most important domain models:

- Person
  - key: "UserName"
  - associations
    - Friends (Collection\<Person\>)
    - BestFriend (Person)
    - Trips (Collection\<Trip\>)
- Trip
  - key: "TripId"
  - associations
    - multiple PlanItems (Flights)
- Flight
  - extends PublicTransportation extends PlanItems
  - key: "PlanItemId"
  - associations
    - one Airline
    - two Airports (from & to)
- Airline
  - key: "AirlineCode"
- Airport
  - key: "IcaoCode"
  - complex types
    - Location

### Entry Points

- People
- Airlines
- Airports
- Me (example of a `Singleton`)

## OData V2 Example

OData2ts generation example based on the publicly available [OData V2 service](https://www.odata.org/odata-services/)
(switch to tab "OData v2").

### The Domain

Straight-forward and simple:

- Product
  - key: "ID"
  - associations
    - one Category
    - one Supplier
- Category
  - key: "ID"
  - associations
    - multiple Products
- Supplier
  - key: "ID"
  - complex types
    - Address
  - associations
    - multiple Products

### Entry Points

- Products
- Categories
- Suppliers

## Building

Unlike the core packages, this example is **not** covered by the `src` dev-resolution (TypeScript `paths` /
Vitest alias) that lets the individual packages type-check and test without a prior build. Two things here
depend on **compiled** output and therefore require a build up front:

- `yarn generate` invokes the `odata2ts` binary (`packages/odata2ts/lib/run-cli.js`) — a real Node process,
  so the generator must be built.
- The generated code and its tests resolve the runtime packages (`@odata2ts/odata-service` etc.) through
  their `lib/` at runtime, so those must be built too.

So before generating or running the tests in this directory, build once from the repo root:

```
yarn build
```

This runs the topological build (`odata-core` → `odata-query-objects` → `odata-query-builder` →
`odata-service` → `odata2ts`) in the correct order. Only then run `yarn generate` and `yarn test` here.
