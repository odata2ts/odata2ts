import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import type { TestProject } from "vitest/node";
import serverImage from "../server-image.json" with { type: "json" };

/**
 * Provisions the ASP.NET Core "Library" OData server for the integration tests and tears it down afterwards.
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
 * The image is language-agnostic on purpose: further servers (Java, ...) implement the same
 * standardized model and only differ in the image name, so this file is the single point that changes.
 */
const CUSTOM_IMAGE = process.env.ASPNET_SERVER_IMAGE;
// Pinned to an exact version, never `latest`: a run is then reproducible, and a new server release
// arrives as a PR that CI runs these tests against - merging it is what accepts the new server. The pin
// lives in its own JSON file because a bot maintains it: the server repo dispatches its release here and
// `.github/workflows/bump-test-server.yml` edits that file. Nothing parses this expression.
const IMAGE = CUSTOM_IMAGE ?? `${serverImage.image}:${serverImage.version}`;
const SERVICE_PATH = "/odata/v4/library";
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
        `  LIBRARY_BASE_URL=http://localhost:4004${SERVICE_PATH} yarn int-test:asp-net\n` +
        `Original error: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e },
    );
  }

  project.provide("libraryBaseUrl", `http://localhost:${container.getMappedPort(CONTAINER_PORT)}${SERVICE_PATH}`);

  return async () => {
    await container.stop();
  };
}
