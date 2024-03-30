import { ODataVersions } from "@odata2ts/odata-core";

import {
  ClientApiImports,
  CoreImports,
  LIB_MODULES,
  QueryObjectImports,
  ServiceImports,
  VERSIONED_CORE_IMPORTS,
  VERSIONED_SERVICE_IMPORTS,
} from "./ImportObjects";

const VERSIONED_CORE_NAMES = VERSIONED_CORE_IMPORTS.map((vci) => CoreImports[vci]);
const VERSIONED_SERVICE_NAMES = VERSIONED_SERVICE_IMPORTS.map((vsi) => ServiceImports[vsi]);

interface ImportName {
  moduleName: string;
  name: string;
  versioned: boolean;
}

export interface ReservedImportName {
  moduleName: string;
  name: string;
}

function getEnumItemNameList(enumObject: object): Array<string> {
  return Object.values(enumObject).filter((ci): ci is string => typeof ci === "string");
}

export const RESERVED_IMPORT_NAMES: Array<ReservedImportName> = [
  ...getEnumItemNameList(CoreImports).map<ImportName>((ci) => ({
    moduleName: LIB_MODULES.core,
    name: ci,
    versioned: VERSIONED_CORE_NAMES.includes(ci),
  })),
  ...getEnumItemNameList(QueryObjectImports).map<ImportName>((ci) => ({
    moduleName: LIB_MODULES.qObject,
    name: ci,
    versioned: false,
  })),
  ...getEnumItemNameList(ClientApiImports).map<ImportName>((ci) => ({
    moduleName: LIB_MODULES.clientApi,
    name: ci,
    versioned: false,
  })),
  ...getEnumItemNameList(ServiceImports).map<ImportName>((ci) => ({
    moduleName: LIB_MODULES.service,
    name: ci,
    versioned: VERSIONED_SERVICE_NAMES.includes(ci),
  })),
].reduce<Array<ReservedImportName>>((collector, current) => {
  if (current.versioned) {
    collector.push(
      ...getEnumItemNameList(ODataVersions).map((version) => {
        return {
          moduleName: current.moduleName,
          name: current.name + version,
        };
      })
    );
  } else {
    collector.push({ moduleName: current.moduleName, name: current.name });
  }

  return collector;
}, []);
