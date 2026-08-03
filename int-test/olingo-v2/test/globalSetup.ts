import { GenericContainer, PullPolicy, StartedTestContainer, Wait } from "testcontainers";
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
const IMAGE = CUSTOM_IMAGE ?? "ghcr.io/odata2ts/test-server-olingo-v2:latest";
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
    let candidate = new GenericContainer(IMAGE)
      .withExposedPorts(CONTAINER_PORT)
      .withWaitStrategy(Wait.forHttp(`${SERVICE_PATH}/`, CONTAINER_PORT).forStatusCode(200));

    // `latest` moves, and testcontainers keeps a locally present image - so without this every later
    // run would silently test against whatever was pulled first. See int-test/cap for the full reasoning.
    if (!CUSTOM_IMAGE) {
      candidate = candidate.withPullPolicy(PullPolicy.alwaysPull());
    }

    container = await candidate.start();
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
