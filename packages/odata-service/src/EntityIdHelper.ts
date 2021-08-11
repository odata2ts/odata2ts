import { EntityIdKey } from "./EntityModel";

export const compileLiteralId = (id: string | number): string => {
  if (typeof id !== "string" && typeof id !== "number") {
    throw Error("Only string & number types are valid for compileLiteralId!");
  }
  return String(id);
};

export const compileQuotedId = (id: string | number) => {
  if (typeof id !== "string" && typeof id !== "number") {
    throw Error("Only string & number types are valid for compileQuotedId!");
  }
  return `'${id}'`;
};

export const compileId = (id: { [prop: string]: EntityIdKey }) => {
  if (typeof id !== "object") {
    throw Error("Only object types are valid for compileId!");
  }
  return Object.entries(id)
    .map(([key, value]) => {
      const val = value.isLiteral ? value : `'${value}'`;
      return key + "=" + val;
    })
    .join(",");
};
