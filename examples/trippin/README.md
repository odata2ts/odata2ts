# odata2ts Example: Trippin

OData2ts generation example based on the publicly available [Trippin service](https://www.odata.org/odata-services/).

The Trippin service is a V4 OData service and features a variety of different types 
(enums, complex types, collections of those, collections of primitive types) and functionalities.

This repo serves as example of how to integrate `odata2ts`, but its also used internally as basis
for V4 integration tests.

## The Domain
Contains a lot of features like different data types, `Enum`, `Complex Type` extending `Complex Type`, 
primitive collections, `Singleton` etc.
Hence, the model is more complex than other examples.

Here's just an excerpt of the most important domain models:
* Person
  * key: "UserName"
  * associations
    * Friends (Collection\<Person\>)
    * BestFriend (Person)
    * Trips (Collection\<Trip\>)
* Trip
  * key: "TripId"
  * associations
    * multiple PlanItems (Flights)
* Flight
  * extends PublicTransportation extends PlanItems
  * key: "PlanItemId"
  * associations
    * one Airline
    * two Airports (from & to)
* Airline
  * key: "AirlineCode"
* Airport
  * key: "IcaoCode"
  * complex types
    * Location

### Entry Points
* People
* Airlines
* Airports
* Me (example of a `Singleton`)
