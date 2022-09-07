/**
 * Constructs an url path suitable for OData operations.
 *
 * @param path required path element; minimum: name of the action
 * @param operationName if left out the path must contain the action name
 * @returns url path
 */
export const compileOperationPath = (path: string, operationName?: string) => {
  return `${path ?? ""}${operationName ? "/" + operationName : ""}`;
};
