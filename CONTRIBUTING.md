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

By calling `yarn int-test` from the root folder all integration tests are executed.

You need to start one server first though:

```shell
yarn start-cap
```

While the CAP server is running, you can start the integration tests from a different terminal:

```shell
yarn int-test
```

Modules which come with integration tests store them in folder `test`.
You execute them by changing to the module and calling `yarn int-test` from there.

Nearly all integration tests are to be found in the [example projects](https://github.com/odata2ts/odata2ts/tree/main/examples).

### Commits & Pull Requests

We love [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and use them to drive
our semantic versioning. Try to adhere to these conventions. `odata2ts` uses the following `types`:

- `fix`: Bug fixes, fixing typos, etc.
- `feat`: New features
- `chore`:
- `doc`: Documentation changes
- `refactor`: Refactoring code
- `build`: changes to the build process

We will probably squash your commits before merging them into the `main` branch.
So also adhere to conventional commits within the title of your pull request.
Examples:

- fix(odata-query-builder): typo in README
- feat: my new feature
- ...

## Maintaining

Only available for maintainers.

### Release

```shell
yarn release
```
