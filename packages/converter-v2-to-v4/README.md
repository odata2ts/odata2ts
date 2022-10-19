[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/converter-v2-to-v4?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/converter-v2-to-v4)

# V2-to-V4 Converters

A set of [`@odat2ts`](https://github.com/odata2ts/odata2ts) compatible converters to convert certain OData V2 types to their V4 analog. 
Thus, other converters only need to take care of the V4 data models.

Conversions:
* Edm.DateTime => Edm.DateTimeOffset
* Edm.Time => Edm.TimeOfDay
* Number types represented as strings => number

## Installation
Via npm:
```
npm install --save @odata2ts/converter-v2-to-v4
```
Via yarn:
```
yarn add @odata2ts/converter-v2-to-v4
```

## Integration
To integrate this converter into any `odata2ts` project, add it to the list of converters within the project configuration file `odata2ts.config.ts`.
Converters are referenced by their package name, so in this case `@odata2ts/converter-v2-to-v4`.

```typescript
import { ConfigOptions } from "@odata2ts/odata2model";

const config: ConfigOptions = {
  generation: {
    converters: ["@odata2ts/converter-v2-to-v4"],
  },
};

export default config;
```

### Configuration
You can also choose to exactly specify which converters to use instead of automatically integrating all of them.
Instead of a simple string you specify an object where the converters are listed by their id.
These converter ids are listed in the "Conversions" table.

```typescript
    ...
    converters: [
      {
        module: "@odata2ts/converter-v2-to-v4",
        use: ["DateTimeToDateTimeOffset", "StringToNumber"],
      },
    ],
    ...
```

## Conversions

| OData V2 Type | OData V4 Type      | Converter Id             | Description                                                                                            |
|---------------|--------------------|:-------------------------|--------------------------------------------------------------------------------------------------------| 
| Edm.DateTime  | Edm.DateTimeOffset | DateTimeToDateTimeOffset | Converts "/Date(123...)/" to ISO8601 "2022-02-22T12:00:00Z"; offsets are supported "/Date(123..+120)/" |
| Edm.Byte      | number             | StringToNumber           | fits into JS number                                                                                    |
| Edm.SByte     | number             | StringToNumber           | fits into JS number                                                                                    |
| Edm.Int64     | number             | StringToNumber           | might exceed JS number capacity                                                                        |
| Edm.Single    | number             | StringToNumber           | fits into JS number                                                                                    |
| Edm.Double    | number             | StringToNumber           | might exceed JS number capacity                                                                        |
| Edm.Decimal   | number             | StringToNumber           | might exceed JS number capacity                                                                        |
| Edm.Time      | Edm.TimeOfDay      | TimeToTimeOfDay          |                                                                                                        |
