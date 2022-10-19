[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/converter-runtime?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/converter-runtime)

# odata2ts Converter Runtime

Provides necessary implementations for using [`@odat2ts`](https://github.com/odata2ts/odata2ts) converters at runtime.
This library is primarily intended to be used by the 
[odata2ts generator](https://www.npmjs.com/package/@odata2ts/odata2model).

Provided implementations:
* `IdentityConverter`: just returns what was passed 
* `ChainedConverter`: chains the output of converter A to the input of converter B
* `loadConverters()`: loading function to dynamically import specified converters
  * takes care of loading order => last converter wins if multiple converters could be used for a given data type
  * returns mapping of OData data types to `ConverterChains`

## Installation
Via npm:
```
npm install --save @odata2ts/converter-runtime
```
Via yarn:
```
yarn add @odata2ts/converter-runtime
```
