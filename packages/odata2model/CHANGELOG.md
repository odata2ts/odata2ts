# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.11.1...@odata2ts/odata2model@0.11.2) (2022-07-20)


### Bug Fixes

* guids in v2 have special syntax (guid'xxxx-...') ([#35](https://github.com/odata2ts/odata2ts/issues/35)) ([a551bcc](https://github.com/odata2ts/odata2ts/commit/a551bccf27dc7e8348020840402372582f9448e5))





## [0.11.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.11.0...@odata2ts/odata2model@0.11.1) (2022-07-11)

**Note:** Version bump only for package @odata2ts/odata2model





# [0.11.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.10.1...@odata2ts/odata2model@0.11.0) (2022-07-06)


### Features

* **odata2model:** actions & function on collection level ([#33](https://github.com/odata2ts/odata2ts/issues/33)) ([985b2dc](https://github.com/odata2ts/odata2ts/commit/985b2dc6ca443a73b3a4c877712199c23c5a75cb))





## [0.10.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.10.0...@odata2ts/odata2model@0.10.1) (2022-06-30)


### Bug Fixes

* add prebulish script to guarantee building before publishing ([b6986db](https://github.com/odata2ts/odata2ts/commit/b6986dbdb258b7b3cb8f36ab52ae1ff7b093f7dc))





# [0.10.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.9.0...@odata2ts/odata2model@0.10.0) (2022-06-30)


### Features

* use pascalCase for file names and allow to override serviceName ([#30](https://github.com/odata2ts/odata2ts/issues/30)) ([5aa1e44](https://github.com/odata2ts/odata2ts/commit/5aa1e44a32099d781649ffbed87daa85d0647f5f))


### BREAKING CHANGES

* new file names







# [0.9.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.8.2...@odata2ts/odata2model@0.9.0) (2022-05-21)


### Bug Fixes

* V2 function params as query params ([07a1f29](https://github.com/odata2ts/odata2ts/commit/07a1f294005b9af7f1ebadecd8978ffca7caa80f))
* **odata2model:** fix tests ([efd12bc](https://github.com/odata2ts/odata2ts/commit/efd12bcfb44b7522f3d5ff6c157acd8ca12f74cf))
* **odata2model:DataModel:** Duplicate keys when extending multiple times ([157aa13](https://github.com/odata2ts/odata2ts/commit/157aa13a1ffc765b90abdfd2824a4da5fd0729ec))
* **odata2model:test:** name northwind-v4 fixture correctly ([39e77f4](https://github.com/odata2ts/odata2ts/commit/39e77f46ea2de2fa381480d89e7c5551cd57d411))
* **test:** collect code coverage from src folders, thus exhibiting untested code ([3acef8b](https://github.com/odata2ts/odata2ts/commit/3acef8b83b2625579bbce4a967724e884c39c358))
* **test:** fix data-model tests ([b8abb8a](https://github.com/odata2ts/odata2ts/commit/b8abb8afe7dfdf4d940bb4cbc8d92575e0416087))
* **test:** make coverage test run again ([f2d360b](https://github.com/odata2ts/odata2ts/commit/f2d360bac59901bd056dab5755dcf66d66988af5))
* on windows ts-node needs cwd-mode flag ([4f3c0f5](https://github.com/odata2ts/odata2ts/commit/4f3c0f5da9257504f842ca7a51af31e0ef578018))


### Features

* integration tests for V2 (ODataV2 sample service) ([98bf0b8](https://github.com/odata2ts/odata2ts/commit/98bf0b8fc950337c970b408036d103c2c5934402))
* **odata2model:** FixtureComparator ignores [@ts-ignore](https://github.com/ts-ignore) ([b483ed5](https://github.com/odata2ts/odata2ts/commit/b483ed569394b3fb69c9b8d3904e377d2dc7a341))
* **odata2model:** move v4 tests & adapt expectations of fixtures ([2f84127](https://github.com/odata2ts/odata2ts/commit/2f841278397564ed1e815a8087068921628ec15e))
* **odata2model:** V2 service generation support ([2b17a01](https://github.com/odata2ts/odata2ts/commit/2b17a013d65fc12aac8315bc34bce441eb505870))
* **odata2model:Cli:** load config from file via cosmiconfig ([a490778](https://github.com/odata2ts/odata2ts/commit/a4907785b90a513f6a4c910e861d63e14139908b))
* **odata2model:Cli:** log file paths relative to working dir of process ([fc1ce86](https://github.com/odata2ts/odata2ts/commit/fc1ce86420858f72d87901435adccaba93280d8c))
* **test:** add run-cli integration test ([45a2da1](https://github.com/odata2ts/odata2ts/commit/45a2da1ede37c2734003b40eadafffbc8a82c14a))
* **test:** app test ([ad9d3f2](https://github.com/odata2ts/odata2ts/commit/ad9d3f2536828363ef153f54e31f3882089ee3a1))
* **test:** Builder for generating Edmx schemas in JSON ([227279a](https://github.com/odata2ts/odata2ts/commit/227279a5faed92a8befa86e5c893e8c6d48df5d6))
* **test:** FixtureComparator ([38b03bf](https://github.com/odata2ts/odata2ts/commit/38b03bf67019d45807c90f281bd935aa914f95e5))
* **test:** ProjectManager test without testing formatting including some refactorings ([8f666f3](https://github.com/odata2ts/odata2ts/commit/8f666f35b10fb2b2a29c62ec01778fb73e1ab789))
* **test:** same tests for model & qobject generation ([a4d882d](https://github.com/odata2ts/odata2ts/commit/a4d882da0bc6dd3c785d13d376b34245c82b0f4a))
* **test:** ServiceGenerator tests & fixes ([6a2c242](https://github.com/odata2ts/odata2ts/commit/6a2c24225d9f8b9197c8223e507cf75ba5b74307))
* **test:** test for ProjectManager (first draft) ([f705b0b](https://github.com/odata2ts/odata2ts/commit/f705b0bc29f4c848588a5c252ca22a5aebdefe0e))
* **test:** testing Model generation ([6d7c530](https://github.com/odata2ts/odata2ts/commit/6d7c53084758b23a3a4525bd9ee8bc5efb25e71e))
* **test:** Tests for DataModel and EDMX digestion ([5740292](https://github.com/odata2ts/odata2ts/commit/574029264fdf5af9dcd410108cd8aeb692fa623b))


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





## [0.8.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.8.1...@odata2ts/odata2model@0.8.2) (2021-10-12)

**Note:** Version bump only for package @odata2ts/odata2model





## [0.8.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.8.0...@odata2ts/odata2model@0.8.1) (2021-09-17)


### Bug Fixes

* **odata-service:** revert exposure of Unnominalized ([6ce4ea7](https://github.com/odata2ts/odata2ts/commit/6ce4ea779f3a83e67aa02d6d9213dcec2711df8a))





# [0.8.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.7.1...@odata2ts/odata2model@0.8.0) (2021-09-17)


### Bug Fixes

* fix test ([2144cca](https://github.com/odata2ts/odata2ts/commit/2144cca49cda81ecc929425ca4171d99446c1ee1))


### Code Refactoring

* **odata-service:** use odata names as param names ([73b130a](https://github.com/odata2ts/odata2ts/commit/73b130a06411e9e7bf030a3dd605d2bcaebf1d70))


### Features

* **odata2model:** unnominalize response values of actions / functions ([4f284fa](https://github.com/odata2ts/odata2ts/commit/4f284fab3782ca5deb47d0e1b8ab25f5a2fc2bb2))


### BREAKING CHANGES

* **odata-service:** param names of complex keys have changed





## [0.7.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.7.0...@odata2ts/odata2model@0.7.1) (2021-09-16)

**Note:** Version bump only for package @odata2ts/odata2model





# [0.7.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.6.0...@odata2ts/odata2model@0.7.0) (2021-08-31)


### Bug Fixes

* **odata2model:** correct typing for returned collection types ([3943f08](https://github.com/odata2ts/odata2ts/commit/3943f089a57e3f37e703f577096bf58d18dda0fa))
* **odata2model:** fix tests ([96556cd](https://github.com/odata2ts/odata2ts/commit/96556cd68aae86f2ac231925a49d7350a3670816))
* **service:** don't use nominal types for input; use string instead ([788dc5c](https://github.com/odata2ts/odata2ts/commit/788dc5c091e5d1e29e2cf9f44cf1485f65691a6b))


### Features

* map ID to id ([a0652fa](https://github.com/odata2ts/odata2ts/commit/a0652fa70617de2ce9de70d9b294532bce8c8b91))





# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.5.0...@odata2ts/odata2model@0.6.0) (2021-08-17)


### Features

* **odata2model:** add emitMode to allow js and/or d.ts generation ([88e69ca](https://github.com/odata2ts/odata2ts/commit/88e69caff9d9b48f3f607f7f26d3d7d8d4449514))





# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.4.0...@odata2ts/odata2model@0.5.0) (2021-08-16)


### Bug Fixes

* **odata2model:** add import for parameter types ([03f25f4](https://github.com/odata2ts/odata2ts/commit/03f25f406aa5f304eeef5f7a89cfda478eb05d2a))


### Features

* **odata2model:** add bound func/actions & add primitive collections ([c18daac](https://github.com/odata2ts/odata2ts/commit/c18daac8135f17e1554e65ff4c5f4a7a76b4886b))
* **odata2model:** check for missing type & throw error ([39cdd55](https://github.com/odata2ts/odata2ts/commit/39cdd55802afdcbc5846e4119a1696d236550009))





# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.3.0...@odata2ts/odata2model@0.4.0) (2021-08-16)


### Bug Fixes

* more service tests, fix prop names vs odata names ([489b690](https://github.com/odata2ts/odata2ts/commit/489b69078144d3ed6a478373f7a22d8d923567ec))
* **odata2model:** fix path for main entity sets ([c8fba2a](https://github.com/odata2ts/odata2ts/commit/c8fba2a5053a69621539e9cf71f792795b786f3e))
* **odata2model:** wrong imort for service from root ([1de6eef](https://github.com/odata2ts/odata2ts/commit/1de6eef34dbc151c04dee91b119e59d3af28f94f))


### Features

* **odata2model:** add CollectionService, rework main service file ([026e999](https://github.com/odata2ts/odata2ts/commit/026e999c266a2f2a60807519a79a30f8eba98b08))
* **odata2model:** add jest & add dev and peer deps ([4076d1f](https://github.com/odata2ts/odata2ts/commit/4076d1fa64d64075722c3d137cf90ea31b587908))
* **odata2model:** add keySpec to EntitySets & implement get() ([500e576](https://github.com/odata2ts/odata2ts/commit/500e576a95206bb23985f7a24de3e2e054f9c084))
* **odata2model:** dataModel with fileNames, qNames, models with baseProps & baseKeys & qObjects(collections only) ([42d1630](https://github.com/odata2ts/odata2ts/commit/42d163013f8b273e54f7bf3549e4d5db7ba11386))
* **odata2model:** generate ModelServices & EntitySetService ([347bbbb](https://github.com/odata2ts/odata2ts/commit/347bbbb350b97689cb8b17844c200dc9e021ea0b))
* **odata2model:** introduce ImportContainer to organize imports ([6fab097](https://github.com/odata2ts/odata2ts/commit/6fab097b0e3286f07dcbde66b4648f965ec7e999))
* **odata2model:** parse functions & actions & entityContainer stuff into DataModel ([7fb9bb8](https://github.com/odata2ts/odata2ts/commit/7fb9bb8884696484d333e48f8e653f0b06fb760a))
* **odata2model:** realize new QEntityCollectionPath prop ([5eaf31a](https://github.com/odata2ts/odata2ts/commit/5eaf31a109058d9d0084c5a021ffad3b0b848c7a))
* **odata2model:** service gen for unbound funcs with params ([d7516da](https://github.com/odata2ts/odata2ts/commit/d7516dad3dc60d12bb885d3d7e9b52bc36a92b8f))
* **odata2model:** service generation for unbound parameterless functions ([2441aad](https://github.com/odata2ts/odata2ts/commit/2441aadc18941b866d7c702d5133f1d0743f1e0d))
* **odata2model:** setup ServiceGenerator ([8fbfffc](https://github.com/odata2ts/odata2ts/commit/8fbfffcbde532f1bcfba4d23bab64b80d9964717))
* **odata2model:** use dataModel.fileNames for app ([9487893](https://github.com/odata2ts/odata2ts/commit/9487893b233603ac6b4c7f581bb01a884cae475b))
* **service:** add singletons ([5695389](https://github.com/odata2ts/odata2ts/commit/56953890ab157bc50ab4eae9d48aeb98ebdb1951))
* **service:** init navProps via accessor instead of getter methods ([bb93f30](https://github.com/odata2ts/odata2ts/commit/bb93f304c06ff5e3e3e2ec1ce0ff27f884108feb))





# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.2.1...@odata2ts/odata2model@0.3.0) (2021-08-10)


### Bug Fixes

* **odata2model:** give first schema priority ([8fed26f](https://github.com/odata2ts/odata2ts/commit/8fed26f570e2435548d959f069f28b7d5533351a))


### Code Refactoring

* QEntityModel without key spec ([913cd11](https://github.com/odata2ts/odata2ts/commit/913cd11df132969aca80054b2d1584bfe678a729))


### Features

* **odata2model:** add type knowledge for function, action, complex & singleton ([56f7e5f](https://github.com/odata2ts/odata2ts/commit/56f7e5fe7ec1c699bacd6ea12a6c54f43002aca5))
* **odata2model:** generate Enums & CollectionPaths & respect baseClasses for QObjects ([e9dfce5](https://github.com/odata2ts/odata2ts/commit/e9dfce5ba15d8d10e56c63c9c88674f6c6b5b2cb))
* **odata2model:** model gen with support for complex types, enum types ([f2d5b3b](https://github.com/odata2ts/odata2ts/commit/f2d5b3b020bb1fbe2d81753432bd54738a3f1e67))
* **odata2model:** support BaseType for entity & complex types ([20c5ab2](https://github.com/odata2ts/odata2ts/commit/20c5ab2890fd8482c8897033b628a32ad88d4f2f))
* **odata2model:** support complex types & primitive collections ([6481920](https://github.com/odata2ts/odata2ts/commit/64819204f711d7e84ba1d2f153d826721780750c))
* add sample requests covering trippin features ([2cc900f](https://github.com/odata2ts/odata2ts/commit/2cc900fa4344c98ee8a521f50b158e8e7cb96dcc))


### BREAKING CHANGES

* **odata2model:** qObjects are generated differently
* [query-objects]: QEntityModel without key spec & __collectionPath; [UrlBuilder]: path must be provided explicitly now for any entity set





## [0.2.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.2.0...@odata2ts/odata2model@0.2.1) (2021-07-23)


### Bug Fixes

* **odata2model:** respect suffix & prefix in relationships ([cc59d9f](https://github.com/odata2ts/odata2ts/commit/cc59d9f6b8e12a7a729dd297921f2f2c7be9fe50))





# [0.2.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.1.4...@odata2ts/odata2model@0.2.0) (2021-07-23)


### Features

* **odata2model:** add options for suffix & prefix ([d5d9a81](https://github.com/odata2ts/odata2ts/commit/d5d9a8186304954c4700a05b2cab47fccf86d63c))





## [0.1.4](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.1.3...@odata2ts/odata2model@0.1.4) (2021-07-08)

**Note:** Version bump only for package @odata2ts/odata2model





## [0.1.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.1.2...@odata2ts/odata2model@0.1.3) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata2model





## [0.1.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.1.1...@odata2ts/odata2model@0.1.2) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata2model





## [0.1.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.1.0...@odata2ts/odata2model@0.1.1) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata2model
