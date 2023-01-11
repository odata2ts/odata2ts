# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-bookshop@0.3.1...@odata2ts/example-bookshop@0.3.2) (2023-01-11)

**Note:** Version bump only for package @odata2ts/example-bookshop





## [0.3.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-bookshop@0.3.0...@odata2ts/example-bookshop@0.3.1) (2023-01-10)

**Note:** Version bump only for package @odata2ts/example-bookshop





# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/example-bookshop@0.2.0...@odata2ts/example-bookshop@0.3.0) (2023-01-07)


### Code Refactoring

* odata2model => odata2ts ([#97](https://github.com/odata2ts/odata2ts/issues/97)) ([4085c7c](https://github.com/odata2ts/odata2ts/commit/4085c7ccf173c6712c5238f8b43e86842eecb19a))


### Features

* **odata2ts:** use navToX instead of getXSrv ([#99](https://github.com/odata2ts/odata2ts/issues/99)) ([4aafcb0](https://github.com/odata2ts/odata2ts/commit/4aafcb0cd307748feed4df075459e17e83876f3b))


### BREAKING CHANGES

* **odata2ts:** changed default: uses "navToX" instead of "getXSrv" to navigate to other services; old behaviour can be restored via naming configuration prefix: "get", suffix: "Srv"
* rename odata2model to odata2ts; affects import in `odata2ts.config`, affects scripts in `package.json` or any scripts which use to call `odata2model` command directly





# 0.2.0 (2023-01-05)


### Bug Fixes

* **odata2ts:** operation return type for primitive values is wrong ([#91](https://github.com/odata2ts/odata2ts/issues/91)) ([fcbc28a](https://github.com/odata2ts/odata2ts/commit/fcbc28a8c388d256cb14ddf2a5935431e3a50478))


### Code Refactoring

* **odata2ts:** changing default regarding renaming ([#94](https://github.com/odata2ts/odata2ts/issues/94)) ([67124a2](https://github.com/odata2ts/odata2ts/commit/67124a206d28442e86ab4db50b4aa3eb17056727))


### Features

* CAP example ([#89](https://github.com/odata2ts/odata2ts/issues/89)) ([dfe7ccd](https://github.com/odata2ts/odata2ts/commit/dfe7ccd253458ab5d0e210a9abdb1775af4a7aff))


### BREAKING CHANGES

* **odata2ts:** new default: allowRenaming=false; removed prop `naming.disableNamingStrategy`
