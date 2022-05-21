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
yarn odata2model -s metadata.xml -o src/types
```

This will generate 2 files in the output folder `src/types`:

- NorthwindModel.ts - contains the TypeScript interfaces which describe the response models from the service
- QNorthwindModel.ts - contains query objects which are highly useful in conjunction with our [ODataUriBuilder](https://www.npmjs.com/package/@odata2ts/odata-uri-builder).

The file names are determined by the service name which is to be found within the meta description of the service.

## Options

| Option         | Shorthand | Required | Default | Description                                                  |
| -------------- | --------- | -------- | ------- |--------------------------------------------------------------|
| --source       | -s        | x        |         | Specifies the source file, i.e. metadata description         |
| --output       | -o        | x        |         | Specifies the output directory                               |
| --mode         | -m        |          | all     | Allowed are: all, models, qobjects, service                  |
| --prettier     | -p        |          | false   | Use prettier to pretty print the result files                |
| --debug        | -d        |          | false   | Add debug information                                        |
| --model-prefix | -prefix   |          | ''      | Prefix for generated interfaces, e.g. 'I' => IPerson         |
| --model-suffix | -suffix   |          | ''      | Suffix for generated interfaces, e.g. 'Model' => PersonModel |
