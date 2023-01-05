[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-builder?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-query-builder)

# OData Query Builder

Allows for building type-safe OData queries.

OData Query Builder depends on `odata-query-objects` to offer a powerful and easy-to-use API.
Query objects can be generated via `odata2ts` out of an existing OData service.

## Usage

Let's take the Trippin service as example. In this context it's enough to know that it allows to 
list people and the trips they've made. The main focus lies on the `Person` entity which is
exposed under the URL `/People`.

<p>
  <details>
    <summary>Relevant EDMX extract</summary>

```xml
<Schema Namespace="Trippin" xmlns="http://docs.oasis-open.org/odata/ns/edm">
  <EntityType Name="Person">
    <Key>
      <PropertyRef Name="UserName" />
    </Key>
    <Property Name="UserName" Type="Edm.String" Nullable="false" />
    <Property Name="LastName" Type="Edm.String" MaxLength="26" />
    <Property Name="Age" Type="Edm.Int64" />
    <Property Name="Emails" Type="Collection(Edm.String)" />
    <Property Name="AddressInfo" Type="Collection(Trippin.Location)" />
    <Property Name="HomeAddress" Type="Trippin.Location" />
    <Property Name="FavoriteFeature" Type="Trippin.Feature" Nullable="false" />
    <Property Name="Features" Type="Collection(Trippin.Feature)" Nullable="false" />
    <NavigationProperty Name="Friends" Type="Collection(Trippin.Person)" />
    <NavigationProperty Name="BestFriend" Type="Trippin.Person" />
    <NavigationProperty Name="Trips" Type="Collection(Trippin.Trip)" />
  </EntityType>
  <EntityContainer Name="Container">
    <EntitySet Name="People" EntityType="Trippin.Person">
      ...
    </EntitySet>
  </EntityContainer>
</Schema>
```

  </details>
</p>

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

### Stay Fluent 
To don't break the fluent API style, your expressions can evaluate to `null` or `undefined` 
and will automatically get filtered out. This applies to all operations on the query builder
(select, filter, expand, skip, top, ...).

```ts
createUriBuilderV4("People", qPerson)
  .select("lastName", isAgeRelevant ? "age" : undefined)
  .filter(null)
  .build()
```
Result, if age doesn't matter: `/People?$select=LastName`

### Keep Adding
You can call most operations multiple times and will just keep adding stuff.
Exceptions: skip, top, count
```ts
createUriBuilderV4("People", qPerson)
  .select("lastName")
  .select("age")
  .filter(qPerson.age.gt(18))
  .filter(qPerson.age.lowerThan(66))
  .build()
```
Result: `/People?$select=LastName,Age&$filter=Age gt 18 AND Age lt 66`

### Expanding
Expanding will fetch associated entities (complex types are part of the entity and are always expanded, so to say).
The query builder offers two different methods: `expand` and `expanding`. 

Use `expand` to expand the complete entity. Just name the attributes to expand.
```ts
createUriBuilderV4("People", qPerson)
  .expand("trips", "bestFriend")
  .build()
```
Result: `/People?$expand=Trips,BestFriend`

Use `expanding` to further shape the response object to your needs.
Provide a callback function, which will receive an own query builder as first parameter
and the appropriate query object as second parameter. 
The function should return the passed query builder.

```ts
createUriBuilderV4("People", qPerson)
  .expanding("trips", (tripsBuilder, qTrip) => 
    tripsBuilder
      .select("budget")
      .orderBy(qTrip.budget.desc())
      .top(1)
  )
  .build()
```
Result: `/People?$expand=Trips(select=Budget;orderby=Trips desc;top=1)`

`expand` and `expanding` are supported in the same way by the V2 query builder (well, the expanding builder only
offers select, filter, expand, expanding in V2). However, in V2 the syntax for expanding is different, but
the V2 query builder takes care of that.

```ts
import { createUriBuilderV2 } from "@odata2ts/odata-query-builder";

createUriBuilderV2("Product", qProduct)
  .expanding("supplier", (catBuilder, qSupplier) => 
    catBuilder
      .select("name", "id")
  )
  .build()
```
