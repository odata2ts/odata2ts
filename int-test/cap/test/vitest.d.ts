import "vitest";

/**
 * Typing for the value handed from `globalSetup` to the tests via `provide` / `inject`.
 */
declare module "vitest" {
  export interface ProvidedContext {
    libraryBaseUrl: string;
    /** The OData V2 endpoint of the same server, served by the V2 adapter middleware. */
    libraryV2BaseUrl: string;
  }
}
