# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
