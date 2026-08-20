import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import type { TestProject } from "vitest/node";

/**
 * Provisions the "Library" OData server for the integration tests and tears it down afterwards.
 *
 * Two modes, switched by the `LIBRARY_BASE_URL` env var:
 *
 * - **external server** (`LIBRARY_BASE_URL` set): use an already-running server as-is. No Docker involved -
 *   this is the path for machines without Docker (start `test-server-cap` manually) and lets the whole
 *   setup be developed and run before any image exists.
 * - **managed container** (default): start the published Docker image via testcontainers, wait for the
 *   service to answer, expose it on a dynamic host port and stop + remove it when the run finishes. This
 *   is the CI / Docker-machine path; `ubuntu-latest` ships Docker out of the box.
 *
 * The image is language-agnostic on purpose: future servers (ASP.NET, Java, ...) implement the same
 * standardized model and only differ in the image name, so this file is the single point that changes.
 *
 * The same server answers OData **V2** as well, on a path of its own: `@cap-js-community/odata-v2-adapter`
 * runs as a CAP plugin in front of the V4 endpoint and translates both ways. Its URL is therefore derived
 * from the V4 one rather than configured separately - there is only ever one server, see test/v2/.
 */
const CUSTOM_IMAGE = process.env.CAP_SERVER_IMAGE;
// Pinned to an exact version, never `latest`: a run is then reproducible, and a new server release
// arrives as a Renovate PR that CI runs these tests against - merging it is what accepts the new
// server. Renovate keeps this line current, see `customManagers` in the repo's renovate.json.
const IMAGE = CUSTOM_IMAGE ?? "ghcr.io/odata2ts/test-server-cap:0.2.0";
const SERVICE_PATH = "/odata/v4/library";
const SERVICE_PATH_V2 = "/odata/v2/library";
const CONTAINER_PORT = 4004;

/** The V2 endpoint of the very same service - the adapter mirrors the path, only the version segment differs. */
function toV2(baseUrl: string) {
  return baseUrl.replace(/\/v4\//, "/v2/");
}

export default async function setup(project: TestProject) {
  const externalBaseUrl = process.env.LIBRARY_BASE_URL;
  if (externalBaseUrl) {
    const trimmed = externalBaseUrl.replace(/\/+$/, "");
    project.provide("libraryBaseUrl", trimmed);
    project.provide("libraryV2BaseUrl", toV2(trimmed));
    return () => {};
  }

  let container: StartedTestContainer;
  try {
    container = await new GenericContainer(IMAGE)
      .withExposedPorts(CONTAINER_PORT)
      .withWaitStrategy(Wait.forHttp(`${SERVICE_PATH}/`, CONTAINER_PORT).forStatusCode(200))
      .start();
  } catch (e) {
    throw new Error(
      `Could not start the test server container "${IMAGE}".\n` +
        `Is a Docker daemon running? Without Docker, run against a server you started yourself:\n` +
        `  LIBRARY_BASE_URL=http://localhost:4004${SERVICE_PATH} yarn int-test:cap\n` +
        `Original error: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e as Error },
    );
  }

  const host = `http://localhost:${container.getMappedPort(CONTAINER_PORT)}`;
  project.provide("libraryBaseUrl", `${host}${SERVICE_PATH}`);
  project.provide("libraryV2BaseUrl", `${host}${SERVICE_PATH_V2}`);

  return async () => {
    await container.stop();
  };
}
