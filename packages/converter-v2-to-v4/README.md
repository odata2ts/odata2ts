[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/converter-v2-to-v4?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/converter-v2-to-v4)

# V2-to-V4 Converters

A set of [`@odat2ts`](https://github.com/odata2ts/odata2ts) compatible converters to convert certain OData V2 types to their V4 analog. 
Thus, other converters only need to take care of the V4 data models.

Conversions:
* Edm.DateTime => Edm.DateTimeOffset
* Number types represented as strings => number
* Edm.Time => Edm.TimeOfDay (or Edm.Duration)

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
  converters: ["@odata2ts/converter-v2-to-v4"],
};

export default config;
```

### Select Converters
You can also choose to exactly specify which converters to use instead of automatically integrating all of them.
Instead of a simple string you specify an object where the converters are listed by their id.
These converter ids are listed in the "Conversions" table.

```typescript
    ...
    converters: [
      {
        module: "@odata2ts/converter-v2-to-v4",
        use: ["dateTimeToDateTimeOffsetConverter", "stringToNumberConverter", "timeToDurationConverter"],
      },
    ],
    ...
```

## Conversions

| OData V2 Type | OData V4 Type      | Converter Id                      | Description                                                                                                |
|---------------|--------------------|:----------------------------------|------------------------------------------------------------------------------------------------------------| 
| Edm.DateTime  | Edm.DateTimeOffset | dateTimeToDateTimeOffsetConverter | Converts "/Date(123...)/" to ISO8601 "2022-02-22T12:00:00Z"; offsets are supported "/Date(123..+120)/"     |
| Edm.Byte      | number             | stringToNumberConverter           | fits into JS number                                                                                        |
| Edm.SByte     | number             | stringToNumberConverter           | fits into JS number                                                                                        |
| Edm.Int64     | number             | stringToNumberConverter           | might exceed JS number capacity                                                                            |
| Edm.Single    | number             | stringToNumberConverter           | fits into JS number                                                                                        |
| Edm.Double    | number             | stringToNumberConverter           | fits into JS number                                                                                        |
| Edm.Decimal   | number             | stringToNumberConverter           | might exceed JS number capacity                                                                            |
| Edm.Time      | Edm.TimeOfDay      | timeToTimeOfDayConverter          | Converts PT12H15M to "12:15:00"                                                                            |
| Edm.Time      | Edm.Duration       | timeToDurationConverter           | alternative which doesn't convert => Edm.Time has the same format as Edm.Duration; not a default converter |

### Notes on `Edm.Time`

By default `Edm.Time` is converted to `Edm.TimeOfDay`, since that is what I believe the spec intended it to mean.
However, it can also be used to mean a duration. In that case you could use the `timeToDurationConverter` by 
selecting converters (see chapter "Select Converters").

`Edm.Time` has an unfortunate definition: On the one hand the spec states that it is intended to represent
a certain time of a day, but on the other hand it is defined as duration.
Formally, it adheres to the [ISO8601 duration format](https://en.wikipedia.org/wiki/ISO_8601#Durations), 
but restricts it to the time part (actually, the formal spec allows for day durations, 
so that `P12D` (12 days) would be valid, which is not representable as time of day).

However, durations and times are two different things. A duration might span days, weeks, etc. 
(and Edm.Time nearly correctly restricts this) and a duration only needs to specify one part,
e.g. PT12S (12 seconds) is a valid duration. In contrast, the time part of an ISO 8601 DateTime format
requires the specification of hours and minutes as minimum, e.g. "12:15".

I think that these are the reasons why `Edm.Time` was replaced in V4 by `Edm.TimeOfDay` 
and `Edm.Duration`.
