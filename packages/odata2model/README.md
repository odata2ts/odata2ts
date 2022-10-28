[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata2model?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata2model)

# OData 2 Model

Generate TypeScript models, query objects and / or complete client services from a given metadata description of an OData service.

## Installation

```
npm install --save-dev @odata2ts/odata2model
```

## Prerequisites

First download the metadata description file of your OData service.

You just add `/$metadata` to the base path of the service, e.g. https://services.odata.org/V4/Northwind/Northwind.svc/$metadata.
<br/>Save the XML in an own file, e.g. `src/odata/northwind.xml`.

## Usage

`odata2model` is the main command which is called via script in package.json, or directly via npx or yarn:
```
 // package.json script
 scripts: {
   ...
   "gen-odata": "npm run odata2model -s src/odata/northwind.xml -o build/northwind"
 }
 // then from command line
 npm run gen-odata
```
```
// directly from command line via npx or yarn
yarn odata2model -s src/odata/northwind.xml -o build/northwind 
```
These usage examples highlight the minimal configuration which is required for each OData service:
- source: the downloaded metadata file
- output: the output directory for the generated files

### Config file: `odata2ts.config.ts`
Instead of specifying these or other parameters via the command line you can use a config file written in TypeScript.
It centralizes all configurations and allows for handling multiple OData services:
```ts
import { ConfigFileOptions } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  services: {
    northwind: {
      source: "src/odata/northwind.xml",
      output: "build/northwind",
    },
    trippin: {
      source: "src/odata/trippin.xml",
      output: "build/trippin",
    }
  }
}
export default config;
```
With this configuration in place, we can now call `odata2model` without any options.
Additionally, individual services can be addressed as arguments:
```
yarn odata2model                      // start generation process for all configured services
yarn odata2model northwind            // start generation process for one specific service
yarn odata2model northwind trippin    // start generation process for multiple services
```

## Command Line Options
Options specified on the command line always win over other configuration possibilities.

Options `source` and `output` are required unless the config file is used 
containing appropriate service definitions.


| Option         | Shorthand | Required | Default | Description                                                                                |
|----------------|-----------|:--------:|---------|--------------------------------------------------------------------------------------------|
| --source       | -s        |   (x)    |         | Specifies the source file, i.e. metadata description                                       |
| --output       | -o        |   (x)    |         | Specifies the output directory                                                             |
| --mode         | -m        |          | all     | Allowed are: all, models, qobjects, service                                                |
| --emit-mode    | -e        |          | js_dts  | Specify what to emit. ALlowed values: ts, js, dts, js_dts                                  |
| --prettier     | -p        |          | false   | Use prettier to pretty print the TS result files; only applies when emitMode = ts          |
| --debug        | -d        |          | false   | Add debug information                                                                      |
| --service-name | -name     |          |         | Overwrites the service name found in OData metadata => controls name of main odata service |

## Configuration File

Create a file at the root of your project (beside package.json) 
and call it: `odata2ts.config.ts`.

None of the options are required, so here is just an example: 
```ts
import { ConfigFileOptions, EmitModes } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: true,
  emitMode: EmitModes.ts,
  prettier: true,
  converters: ["@odata2ts/v2-to-v4-converter"],
  services: {
    northwind: {
      source: "src/odata/northwind.xml",
      output: "build/northwind",
      serviceName: "StrongWind"
    }
  }
}
export default config;
```
As you can see, enums are provided for `emitMode` and the same goes for the `mode` option.

The usage of converters is documented in the [converter-api](../converter-api).


### Default Settings vs Base Settings vs Service Settings 
The [defaultConfig](src/defaultConfig.ts) lists all default values, which are always used.

All settings except the `services` attribute are **base settings**, which will also be used as default settings,
i.e. on top of the defaultConfig.

All settings starting from the `services` attribute are only valid for a specific service and only applied
for its generation run. Service specific settings are applied on top of the base settings.

Additionally, CLI options can be used to override base or service settings.

