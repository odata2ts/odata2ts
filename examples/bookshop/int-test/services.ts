import { AxiosODataClient } from "@odata2ts/axios-odata-client";

import { AdminService } from "../src/admin/AdminService";
import { CatalogService } from "../src/catalog/CatalogService";

const BASE_URL = "http://localhost:4004";
const CATALOG_SERVICE_URL = BASE_URL + "/browse";
const ADMIN_SERVICE_URL = BASE_URL + "/admin";

export const catalogService = new CatalogService(new AxiosODataClient(), CATALOG_SERVICE_URL);
export const adminService = new AdminService(
  new AxiosODataClient({
    auth: {
      username: "alice",
      password: "",
    },
  }),
  ADMIN_SERVICE_URL
);
