![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-objects?style=for-the-badge)

# OData Query Objects

Query objects are building blocks to allow for typesafe OData queries.
First of all query objects encapsulate the typing of given entities as well as the specification of their ids / keys.
This information is then exploited in the ODataUriBuilder.

Here's an example of a type model with a composite key, where `firstName` and `lastName` are properties of the `Person` interface:

```
QEntityModel<Person, "firstName" | "lastName">
```

Furthermore, each query object specifies its attributes as QPath objects. They allow for type safe filtering.
For example:

```
const qPerson: QEntityModel<Person, "firstName" | "lastName"> = {
  __collectionPath: "Persons",
  firstName: new QStringPath("firstName"),
  lastName: new QStringPath("lastName"),
  age: new QNumberPath("name"),
  ...
}

qPerson.name.eq("Horst").toString() // results in: person eq 'Horst'
qPerson.name.startsWith("Ho").toString() // results in: startswith(person,'Ho')
qPerson.age.plus(10).greaterThan(30) // results in: add(age,10) gt 30
```

## Date, TimeOfDay & DateTimeOffset

Date & time types are just plain strings in OData, even though they comply to the ISO-8601 standard.
In order to differentiate between each of these types as well as strings we use "nominal typing" ([here's a good explanation](https://basarat.gitbook.io/typescript/main-1/nominaltyping)].

We provide the following types within this package:

- DateString
- TimeOfDayString
- DateTimeOffsetString

These types are mandatory within the provided interface in order to model date & time types.

```
interface Person {
  ...
  createdAt: DateTimeOffsetString
}

const qPerson: QEntityModel<Person, "firstName" | "lastName"> = {
  ...
  createdAt: new QDateTimeOffsetPath("createdAt")
}
```

## Entity Relationships

Here's the example:

```
interface Person {
  ...
  address: Address;             // 1:1 relationship
  altAddresses: Array<Address>; // 1:n relationship
}

const qPerson: QEntityModel<Person, "firstName" | "lastName"> = {
  ...
  address: new QEntityPath("address", () => qAddress),
  altAddresses: new QEntityCollectionPath("altAddresses", () => qAddress)
  ...
}
```

Functions are used to wrap references to other Query Objects in order to allow for circular references.

## Factory Function

Constructing entity models manually, as shown above, is a bit repetitive.
Use `QEntityFactory` to reduce your efforts:

```
const qPerson = QEntityFactory.create<Person, "firstName" | "lastName">("Persons", {
  firstName: QStringPath,
  age: QNumberPath,
  address: [QEntityPath, () => qAddress],
  altAddresses: [QEntityCollectionPath, () => qAddress]
})
```

As you can see from the example, we use tuples to specify QPath and QObject for entity relationships.

## Generating Query Objects

Actually you shouldn't need to create Query Objects manually. Since each OData service exposes a meta description ($metadata parameter), we can fully automate the generation.

Take a look at the `odata2model` package to generate TypeScript interfaces & Query Objects by a given metadata.xml.

## Inspiration

The base idea for "Query Objects" is taken from [QueryDsl](http://www.querydsl.com/). [Jooq](https://www.jooq.org/) seems also to work this way.
