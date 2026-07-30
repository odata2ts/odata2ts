export enum ODataVersions {
  V2,
  V4,
}

/**
 * The minor version of OData V4 which is targeted, decided by the generator.
 *
 * It governs the spelling of the control information: 4.0 payloads must use the {@code odata.} prefix,
 * while 4.01 and greater use the short form.
 */
export type ODataVersionV4 = "4.0" | "4.01";
