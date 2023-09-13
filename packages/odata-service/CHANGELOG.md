# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.17.0...@odata2ts/odata-service@0.17.1) (2023-09-13)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.17.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.16.0...@odata2ts/odata-service@0.17.0) (2023-08-08)

### Features

* service generation for primitive types ([#201](https://github.com/odata2ts/odata2ts/issues/201)) ([ea9e645](https://github.com/odata2ts/odata2ts/commit/ea9e6452f6b4033c489fbceaf6b75591b550a3f1))

### BREAKING CHANGES

* removed the public method "getQObject"

* refactor(odata2ts): use __base properties of inherited services

* feat(service): introduce PrimitiveTypeService

* feat(odata2ts): allow to generate PrimitiveTypeServices via option enablePrimitivePropertyServices

* feat(example): integration tests for primitive type services

# [0.16.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.15.2...@odata2ts/odata-service@0.16.0) (2023-07-31)

### Features

* **service:** add big number handling for V4 ([#194](https://github.com/odata2ts/odata2ts/issues/194)) ([13db4bb](https://github.com/odata2ts/odata2ts/commit/13db4bbf677c20c65767bbc8342390750c43253b))

## [0.15.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.15.1...@odata2ts/odata-service@0.15.2) (2023-06-14)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.15.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.15.0...@odata2ts/odata-service@0.15.1) (2023-06-10)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.15.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.14.0...@odata2ts/odata-service@0.15.0) (2023-06-03)

### Features

* force new minor for new http-client-api ([c29d5bc](https://github.com/odata2ts/odata2ts/commit/c29d5bc009776f1791e64e7f397f14fa6444ff1a))

# [0.14.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.9...@odata2ts/odata-service@0.14.0) (2023-04-27)

### Code Refactoring

* **service:** entity resolver without create & parse key; EntitySetService with its corresponding EntityTypeService ([d2090b1](https://github.com/odata2ts/odata2ts/commit/d2090b16b6a2468ce2e0066454856dedd0f741bf))

* **service:** remove EntityServiceResolver ([f46dfb9](https://github.com/odata2ts/odata2ts/commit/f46dfb97570bf3f45e526e4c3fa299ffaa28e5cd))

### BREAKING CHANGES

* **service:** Exposed class EntityServiceResolver has been removed; no user impact expected, only for internal use

* **service:** Services representing entity sets have lost the following methods: get, patch, delete. They were all delegated to the corresponding EntityTypeService. Now you directly choose in the beginning whether you want the collection service (by providing no ID parameter) or the entity type (by providing the ID parameter).

## [0.13.9](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.8...@odata2ts/odata-service@0.13.9) (2023-04-18)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.8](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.7...@odata2ts/odata-service@0.13.8) (2023-04-13)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.7](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.6...@odata2ts/odata-service@0.13.7) (2023-04-08)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.6](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.5...@odata2ts/odata-service@0.13.6) (2023-04-04)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.5](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.4...@odata2ts/odata-service@0.13.5) (2023-02-14)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.4](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.1...@odata2ts/odata-service@0.13.4) (2023-02-13)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.1...@odata2ts/odata-service@0.13.3) (2023-02-13)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.1...@odata2ts/odata-service@0.13.2) (2023-02-13)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.13.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.13.0...@odata2ts/odata-service@0.13.1) (2023-02-03)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.13.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.12.0...@odata2ts/odata-service@0.13.0) (2023-01-10)

### Features

* **odata-service:** allow for manual response typings ([#109](https://github.com/odata2ts/odata2ts/issues/109)) ([2e21575](https://github.com/odata2ts/odata2ts/commit/2e215752563565942955489b627e67f64dba5530))

# [0.12.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.11.0...@odata2ts/odata-service@0.12.0) (2023-01-07)

### Code Refactoring

* rename odata-uri-builder to odata-query-builder ([#98](https://github.com/odata2ts/odata2ts/issues/98)) ([e0de825](https://github.com/odata2ts/odata2ts/commit/e0de825663fab15c37854ae08f75ab8df761cd3e))

### Features

* **odata-service:** introduce entity service resolver ([#100](https://github.com/odata2ts/odata2ts/issues/100)) ([66dd853](https://github.com/odata2ts/odata2ts/commit/66dd853bbc28a0758fae04abd5e8885689aeabc2))

### BREAKING CHANGES

* rename module odata-uri-builder to odata-query-builder; API completely refactored by renaming all models, classes, functions, props from "uri" to "query"

# [0.11.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.10.1...@odata2ts/odata-service@0.11.0) (2023-01-05)

### Features

* encode & decode function params properly ([#96](https://github.com/odata2ts/odata2ts/issues/96)) ([ca88f57](https://github.com/odata2ts/odata2ts/commit/ca88f572674181962760005cf33f820e231a2b51))

## [0.10.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.10.0...@odata2ts/odata-service@0.10.1) (2022-12-21)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.10.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.8.1...@odata2ts/odata-service@0.10.0) (2022-12-18)

### Bug Fixes

* **odata-service:** adapt fixture ([6c0c302](https://github.com/odata2ts/odata2ts/commit/6c0c302114bcf7643ba3f20f1185f5d30ebe37e1))

### Features

* **odata-query-objects:** conversion functions for QueryObject ([#73](https://github.com/odata2ts/odata2ts/issues/73)) ([86cc256](https://github.com/odata2ts/odata2ts/commit/86cc2563568ff5b6dd079de701521ae43437087d))

* **odata-service:** name mapping and conversion for request and response (all CRUD actions) ([b124d5c](https://github.com/odata2ts/odata2ts/commit/b124d5cc870d022303ee3ef36b1b09f2061e6037))

# [0.9.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.8.1...@odata2ts/odata-service@0.9.0) (2022-12-18)

### Bug Fixes

* **odata-service:** adapt fixture ([6c0c302](https://github.com/odata2ts/odata2ts/commit/6c0c302114bcf7643ba3f20f1185f5d30ebe37e1))

### Features

* **odata-query-objects:** conversion functions for QueryObject ([#73](https://github.com/odata2ts/odata2ts/issues/73)) ([86cc256](https://github.com/odata2ts/odata2ts/commit/86cc2563568ff5b6dd079de701521ae43437087d))

* **odata-service:** name mapping and conversion for request and response (all CRUD actions) ([b124d5c](https://github.com/odata2ts/odata2ts/commit/b124d5cc870d022303ee3ef36b1b09f2061e6037))

## [0.8.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.8.0...@odata2ts/odata-service@0.8.1) (2022-09-09)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.8.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.7.1...@odata2ts/odata-service@0.8.0) (2022-09-08)

### Bug Fixes

* **odata-service:** V2 function params: nullable values should be filtered instead of using value null ([#60](https://github.com/odata2ts/odata2ts/issues/60)) ([e412f83](https://github.com/odata2ts/odata2ts/commit/e412f83e5f096c25781048c25e26768e1cccae2b))

### Code Refactoring

* centralize formatting and parsing of params & attributes ([#62](https://github.com/odata2ts/odata2ts/issues/62)) ([ba93a27](https://github.com/odata2ts/odata2ts/commit/ba93a278afd2de356675973fb2889483bc370f7a))

### Features

* **odata-service:** allow to pass custom headers per request ([#58](https://github.com/odata2ts/odata2ts/issues/58)) ([d783e51](https://github.com/odata2ts/odata2ts/commit/d783e51e4b5a69892c79a03bedc6bf041abba9ec))

### BREAKING CHANGES

* UrlHelper including compile and parse methods have been removed; interfaces for EntityKeyProp, EntityKeySpec, InlineUrlProp, and InlineUrlProps have been removed; parsing of passed parameters is more strict.

Introducing static functions on QPath objects to format and parse url conform values.

Introducing QParams, QFunction and QAction to bundle logic around operations including the id function (url path generation).

Generate models for IdType of entity & parameter models for functions / actions in general

Generate Q-objects for EntityIdFunctions, and functions & actions in general

## [0.7.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.7.0...@odata2ts/odata-service@0.7.1) (2022-08-25)

### Bug Fixes

* always create errors with new operator ([#54](https://github.com/odata2ts/odata2ts/issues/54)) ([562dede](https://github.com/odata2ts/odata2ts/commit/562dede85d7ce276957a4b1683856d4adfee3ad1))

# [0.7.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.6.0...@odata2ts/odata-service@0.7.0) (2022-08-11)

### Bug Fixes

* **service:** UrlHelper should allow empty strings => typing is correct ([efc7ac6](https://github.com/odata2ts/odata2ts/commit/efc7ac6fe94a0a98a26e8b6d07aa757b1204d61d))

### Code Refactoring

* **uri-builder:** composition over inheritance, proper interfaces ([#48](https://github.com/odata2ts/odata2ts/issues/48)) ([36c8a0a](https://github.com/odata2ts/odata2ts/commit/36c8a0a27dabfbcfbd2359d040dcda518615a4e0))

* **uri-builder:** expose interfaces instead of implementations through factory function ([#50](https://github.com/odata2ts/odata2ts/issues/50)) ([ae1d960](https://github.com/odata2ts/odata2ts/commit/ae1d960d5ead1aabbf1e6b22bf720f7a48cc0e98))

### BREAKING CHANGES

* **uri-builder:** ODataUriBuilders must be created in a new way. Previously `ODataUriBuilderV4.create(...)`, now `createUriBuilderV4(...)`. The params stayed the same.

* refactor(uri-builder): rename interfaces by removing "Model" suffix

* fix(service): import and use factory function

* **uri-builder:** It was possible to select nested props by using q-props (V2 only); this syntax has been removed and will be replaced by making use of the current V4 syntax: you first expand the property (method "expanding") and then select (or expand) on the expanded entity.

* **uri-builder:** ODataUriBuilder was removed from export, it might have served as base class but was of no other use.

# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.5.4...@odata2ts/odata-service@0.6.0) (2022-08-01)

### Features

* createKey and parseKey for EntitySetService & correct V2 type prefixing ([#39](https://github.com/odata2ts/odata2ts/issues/39)) ([edd05bb](https://github.com/odata2ts/odata2ts/commit/edd05bbf7747ba280786c9ba274160ef274c030a))

* typing improvements & editable model versions ([#27](https://github.com/odata2ts/odata2ts/issues/27)) ([df290df](https://github.com/odata2ts/odata2ts/commit/df290dff953a9e37c64c39c18ffdec74ce1874d4))

### BREAKING CHANGES

* model has become a true query response model.

Properties which are nullable now allow null values instead of undefined;

complex types are never undefined, but can be nullable;

collections are never nullable.

V2 only: added deferred content typings for entity and entity collection properties.

* feat: generate EditableModels and use in service for create, update, and patch

* different signatures for all actions

* test: proper test for ModelImportContainer & dataModel.getEditableModelName

* test: proper test for DataModel

* refactor(odata2model): don't always combine handling of complex and entity types

## [0.5.4](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.5.3...@odata2ts/odata-service@0.5.4) (2022-07-20)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.5.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.5.2...@odata2ts/odata-service@0.5.3) (2022-07-11)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.5.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.5.1...@odata2ts/odata-service@0.5.2) (2022-06-30)

### Bug Fixes

* add prebulish script to guarantee building before publishing ([b6986db](https://github.com/odata2ts/odata2ts/commit/b6986dbdb258b7b3cb8f36ab52ae1ff7b093f7dc))

## [0.5.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.5.0...@odata2ts/odata-service@0.5.1) (2022-06-30)

**Note:** Version bump only for package @odata2ts/odata-service

# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.4.0...@odata2ts/odata-service@0.5.0) (2022-05-21)

### Bug Fixes

* V2 function params as query params ([07a1f29](https://github.com/odata2ts/odata2ts/commit/07a1f294005b9af7f1ebadecd8978ffca7caa80f))

* **test:** correct fixture for model ([1142538](https://github.com/odata2ts/odata2ts/commit/1142538214f2855833bd0e585169bc7a30cc7760))

* **test:** make coverage test run again ([f2d360b](https://github.com/odata2ts/odata2ts/commit/f2d360bac59901bd056dab5755dcf66d66988af5))

* wrong import of MockODataClient ([5c26c75](https://github.com/odata2ts/odata2ts/commit/5c26c75190d069e61ec4b3f9a7b2c0810012a407))

### Features

* **odata2model:** V2 service generation support ([2b17a01](https://github.com/odata2ts/odata2ts/commit/2b17a013d65fc12aac8315bc34bce441eb505870))

* **service:** V2 support for services + refactored EntitySetService to include get method & keySpec ([cdc818c](https://github.com/odata2ts/odata2ts/commit/cdc818c3aa810d2d4b7072c883de4e184643d8aa))

* Feat/refactor query objects (#20) ([67b662a](https://github.com/odata2ts/odata2ts/commit/67b662a6da3344eb215b4f1276bf26464d2126f5)), closes [#20](https://github.com/odata2ts/odata2ts/issues/20)

### BREAKING CHANGES

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

# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.3.1...@odata2ts/odata-service@0.4.0) (2021-10-12)

### Features

* **qObjects:** entityPath with props attribute ([#11](https://github.com/odata2ts/odata2ts/issues/11)) ([5d2f5d1](https://github.com/odata2ts/odata2ts/commit/5d2f5d12b968cafd53fa07ec5e9fe4d5bd086ad0))

## [0.3.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.3.0...@odata2ts/odata-service@0.3.1) (2021-09-17)

### Bug Fixes

* **odata-service:** revert exposure of Unnominalized ([6ce4ea7](https://github.com/odata2ts/odata2ts/commit/6ce4ea779f3a83e67aa02d6d9213dcec2711df8a))

# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.2.3...@odata2ts/odata-service@0.3.0) (2021-09-17)

### Code Refactoring

* **odata-service:** use odata names as param names ([73b130a](https://github.com/odata2ts/odata2ts/commit/73b130a06411e9e7bf030a3dd605d2bcaebf1d70))

### Features

* **odata-service:** remove id field from create param when it's a Guid & introduce typing tests ([9943a0d](https://github.com/odata2ts/odata2ts/commit/9943a0da80bc9f31dd96f247514865c8ea2408c6))

* **odata-service:** unnominalize response & input values of EntitySet & EntityType methods ([03f8318](https://github.com/odata2ts/odata2ts/commit/03f8318bdd75c4666413a8d9a196056a0a52ebd1))

### BREAKING CHANGES

* **odata-service:** param names of complex keys have changed

## [0.2.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.2.2...@odata2ts/odata-service@0.2.3) (2021-09-16)

**Note:** Version bump only for package @odata2ts/odata-service

## [0.2.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.2.1...@odata2ts/odata-service@0.2.2) (2021-08-31)

### Bug Fixes

* **service:** don't use nominal types for input; use string instead ([788dc5c](https://github.com/odata2ts/odata2ts/commit/788dc5c091e5d1e29e2cf9f44cf1485f65691a6b))

## [0.2.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-service@0.2.0...@odata2ts/odata-service@0.2.1) (2021-08-16)

### Bug Fixes

* **service:** add dependency to odata-client-api ([e90605b](https://github.com/odata2ts/odata2ts/commit/e90605b97664eb7d4ff215a909aa0a486be4c4ea))

* **service:** also allow for boolean as InlineUrlProp ([428a095](https://github.com/odata2ts/odata2ts/commit/428a095be138c0e7c696aaf1baf7e0a656b352fa))

* **service:** fix response types of collection queries ([2f5a5d9](https://github.com/odata2ts/odata2ts/commit/2f5a5d9c71ed6f05543571dba897a60834662448))

# 0.2.0 (2021-08-16)

### Bug Fixes

* **service:** Fix CollectionService ([621c03e](https://github.com/odata2ts/odata2ts/commit/621c03e4018e033c80d10193308a38e978817f92))

* more service tests, fix prop names vs odata names ([489b690](https://github.com/odata2ts/odata2ts/commit/489b69078144d3ed6a478373f7a22d8d923567ec))

### Features

* **odata-service:** base setup ([47e8e15](https://github.com/odata2ts/odata2ts/commit/47e8e15dad783ad2c915e251e713f067acb90b65))

* **odata-service:** EntitySet, EntityType & ODataService (draft) ([aecb45f](https://github.com/odata2ts/odata2ts/commit/aecb45f4d531b7480ea462634cf4279db4924ee3))

* **odata-service:** generic inteface for OData client ([a5597d1](https://github.com/odata2ts/odata2ts/commit/a5597d1a1b3a3d8faceec8724ce94221b6bbeaa9))

* **odata-service:** generic interface for OData client ([59d9e31](https://github.com/odata2ts/odata2ts/commit/59d9e3121c8ab2f87e6489476e28e11858d27161))

* **odata-service:** implementing patch, update, delete & first draft of CollectionService ([cefb148](https://github.com/odata2ts/odata2ts/commit/cefb148c320e35c28dc1a1e6abc8453285d4d968))

* **odata2model:** add keySpec to EntitySets & implement get() ([500e576](https://github.com/odata2ts/odata2ts/commit/500e576a95206bb23985f7a24de3e2e054f9c084))

* **service:** init navProps via accessor instead of getter methods ([bb93f30](https://github.com/odata2ts/odata2ts/commit/bb93f304c06ff5e3e3e2ec1ce0ff27f884108feb))

* **service:** remove id specific stuff from EntitSetService & make props protected ([62a44c2](https://github.com/odata2ts/odata2ts/commit/62a44c26758ac963743fc21e657e0fb4e9daec2f))

* **service:** url helper methods ([16945d9](https://github.com/odata2ts/odata2ts/commit/16945d938003cd87e95e4ee0a87633889f60b054))
