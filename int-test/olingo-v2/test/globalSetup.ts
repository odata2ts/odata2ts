import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import type { TestProject } from "vitest/node";

/**
 * Provisions the Apache Olingo 2 "Library" server for the integration tests and tears it down afterwards.
 *
 * Same two modes as the other server packages, switched by the `LIBRARY_BASE_URL` env var:
 *
 * - **external server** (`LIBRARY_BASE_URL` set): use an already-running server as-is - for machines
 *   without Docker, or to test against one started from the server repo (`java -jar target/library-server.jar`).
 * - **managed container** (default): start the published image via testcontainers, wait for the service
 *   to answer, expose it on a dynamic host port and stop + remove it when the run finishes.
 *
 * Unlike the CAP server there is nothing to deploy or seed: the data lives in memory and is rebuilt per
 * process, so a restart is a full reset.
 */
const CUSTOM_IMAGE = process.env.OLINGO_SERVER_IMAGE;
// Pinned to an exact version, never `latest`: a run is then reproducible, and a new server release
// arrives as a Renovate PR that CI runs these tests against - merging it is what accepts the new
// server. Renovate keeps this line current, see `customManagers` in the repo's renovate.json.
const IMAGE = CUSTOM_IMAGE ?? "ghcr.io/odata2ts/test-server-olingo-v2:0.2.0";
const SERVICE_PATH = "/odata/v2/library";
const CONTAINER_PORT = 4004;

export default async function setup(project: TestProject) {
  const externalBaseUrl = process.env.LIBRARY_BASE_URL;
  if (externalBaseUrl) {
    project.provide("libraryBaseUrl", externalBaseUrl.replace(/\/+$/, ""));
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
        `  LIBRARY_BASE_URL=http://localhost:4004${SERVICE_PATH} yarn int-test:olingo-v2\n` +
        `Original error: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e },
    );
  }

  project.provide("libraryBaseUrl", `http://localhost:${container.getMappedPort(CONTAINER_PORT)}${SERVICE_PATH}`);

  return async () => {
    await container.stop();
  };
}
