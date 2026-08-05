# Integration Tests: CLI

End-to-end tests of the compiled CLI binary. Every case spawns `packages/odata2ts/lib/run-cli.js` as a real
subprocess - resolved through the actual workspace dependency, so it is the same artefact an npm consumer
runs - and judges it by its exit code, its output and the files it leaves behind.

```bash
yarn workspace @odata2ts/cli test
```

No server and no Docker: what is under test is the generation **run**, not the generated code.

## What belongs here, and what does not

The dividing line is whether a thing is observable without looking at the emitted TypeScript. Argument
parsing, config-file discovery, precedence between the two, the service selection, exit codes and error
messages all are. What an option does to the generated code is not - that is the business of the generator
unit tests in `packages/odata2ts/test/generator` and of the compile gate in `int-test/config-variants`.

The one deliberate exception is `debug`, in `config-file.test.ts`: it decides whether every emitted file
opens with `@ts-nocheck`, and that is worth pinning here because it is the reason every other generating
test configuration in this repository switches the option on. A type check over output which has exempted
itself from type checking proves nothing.

## The files

| File                  | Covers                                                                                |
| --------------------- | ------------------------------------------------------------------------------------- |
| `run-cli.test.ts`     | the bare invocation: missing arguments, a missing source file, output folder creation |
| `config-file.test.ts` | config discovery, the service selection, and what wins when both sides say something  |
| `source-url.test.ts`  | `--source-url` and `--refresh-file` against a local HTTP server which counts requests |

`config-file.test.ts` runs the binary inside `test/fixture/multi-service` and `test/fixture/single-service`,
because the CLI searches upwards from the working directory for its config file. Those fixture configs are
deliberately untyped: they are loaded by the CLI's own TypeScript loader from outside the workspace
resolution, so they cannot import from `@odata2ts/odata2ts`.

`source-url.test.ts` serves metadata from a throwaway `node:http` server and asserts the _requests_ it
receives. That is the only way to tell the interesting cases apart: a download which silently re-fetches on
every run and one which correctly uses the stored file look identical from the outside, and so do a refresh
which happened and one which did not.
