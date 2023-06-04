import { AxiosClient } from "@odata2ts/http-client-axios";

import { AdminV2Service } from "../../src/adminV2/AdminV2Service";
import { CatV2Service } from "../../src/catV2/CatV2Service";

const BASE_URL = "http://localhost:4004/v2";
const CATALOG_SERVICE_URL = BASE_URL + "/browse";
const ADMIN_SERVICE_URL = BASE_URL + "/admin";

export const catalogV2Service = new CatV2Service(new AxiosClient(), CATALOG_SERVICE_URL);
export const adminV2Service = new AdminV2Service(
  new AxiosClient({
    auth: {
      username: "alice",
      password: "",
    },
  }),
  ADMIN_SERVICE_URL
);
