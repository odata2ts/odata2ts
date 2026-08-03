import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryConvertedService } from "../src-generated/library-converted/LibraryConvertedService.js";

/**
 * The same server through the converter-enabled client.
 *
 * Deliberately a second service instance rather than a replacement: `LibraryTestConstants` drives the raw
 * client, which is what pins the wire format, and this one pins what the converters make of it.
 */
export const CONVERTED = new LibraryConvertedService(new FetchClient(), inject("libraryBaseUrl"));
