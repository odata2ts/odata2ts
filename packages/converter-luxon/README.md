[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/converter-luxon?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/converter-luxon)

# Luxon Converters

Luxon based [`@odat2ts`](https://github.com/odata2ts/odata2ts) compatible converters for date and time related OData types.
This converter package has been tested to work with [v2-to-v4-converter](), so that.

User facing data types:
* [DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime)
* [Duration](https://moment.github.io/luxon/api-docs/index.html#duration)

## Installation
Note: This converter expects, that Luxon itself has been already installed, 
it doesn't pull Luxon automatically into your project. So if not already present, also install `luxon`.

Via npm:
```
npm install --save @odata2ts/converter-luxon
```
Via yarn:
```
yarn add @odata2ts/converter-luxon
```

## Integration
To integrate this converter into any `odata2ts` project, add it to the list of converters within the project configuration file `odata2ts.config.ts`.
Converters are referenced by their package name, so in this case `@odata2ts/converter-luxon`.

For V2, the v2-to-v4-converter should also be installed to handle V2 date times (Edm.DateTime) with Luxon as well.
For V4 you just leave it out.
```typescript
import { ConfigOptions } from "@odata2ts/odata2model";

const config: ConfigOptions = {
  generation: {
    converters: ["@odata2ts/converter-v2-to-v4", "@odata2ts/converter-luxon"],
  },
};

export default config;
```

### Configuration
You can also choose to exactly specify which converters to use instead of automatically integrating all of them.
Instead of a simple string you specify an object where the converters are listed by their id (in the following example "xxxToLuxon").
These converter ids are listed in the "Conversions" table.

```typescript
    ...
    converters: [
      {
        module: "@odata2ts/converter-luxon",
        use: ["DateTimeOffsetToLuxon", "DurationToLuxon"],
      },
    ],
    ...
```

## Conversions

| OData Type         | OData Version | Converter Id          | Luxon Type | Description                                                                     |
|--------------------|:-------------:|-----------------------|------------|---------------------------------------------------------------------------------| 
| Edm.DateTimeOffset |V2 & V4| DateTimeOffsetToLuxon | DateTime   ||
| (Edm.DateTime)     |V2| ---                   | DateTime   | Only in combination with [v2-to-v4-converter](), which converts to DateTimeOffset, which in turn is supported as stated in the previos row. 
| Edm.Date           |V4| DateToLuxon           | DateTime   | Luxon's DateTime will still have the time part, which should be ignored by user |
| Edm.TimeOfDay      |V4| TimeOfDayToLuxon      | DateTime   | Luxon's DateTime will still have the date part, which should be ignored by user |
| Edm.Duration       |V4| DurationToLuxon       | Duration   ||
| Edm.Time           |V2| DurationToLuxon       | Duration   | Yeah, the initial spec of time is actually a duration |
