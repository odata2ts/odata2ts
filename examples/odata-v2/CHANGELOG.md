# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.7](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.6...@odata2ts/example-odata-v2@0.2.7) (2023-04-04)

**Note:** Version bump only for package @odata2ts/example-odata-v2

## [0.2.6](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.5...@odata2ts/example-odata-v2@0.2.6) (2023-03-23)

**Note:** Version bump only for package @odata2ts/example-odata-v2

## [0.2.5](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.4...@odata2ts/example-odata-v2@0.2.5) (2023-02-24)

**Note:** Version bump only for package @odata2ts/example-odata-v2

## [0.2.4](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.3...@odata2ts/example-odata-v2@0.2.4) (2023-02-24)

### Bug Fixes

* **build:** update deps of examples ([831fe07](https://github.com/odata2ts/odata2ts/commit/831fe07197f999dde9509a9166f189b49dccc8bc))

## [0.2.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.2...@odata2ts/example-odata-v2@0.2.3) (2023-02-03)

**Note:** Version bump only for package @odata2ts/example-odata-v2

## [0.2.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.1...@odata2ts/example-odata-v2@0.2.2) (2023-01-11)

**Note:** Version bump only for package @odata2ts/example-odata-v2

## [0.2.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.2.0...@odata2ts/example-odata-v2@0.2.1) (2023-01-10)

**Note:** Version bump only for package @odata2ts/example-odata-v2

# [0.2.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-odata-v2@0.1.0...@odata2ts/example-odata-v2@0.2.0) (2023-01-07)

### Code Refactoring

* odata2model => odata2ts ([#97](https://github.com/odata2ts/odata2ts/issues/97)) ([4085c7c](https://github.com/odata2ts/odata2ts/commit/4085c7ccf173c6712c5238f8b43e86842eecb19a))

### Features

* **odata2ts:** use navToX instead of getXSrv ([#99](https://github.com/odata2ts/odata2ts/issues/99)) ([4aafcb0](https://github.com/odata2ts/odata2ts/commit/4aafcb0cd307748feed4df075459e17e83876f3b))

### BREAKING CHANGES

* **odata2ts:** changed default: uses "navToX" instead of "getXSrv" to navigate to other services; old behaviour can be restored via naming configuration prefix: "get", suffix: "Srv"

* rename odata2model to odata2ts; affects import in `odata2ts.config`, affects scripts in `package.json` or any scripts which use to call `odata2model` command directly

# 0.1.0 (2023-01-05)

### Code Refactoring

* **odata2ts:** changing default regarding renaming ([#94](https://github.com/odata2ts/odata2ts/issues/94)) ([67124a2](https://github.com/odata2ts/odata2ts/commit/67124a206d28442e86ab4db50b4aa3eb17056727))

### Features

* **axios-odata-client:** default error message retriever ([#82](https://github.com/odata2ts/odata2ts/issues/82)) ([11b7b61](https://github.com/odata2ts/odata2ts/commit/11b7b6171291ba78c2e2b4c7ab39a6c425d02cf1))

* **axios-odata-client:** MERGE implementation for V2 ([#83](https://github.com/odata2ts/odata2ts/issues/83)) ([097005f](https://github.com/odata2ts/odata2ts/commit/097005fda1f4008c1fe3ea71f177697867e761fe))

* **odata2ts:** automatically handle managed props ([#88](https://github.com/odata2ts/odata2ts/issues/88)) ([37eef19](https://github.com/odata2ts/odata2ts/commit/37eef1918f25a4943ae19475dc987463639ab9f4))

### BREAKING CHANGES

* **odata2ts:** new default: allowRenaming=false; removed prop `naming.disableNamingStrategy`

* **axios-odata-client:** errorMessageRetriever is not part of the constructor signature anymore; use the setter if you want to apply a custom error message retriever
