import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { PropertyModel } from "../data-model/DataTypeModel";

export function getServiceName(name: string) {
  return name + "Service";
}

export function getPropNameForService(name: string) {
  return `_${firstCharLowerCase(name)}Srv`;
}

export function getGetterNameForService(name: string) {
  return `get${upperCaseFirst(name)}Srv`;
}

export function getCollectionServiceName(name: string) {
  return name + "CollectionService";
}

export function getServiceNamesForProp(prop: PropertyModel): [string, string] {
  const serviceName = getServiceName(prop.type);
  return [serviceName, prop.isCollection ? getCollectionServiceName(prop.type) : serviceName];
}

export function getServiceNameForProp(prop: PropertyModel): string {
  return getServiceNamesForProp(prop)[1];
}

export function getPrivatePropName(name: string): string {
  return `_${firstCharLowerCase(name)}`;
}

export function getPrivateGetterName(name: string): string {
  return `_get${name}`;
}
