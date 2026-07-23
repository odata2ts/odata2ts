import { defineWorkspace } from "vitest/config";

// Only the library packages: this is the unit-test / coverage run.
//
// `examples/*` are their own category - they have `test` and `int-test` scripts that are run on demand,
// never as part of a pipeline. `int-test/*` needs real servers and runs in its own CI stage.
export default defineWorkspace(["packages/*"]);
