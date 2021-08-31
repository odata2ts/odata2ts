# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
