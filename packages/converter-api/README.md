[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/converter-api?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/converter-api)

# odata2ts Converter API

Defines the API of converters and converter packages as they are used in 
[`@odat2ts`](https://github.com/odata2ts/odata2ts).

As an API this module only consists of interfaces, which you should implement when writing your own converters.

Additionally, converter modules need to follow certain conventions, which are listed here.

## Introduction
Consumers of an OData service need to handle the data types known to OData and in this regard 
also need to take into account which OData version is used, because there are quite some
differences here between V2 and V4.

Converters allow to use a different representation for a given data type by converting
from and to the OData type. For example, the type `Edm.DateTimeOffset` represents a certain
point in time by using the ISO 8601 DateTime format; we might want to use a JS Date object
instead. So the converter would do the following conversions:
* convert from the OData type to JS Date
* convert from JS Date to the OData type

With the help of converters the consumer then only needs to handle JS date objects.
Furthermore, converters can also remedy the different representations of V2 and V4
(see [@odata2ts/v2-to-v4-converter](https://github.com/odata2ts/odata2ts/tree/main/packages/converter-v2-to-v4)).

## `odata2ts` Configuration
To use converters in the generation process of `odata2ts`, you have to 
a) install those converters and 
b) configure them.

The configuration requires you to use the config file `odata2ts.config.ts`.
``` 
import { ConfigFileOptions } from "./src/OptionModel";

const config: ConfigFileOptions = {
  converters: ["@odata2ts/v2-to-v4-converter"]
}
```
This would use the default list of converters specified in the v2-to-v4-converter module.
To only use specific converters of that package, we require a different syntax:
``` 
  ...
  converters: [
    {
      module: "@odata2ts/v2-to-v4-converter",
      use: ["dateTimeToDateTimeOffsetConverter", "stringToNumberConverter"]
    },
    "@odata2ts/luxon-converter"
  ]
  ...
```
### The Order of Converters
Multiple converters may specify the same source type. In this case the last specified converter wins.

### Converter Chains
The given list of converters will get evaluated by `odata2ts`, so that converter chains are automatically created.

The starting point for any converter chain must be an OData type, since that's what we get from the OData service.
So for each OData type we check if a converter was specified. 
If so, we check with the resulting data type for the next converter and so forth.


## Creating a Converter Module
Converters live in their own modules with their own `package.json`.
Multiple converters can reside in one converter module.

So you need to set up an own module first and don't forget the `main` attribute in the `package.json`.
Compare existing converter implementations.

### Install API
```
npm install --save @odata2ts/converter-api 
```
If you want to use enums for referencing OData types, which is recommended, then also install:
```
npm install --save @odata2ts/odata-core 
```


### Writing a Converter
You should implement the interface `ValueConverter<SourceType, TargetType>`, 
where "SourceType" is the JS type of the OData type you want to convert from 
and "TargetType" is the JS type of the new data type you want to convert to.

Let's take the following conversion as example here: 
From OData's date time type ("2022-12-31T12:15:00Z") to JS' Date object.
So we get the following converter: `ValueConverter<string, Date>`.

You require:
* id: this must match exactly the name of your exported variable, since it is used to import this converter from your module
* from: the data type(s) you want to convert from, in this case `Edm.DateTimeOffset`
* to: the data type of your choice, in this case `Date` 
* convertFrom: conversion from OData type
* convertTo: conversion to OData type

```ts
import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV4 } from "@odata2ts/odata-core";

export const myConverter: ValueConverter<string, Date> = {
  id: "myConverter",
  from: ODataTypesV4.DateTimeOffset, // or just "Edm.DateTimeOffset"
  to: "Date",
  convertFrom: (value: ParamValueModel<string>): ParamValueModel<Date> => {
    return typeof value !== "string" ? value : new Date(value);
  },
  convertTo: (value: ParamValueModel<Date>): ParamValueModel<string> => {
    return !value ? value : value.toISOString();
  }
}
```
The `ParamValueModel<Type>` makes sure that `null` and `undefined` are valid values:
* `null` is simply allowed as value
* `undefined` is used to signal that the conversion failed

Attribute `from` can be a list of types.


### The Module Export
Each converter module must have a default export or alternatively an export called `config`.
The type of this export is `ConverterPackage`, which requires an ID and a list
of those converters that should be used by default.

Additionally, all available converters must be exported individually.
The export name must match the id of the converter.

```ts
import { ConverterPackage } from "@odata2ts/converter-api";
import { myConverter } from "./MyConverter"

export const config: ConverterPackage = {
  id: "MyConverters",
  converters: [myConverter]
}
export {
  myConverter
}
```

### About Data Types

The handling of data types within the ValueConverter is a bit special, but follows these rules:
* the types of JS data types are just written as strings: "number", "string", "Date", ...
* OData Types always have the prefix "Edm.", e.g. "Edm.String", "Edm.DateTimeOffset", ...
  * enums for V2 and V4 data types are available via `@odata2ts/odata-core`
* 3rd party data types (need to be imported before usage) specify their module as prefix separated by a dot, e.g. "luxon.Duration" 
  * "module.DataType" => import { DataType } from "module";

A little cheat sheet regarding OData's data types:

| OData Type         | Version | JS format | Example                                                    |
|--------------------|:-------:|:---------:|------------------------------------------------------------|
| Edm.String         | V2 & V4 |  string   | "Test"                                                     |
| Edm.Boolean        | V2 & V4 |  boolean  | true                                                       |  
| Edm.Int16          | V2 & V4 |  number   | 3                                                          |
| Edm.Int32          | V2 & V4 |  number   | 222                                                        | 
| Edm.Byte           |   V2    |  string   | "1"                                                        |  
| Edm.Byte           |   V4    |  number   | 1                                                          |  
| Edm.SByte          |   V2    |  string   |                                                            |
| Edm.SByte          |   V4    |  number   |                                                            |
| Edm.Int64          |   V2    |  string   |                                                            |
| Edm.Int64          |   V4    |  number   |                                                            |
| Edm.Single         |   V2    |  string   |                                                            |
| Edm.Single         |   V4    |  number   |                                                            |
| Edm.Double         |   V2    |  string   |                                                            |
| Edm.Double         |   V4    |  number   |                                                            |
| Edm.Decimal        |   V2    |  string   |                                                            |
| Edm.Decimal        |   V4    |  number   |                                                            |
| Edm.Duration       |   V4    |  string   | "P12DT12H15M"                                              |
| Edm.Time           |   V2    |  string   | "PT12H15M"                                                 |
| Edm.TimeOfDay      |   V4    |  string   | "12:15:00"                                                 |
| Edm.Date           |   V4    |  string   | "2022-12-31"                                               |
| Edm.DateTime       |   V2    |  string   | "/Date(123...)/"                                           |
| Edm.DateTimeOffset | V2 & V4 |  string   | "2022-12-31T12:15:00+01:00"                                |
| Edm.Binary         | V2 & V4 |  string   |                                                            |
| Edm.Stream         |   V4    |    ---    | streams are accessed differently and thus are out of scope |

