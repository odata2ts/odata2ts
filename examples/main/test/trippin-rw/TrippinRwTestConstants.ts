import { TrippinRwService } from "../../src-generated/trippin-rw/TrippinRwService.js";
import { MockODataClient } from "../MockODataClient.js";

export const BASE_URL = "/test";
export const ODATA_CLIENT = new MockODataClient();
export const TRIPPIN = new TrippinRwService(ODATA_CLIENT, BASE_URL, { noUrlEncoding: true });
