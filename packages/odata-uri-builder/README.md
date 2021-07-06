![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-uri-builder?style=for-the-badge)

# OData URI Builder

Allows for building type-safe OData queries.

OData URI Builder depends on `odata-query-objects` in order to have appropriate types & an easy-to-use API.
It also relies on having appropriate TypeScript interfaces for OData models. Both, interfaces & query objects
can be generated via `odata2model` out of an existing OData service.

## Usage

Let's take the following simple model as example:

```
export interface Person {
  age: number;
  name: string;
  deceased: boolean;
  createdAt: DateTimeOffsetString; // you find these special types in odata-query-objects package
  address: Address;                // 1:1 relationship
  altAddresses: Array<Address>;     // 1:n relationship
}
```

A complex query could look like this:

```
ODataUriBuilder.create(QPerson)
  .select("name", "age")
  .filter(QPerson.name.equals("Horst").or(QPerson.age.gt(18)))
  .expand("address")
  .expanding("altAddresses", (builder, qEntity) => {
    builder
      .select("street")
      .skip(1)
      .top(0)
      .filter(qEntity.street.startsWith("Teststr"));
  })
  .build();

// Result is (without encoding):
// /Persons?$select=name,age&$filter=name eq 'Horst' or age gt 18&$expand=altAddresses($select=street;skip=1;top=0;$filter=startswith(street,'Teststr'))
```

A typical search:

```
const builder = ODataUriBuilder.create(QPerson);

if (searchForm.name) {
  builder.filter(QPerson.name.contains(searchForm.name))
}
if (searchForm.age) {
  builder.filter(QPerson.age.eq(searchForm.age))
}
...
```

## Model Intefaces & Query Objects

First we need typescript interfaces for a given OData service (you can generate them via `odata2model`).
Of course, you can also build them manually; however you would need to take care regarding OData's special
types like date & time or binary and guid types.

Secondly, we also need query objects (also generated via `odata2model`).
Creating them manually would look like this:

```
export const QPerson: QEntityModel<Person, "name" | "age"> = {
  __collectionPath: "Persons",
  age: new QNumberPath("age"),
  name: new QStringPath("name"),
  deceased: new QBooleanPath("deceased"),
  createdAt: new QDateTimeOffsetPath("createdAt"),
  address: new QEntityPath<Address>("address", () => QAddress),
  altAdresses: new QEntityCollectionPath<Address>("altAdresses", () => QAddress),
};
```

`QEntityModel` takes the entity and it's primary key as generic arguments: in this case, the person interface
and a composite key of "name" and "age".

The `__collectionPath` attribute corresponds to an EntitySet in the metadata
description of the given OData service & represents the entry path to this collection.

Each attribute is then mapped to a corresponding QPath object.
