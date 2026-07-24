import { TrippinService } from "../../src-generated/trippin/TrippinService.js";
import { MockODataClient } from "../MockODataClient.js";

export const BASE_URL = "/test";
export const ODATA_CLIENT = new MockODataClient();
export const TRIPPIN = new TrippinService(ODATA_CLIENT, BASE_URL, { noUrlEncoding: true });
