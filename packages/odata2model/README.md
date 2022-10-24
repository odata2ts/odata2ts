[![npm (scoped)](https://img.shields.io/npm/v/@odata2ts/odata2model?style=for-the-badge)](https://www.npmjs.com/package/@odata2ts/odata2model)

# OData 2 Model

Create TypeScript interfaces, query objects and / or complete client services from a given metadata description of an OData service.

## Installation

```
// via npm
npm install --save-dev @odata2ts/odata2model

// via yarn
yarn add --dev @odata2ts/odata2model
```

## Usage

First download the metadata description file of your OData service. You just add `$metadata` to the base path of the service and save the XML as an own file.

Let's take the Northwind service as example:

- base path: https://services.odata.org/V4/Northwind/Northwind.svc/
- meta description: https://services.odata.org/V4/Northwind/Northwind.svc/$metadata

Equipped with this meta description file (assume it has been stored as "metadata.xml" in the root folder), we call odata2model as npm script in package.json, via npx or yarn:

```
yarn odata2model -s metadata.xml -o src/types -e ts
```

This will generate several files in the output folder `src/types` and uses TypeScript as emit type:

- NorthwindModel.ts - contains the TypeScript interfaces which describe the response models from the service
- QNorthwindModel.ts - contains query objects which are highly useful in conjunction with functions or actions and our [ODataUriBuilder](https://www.npmjs.com/package/@odata2ts/odata-uri-builder).
- NorthwindService.ts - the main client service which is the main interface to interact with the given OData service
- service/* - one service for each EntityType and ComplexType

The file names are determined by the service name which is to be found within the meta description of the service.
It can be overridden by option `--service-name`.

## CLI Options

`Source` and `ouput` must be specified via the CLI.

| Option         | Shorthand | Required | Default | Description                                                                                |
|----------------|-----------| -------- |---------|--------------------------------------------------------------------------------------------|
| --source       | -s        | x        |         | Specifies the source file, i.e. metadata description                                       |
| --output       | -o        | x        |         | Specifies the output directory                                                             |
| --mode         | -m        |          | all     | Allowed are: all, models, qobjects, service                                                |
| --emit-mode    | -e        |          | js_dts  | Specify what to emit. ALlowed values: ts, js, dts, js_dts                                  |
| --prettier     | -p        |          | false   | Use prettier to pretty print the TS result files; only applies when emitMode = ts          |
| --debug        | -d        |          | false   | Add debug information                                                                      |
| --service-name | -name     |          |         | Overwrites the service name found in OData metadata => controls name of main odata service |
| --model-prefix | -prefix   |          | ''      | Prefix for generated model interfaces, e.g. 'I' => IPerson                                 |
| --model-suffix | -suffix   |          | ''      | Suffix for generated model interfaces, e.g. 'Model' => PersonModel                         |

## Configuration File: `odata2ts.config.ts`

It's also possible and recommended to use a TypeScript based configuration file.
While `Source` and `ouput` must currently be specified via the CLI, every other CLI option
is also available via a TypeScript based configuration file. 

The configuration file supports multiple configuration options regarding the generation process:
* Name mappings
  * per namingStrategy, e.g. `camelCase`: "TestName" or "TEST_NAMe" => "testName"
  * per attribute, e.g. "ID" => "id" or `{ ID: "..." }` => `{ id: "" }`
* Naming formats for each generated entity type
  * models
  * query objects
  * services
* Value converter (plugin architecture)
  * we provide some converters, e.g. to convert V2 to V4 types or convert time and date related types to [Luxon's DateTime or Duration](https://moment.github.io/luxon/api-docs/index.html)
  * allows to add own value converters

Just create a file at the root 
of your project (beside package.json) and call it: `odata2ts.config.ts`.




Example file:
```ts
import { ConfigFileOptions } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: true,
  prettier: true,
  emitMode: "js_dts",
  generation: { // <- this
    converters: ["@odata2ts/v2-to-v4-converter"]  
  }
}
export default config;



```
