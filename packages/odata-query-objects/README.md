[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata-query-objects?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata-query-objects)

# OData Query Objects

Query objects are building blocks to allow for typesafe OData queries.
They are the counterpart to the typescript model interfaces and allow for complex and powerful query semantics.

```
// model interface
export interface SimpleEntity {
  id: number;
  name: string;
  feat: FeaturesEnum;
  complexton: ComplexEntity;
}

// query object
export class QSimpleEntity extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly name = new QStringPath(this.withPrefix("name"));
  public readonly feat = new QEnumPath(this.withPrefix("feat"));
  public readonly complexton = new QEntityPath(this.withPrefix("complexton"), () => QComplexEntity);

  constructor(prefix?: string) {
    super(prefix);
  }
}

// instantiate
const qSimple = new QSimpleEntity();

// let's use the query object
qSimple.id.gt(100).toString()             // results in: id gt 100
qSimple.name.startsWith("Hor").toString() // results in: startswith(name,'Hor')
qSimple.id.plus(10).greaterThan(30)       // results in: add(id,10) gt 30
```

## Generating Query Objects

Actually you shouldn't need to create Query Objects manually. 
Since each OData service exposes a meta description ($metadata parameter), we can fully automate the generation.

Take a look at the `odata2model` package to generate TypeScript interfaces & query Objects by a given metadata.xml.


## Technical Notes

### String Based Data Types like Date, TimeOfDay, DateTimeOffset or Guid

Some data types are transferred as string, but adhere to a special format.
Date & time types, for example, comply to the ISO-8601 standard, so you will receive something like this for 
a date time: `2021-12-31T23:59:59`.

In the final model interfaces they will simply be typed as `string`. 
However, when using those types in OData queries it is essential to handle them correctly.
While proper strings are surrounded by single quotes, those special strings are usually not.
Furthermore, filtering for those properties has different semantics depending on the type.

All of this logic is encapsulated in the generated query objects. 
They provide the needed functionality to express typesafe OData queries with ease.

### Entity Relationships

Functions are used to wrap references to other Query Objects in order to allow for circular references.

## Inspiration

The base idea for "Query Objects" is taken from [QueryDsl](http://www.querydsl.com/). 
[Jooq](https://www.jooq.org/) also works this way.
