# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.7.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.6.3...@odata2ts/odata-uri-builder@0.7.0) (2022-05-21)


### Features

* **uriBuilder:** simply use EntityPaths as select args ([fd21405](https://github.com/odata2ts/odata2ts/commit/fd2140586db9ab531e768d21646b07ab9a0b937a))
* **uriBuilder:** support for nested selects and nested expands (V2 only) ([a7ed0f5](https://github.com/odata2ts/odata2ts/commit/a7ed0f5df6df08e795a5e555def958b03ac9d273))
* **uriBuilder:** v2 support for UriBuilder ([7a5a504](https://github.com/odata2ts/odata2ts/commit/7a5a5048d436e752757089a270f80e5a2f1c0dea))


* Feat/refactor query objects (#20) ([67b662a](https://github.com/odata2ts/odata2ts/commit/67b662a6da3344eb215b4f1276bf26464d2126f5)), closes [#20](https://github.com/odata2ts/odata2ts/issues/20)


### Bug Fixes

* **test:** collect code coverage from src folders, thus exhibiting untested code ([3acef8b](https://github.com/odata2ts/odata2ts/commit/3acef8b83b2625579bbce4a967724e884c39c358))
* **test:** make coverage test run again ([f2d360b](https://github.com/odata2ts/odata2ts/commit/f2d360bac59901bd056dab5755dcf66d66988af5))


### BREAKING CHANGES

* **uriBuilder:** ODataUriBuilder has become an interface, while the real implementation is ODataUriBuilderV4
* no EntityFactory anymore, no nominalized types in interfaces anymore, etc.

* refactor(qObjects): getEntity with prefix option; by default without prefix

* fix(qObjects): better QPath modelling

* refactor(uri-builder): only use QueryObjects for typing & remove QEntityModel stuff

* refactor(odata2model): generate new QObject classes

* refactor(service): services now require Model as well as QClass

* refactor(odata2model): generate services with new QObject classes

* fix(odata2model): fix integration tests

* fix: make int-tests for coverage task work again

* fix: skip run-cli tests (don't work on github)





## [0.6.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.6.2...@odata2ts/odata-uri-builder@0.6.3) (2021-10-12)

**Note:** Version bump only for package @odata2ts/odata-uri-builder





## [0.6.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.6.1...@odata2ts/odata-uri-builder@0.6.2) (2021-09-17)

**Note:** Version bump only for package @odata2ts/odata-uri-builder





## [0.6.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.6.0...@odata2ts/odata-uri-builder@0.6.1) (2021-09-16)

**Note:** Version bump only for package @odata2ts/odata-uri-builder





# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.5.0...@odata2ts/odata-uri-builder@0.6.0) (2021-08-31)


### Features

* **uri-builder:** order by implementation for uri-builder ([3502b75](https://github.com/odata2ts/odata2ts/commit/3502b755f744ba2b58ee43331d85dc5ef6235304))





# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.4.0...@odata2ts/odata-uri-builder@0.5.0) (2021-08-16)


### Bug Fixes

* **uri-builder:** adapt to QEntityCollectionPath ([e1b02c1](https://github.com/odata2ts/odata2ts/commit/e1b02c18fa320b40a89142c5471006d7bbd5b488))
* more service tests, fix prop names vs odata names ([489b690](https://github.com/odata2ts/odata2ts/commit/489b69078144d3ed6a478373f7a22d8d923567ec))
* **uri-builder:** fix tests ([e1919d7](https://github.com/odata2ts/odata2ts/commit/e1919d753a80de163848b235bd2e619fc8483855))
* **url-builder:** don't add anything before the given path ([1c20145](https://github.com/odata2ts/odata2ts/commit/1c201451d9ed34e55e8c964730057584e7d01a72))


### Code Refactoring

* **uri-builder:** remove byId function ([e22cdae](https://github.com/odata2ts/odata2ts/commit/e22cdae47975bbf2689e4a1edcd471590590a8f6))


### Features

* **uri-builder:** adapt to new QEntityCollectionPath ([3eb3983](https://github.com/odata2ts/odata2ts/commit/3eb3983997b665633a502755788e8c964cbc0b53))


### BREAKING CHANGES

* **uri-builder:** public API has changed by removing byId()





# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.3.0...@odata2ts/odata-uri-builder@0.4.0) (2021-08-10)


### Bug Fixes

* **uri-builder:** adapt to breaking changes ([c5b5223](https://github.com/odata2ts/odata2ts/commit/c5b52236eed841533081494df9fd557b7e8b74cc))


### Code Refactoring

* QEntityModel without key spec ([913cd11](https://github.com/odata2ts/odata2ts/commit/913cd11df132969aca80054b2d1584bfe678a729))


### BREAKING CHANGES

* [query-objects]: QEntityModel without key spec & __collectionPath; [UrlBuilder]: path must be provided explicitly now for any entity set





# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.2.3...@odata2ts/odata-uri-builder@0.3.0) (2021-07-08)


### Bug Fixes

* adapt to breaking change of QExpression => QFilterExpression ([e54714c](https://github.com/odata2ts/odata2ts/commit/e54714c5577d69c3ee2aca81a1dc692b970182ac))


### Features

* **uri-builder:** reexport QExpression ([13006c7](https://github.com/odata2ts/odata2ts/commit/13006c7c3478b6da790b74d6569a472e38018e96))


### BREAKING CHANGES

* QExpression has become QFilterExpression (the change was actually introduced in a previous commit)





## [0.2.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.2.2...@odata2ts/odata-uri-builder@0.2.3) (2021-07-01)


### Bug Fixes

* **uri-builder:** add index.ts ([ef27c99](https://github.com/odata2ts/odata2ts/commit/ef27c997752c115de19549ee020eac4dad3a45a2))





## [0.2.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.2.1...@odata2ts/odata-uri-builder@0.2.2) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata-uri-builder





## [0.2.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-uri-builder@0.2.0...@odata2ts/odata-uri-builder@0.2.1) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata-uri-builder
