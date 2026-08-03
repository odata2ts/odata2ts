import "vitest";

/**
 * Typing for the value handed from `globalSetup` to the tests via `provide` / `inject`.
 */
declare module "vitest" {
  export interface ProvidedContext {
    libraryBaseUrl: string;
  }
}
