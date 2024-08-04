# odata2ts Examples

These examples serve as example of how to integrate `odata2ts`.

They are also used internally as basis for integration tests.

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

## Feature: Renaming

Minimal naming as well as max renaming options are tested here.

The Trippin service is used, so:

- trippin-min-naming
- trippin-max-renaming

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

## Data Type & Converter Examples

Two handwritten EDMX files come into play to see all data types in action for v2 and v4.
Additionally, a lot of converters are thrown into the mix.

V2:

| Data Type          | Result TS Type | Converter                            |
| ------------------ | -------------- | ------------------------------------ |
| Edm.String         | `string`       |                                      |
| Edm.Boolean        | `boolean`      |                                      |
| Edm.Int64          | `bigInt`       | converter-common                     |
| Edm.Decimal        | `BigNumber`    | converter-big-number                 |
| Other Numbers      | `number`       | converter-v2-to-v4                   |
| Edm.DateTimeOffset | `DateTime`     | converter-luxon                      |
| Edm.DateTime       | `DateTime`     | converter-v2-to-v4 & converter-luxon |
| Edm.Time           | `Duration`     | converter-v2-to-v4 & converter-luxon |

V4:

| Data Type          | Result TS Type | Converter            |
| ------------------ | -------------- | -------------------- |
| Edm.String         | `string`       |                      |
| Edm.Boolean        | `boolean`      |                      |
| Edm.Int64          | `bigInt`       | converter-common     |
| Edm.Decimal        | `BigNumber`    | converter-big-number |
| Other Numbers      | `number`       |                      |
| Edm.DateTimeOffset | `Date`         | converter-common     |
| Edm.Date           | `DateTime`     | converter-luxon      |
| Edm.TimeOfDay      | `DateTime`     | converter-luxon      |
| Edm.Duration       | `Duration`     | converter-luxon      |

## Specials

A set of handwritten EDMX files to simulate some edge cases which would be impossible to find
in public OData services.

For these edge cases only typing tests are executed: Does TS compile?

- abstract and open types
- multiple schemas
- edge cases
