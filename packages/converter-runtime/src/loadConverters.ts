import { ConverterPackage, ValueConverterType } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { RuntimeConverterPackage, TypeConverterConfig, ValueConverterChain } from "./ConverterModels";

type MappedConverters = Map<string, ValueConverterType & { package: string; toModule?: string }>;

export type MappedConverterChains = Map<string, ValueConverterChain>;

/**
 * Performs a dynamic import of each converter package and returns essential meta infos.
 *
 * @param converters
 */
async function doLoad(converters: Array<TypeConverterConfig>): Promise<Array<RuntimeConverterPackage>> {
  return Promise.all(
    converters.map((conv) => {
      return import(conv.module)
        .catch((e) => {
          throw new Error(`Failed to load module "${conv.module}"!`, e);
        })
        .then((module) => {
          let converters: Array<ValueConverterType>;

          // load converter directly by named import
          if (typeof conv.use?.length === "number") {
            converters = [];
            for (let convId of conv.use) {
              const loaded = module[convId];
              if (!loaded) {
                throw new Error(`Use of converter with id "${convId}" of module "${conv.module}" failed!`);
              }
              converters.push(loaded);
            }
            // console.log(`Dynamically imported [${conv.use.join(",")}] from converter package ${conv.module}`);
          }
          // use converter list from default export
          else {
            const candidate = module.config || module.default;
            if (!candidate || typeof candidate.id !== "string" || typeof candidate.converters?.length !== "number") {
              throw new Error(`Default export of loaded module "${conv.module}" doesn't conform to specification!`);
            }
            const pkg = candidate as ConverterPackage;
            // console.log(`Dynamically loaded converter package ${conv.module} with id "${id}"`);
            converters = pkg.converters;
          }

          return {
            package: conv.module,
            converters,
          };
        });
    })
  );
}

/**
 * Collect converters by their source data type (attribute "from").
 * Last definition wins.
 *
 * @param converterPkgs
 */
function mapConvertersBySource(converterPkgs: Array<RuntimeConverterPackage>): MappedConverters {
  return converterPkgs.reduce<MappedConverters>((collector, converterPkg) => {
    for (let converter of converterPkg.converters) {
      const froms = typeof converter.from === "string" ? [converter.from] : converter.from;
      for (let from of froms) {
        const [fromType] = getPropTypeAndModule(from);
        const [toType, toModule] = getPropTypeAndModule(converter.to);
        collector.set(from, {
          package: converterPkg.package,
          id: converter.id,
          from: fromType,
          to: toType,
          toModule,
        });
      }
    }
    return collector;
  }, new Map());
}

/**
 * This function uses dynamic imports to load converter modules and throws errors if it fails to do so.
 * Loaded modules are evaluated according to specification of {@code ConverterPackage}.
 *
 * Converter packages are either specified by their package name alone or by using the {@code TypeConverterConfig}.
 *
 * @param version OData version to use (V2 or V4)
 * @param converters list of converters to load in that particular order
 */
export async function loadConverters(
  version: ODataVersions,
  converters: Array<string | TypeConverterConfig> | undefined
): Promise<MappedConverterChains | undefined> {
  if (!converters?.length) {
    return undefined;
  }

  const odataTypes = version === ODataVersions.V2 ? ODataTypesV2 : ODataTypesV4;
  const normalizedConverters = converters.map((conv) =>
    typeof conv === "string" ? { module: conv } : (conv as TypeConverterConfig)
  );

  const loadedPkgs = await doLoad(normalizedConverters);
  const mappedConverters = mapConvertersBySource(loadedPkgs);

  if (!mappedConverters.size) {
    return undefined;
  }

  // Iterate through EDM data types (only these are valid starting points) and start chaining converters from there
  return Object.values(odataTypes).reduce((collector, edmDT) => {
    const conv = chainConverters(mappedConverters, edmDT);
    if (conv) {
      collector.set(edmDT, conv);
    }

    return collector;
  }, new Map() as MappedConverterChains);
}

// Recursive function to find chainable converters and chain them
function chainConverters(converters: MappedConverters, dataType: string): ValueConverterChain | undefined {
  const conv = converters.get(dataType);
  if (!conv) {
    return undefined;
  }

  const chainedConv = chainConverters(converters, conv.to);

  return {
    from: dataType,
    to: chainedConv?.to ?? conv.to,
    toModule: chainedConv?.to ? chainedConv.toModule : conv.toModule,
    converters: [{ package: conv.package, converterId: conv.id }, ...(chainedConv?.converters ?? [])],
  };
}

function getPropTypeAndModule(typeName: string) {
  if (typeName.match(/\./)?.length === 1 && !typeName.startsWith("Edm.")) {
    const [module, type] = typeName.split(".");
    return [type, module];
  }
  return [typeName];
}
