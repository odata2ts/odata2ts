import { TrippinService } from "../build/trippin/TrippinService";
import { MockODataClient } from "./MockODataClient";

export const BASE_URL = "/test";
export const ODATA_CLIENT = new MockODataClient();
export const TRIPPIN = new TrippinService(ODATA_CLIENT, BASE_URL);
export const TRIPPIN_NE = new TrippinService(ODATA_CLIENT, BASE_URL, { noUrlEncoding: true });
