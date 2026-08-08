# Contribution Guidelines

We welcome any contribution to `odata2ts`:

- bug reports
- feature requests
- pull requests
- suggestions
- usage questions
- ...

We're using [Github Issues](https://github.com/odata2ts/odata2ts/issues) and
[Pull Requests](https://github.com/odata2ts/odata2ts/pulls) as main line of communication.

## Having Questions

We expect that you've read the [odata2ts documentation](https://odata2ts.github.io/docs/intro).
A lot of work went into it and it should be your prime source to get the information you need.

However, as soon as the documentation does not live up to this standard
(you don't find the documentation or don't get the answer you actually need, etc.),
then by all means **open an issue** on Github. Please feel encouraged to do so, because it indicates
a shortcoming of the documentation.

Also, if your OData service doesn't behave according to the specification, please create an issue as well.
The world's not perfect and `odata2ts` should cope with that
(see [issue #144](https://github.com/odata2ts/odata2ts/issues/144) for an example).

## Creating Issues

Currently, there's no template in place for creating issues.
Use the closed issues as examples, they were all relevant and pretty well written.

So, you have read the relevant documentation parts and skimmed through the existing issues,
then [go for it](https://github.com/odata2ts/odata2ts/issues/new).

## Code Contributions

### Prerequisites

- Node.js
- Yarn

### Setup

Clone the repo.

```shell
yarn install
yarn build
```

### Dependencies

Every workspace must declare the tools its own scripts call — `typescript`, `vitest`, `rimraf`, `madge` and the like.
Yarn only exposes the binaries of the dependencies a workspace declares itself; there is no fallback to the root's
`node_modules/.bin`. A script invoking an undeclared binary fails with `command not found`.

To keep those repeated declarations from drifting apart, the root `package.json` is the single source of truth:
`yarn.config.cjs` holds a [Yarn constraint](https://yarnpkg.com/features/constraints) that pins the
`dependencies` and `devDependencies` of every workspace to the range declared in the root.

So whenever you add a dependency or change its version:

1. Set the version in the root `package.json`.
2. Add the dependency to each workspace that needs it — the range doesn't matter yet.
3. Run `yarn constraints --fix` to align all workspaces with the root, then `yarn install`.

`yarn constraints` (check only, no changes) runs in CI and fails the build on any mismatch.

`peerDependencies` are exempt on purpose: they state what a consumer has to bring along, not what this repo
installs — e.g. the `typescript: ">= 4.7"` floor of `packages/odata2ts`, which `int-test/ts-floor-check` verifies.

### Running Unit Tests

To run the **unit tests** of all modules:

```shell
yarn test
```

Each module should come with its own set of unit tests in folder `test`.
To execute only unit tests of a specific module, change to the module in question and call `yarn test` from there.

Modules without unit tests:

- modules which represent APIs / consist only of TypeScript types, e.g. `odata-core` or `odata-client-api`
- axios-odata-client
- jquery-odata-client

### Running Integration Tests

By calling `yarn int-test` from the root folder all integration tests are executed. You also have the option
to call a specif integration test suite, e.g. `yarn int-test:asp-net`.

The integration tests are all to be found within folder `int-test` at the root level of the project. It contains:

- `cli`: tests regarding the command line interface
- `ts-floor-check`: ensures that the specified min TS version holds true in spite of using a higher version within the project
- `config-variants`: type checks the generation output for the multitude of configuration options
- `asp-net`: ASPNet Core implementation of our reference model (V4)
- `cap`: SAP CAP implementation of our reference model (V4)
  - also allows for V2 by using an adapter
  - for odata2ts not a proper V2 service: V4 under the hood & some essential divergencies to V2
  - also V2 is intended for a different purpose: mediator to other services which are V2
- `olingo-v2`: Olingo 2 implementation of our reference model (V2)
  - already archived Java framework
  - but runs in a simple container in contrast to old Microsoft stacks which produced V2

Each server comes from its own repository and publishes an image to the github registry. Each integration test
package then pulls this image, starts the container and runs the tests.

### Commits & Pull Requests

We love [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and use them to drive
our semantic versioning. Try to adhere to these conventions. `odata2ts` uses the following `types`:

- `fix`: Bug fixes, fixing typos, etc.
- `feat`: New features
- `chore`: minor dependency updates, boy scout stuff, small maintenance tasks
- `doc`: Documentation changes
- `refactor`: Refactoring code
- `build`: changes to the build process

Try to scope the commit message when it belongs to only one package, e.g. `fix(odata-query-objects): ...`.
Use the package name as scope without the `@odata2ts/` prefix.

Breaking changes are announced via an exclamation mark after the scope, e.g. `feat(odata-service)!: ...` or
`feat!: ...` without scope. Also add an own paragraph in the body starting with "BREAKING CHANGE:".

We will probably squash your commits before merging them into the `main` branch.
So also adhere to conventional commits within the title of your pull request.

## Release

We use [release-please](https://github.com/googleapis/release-please) which has the following workflow:

- create PR's against `main`
- after merging into `main`, release-please will create an own PR which will execute the release, when merged.
