# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.10.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.10.1...@odata2ts/odata-query-objects@0.10.2) (2022-06-30)


### Bug Fixes

* add prebulish script to guarantee building before publishing ([b6986db](https://github.com/odata2ts/odata2ts/commit/b6986dbdb258b7b3cb8f36ab52ae1ff7b093f7dc))





## [0.10.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.10.0...@odata2ts/odata-query-objects@0.10.1) (2022-06-30)


### Bug Fixes

* private prop prefix might conflict with generated prop of extending class ([#31](https://github.com/odata2ts/odata2ts/issues/31)) ([73b3d1f](https://github.com/odata2ts/odata2ts/commit/73b3d1fc1d7e00681a0bae0427d0d62ce19b0a4c))






# [0.10.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.9.0...@odata2ts/odata-query-objects@0.10.0) (2022-05-21)


### Features

* **qObjects:** better typing for QEntityPath & QEntityCollectionPath ([d42a002](https://github.com/odata2ts/odata2ts/commit/d42a002d4f7a4bcb7941689604a2e43584f83b7f))
* **qObjects:** QPath objects for v2 types ([#23](https://github.com/odata2ts/odata2ts/issues/23)) ([bad6b29](https://github.com/odata2ts/odata2ts/commit/bad6b29d30e6b5f10d296dd673317b3fb43b1c95))


* Feat/refactor query objects (#20) ([67b662a](https://github.com/odata2ts/odata2ts/commit/67b662a6da3344eb215b4f1276bf26464d2126f5)), closes [#20](https://github.com/odata2ts/odata2ts/issues/20)


### Bug Fixes

* **test:** collect code coverage from src folders, thus exhibiting untested code ([3acef8b](https://github.com/odata2ts/odata2ts/commit/3acef8b83b2625579bbce4a967724e884c39c358))
* **test:** make coverage test run again ([f2d360b](https://github.com/odata2ts/odata2ts/commit/f2d360bac59901bd056dab5755dcf66d66988af5))


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





# [0.9.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.8.1...@odata2ts/odata-query-objects@0.9.0) (2021-10-12)


### Features

* **qObjects:** entityPath with props attribute ([#11](https://github.com/odata2ts/odata2ts/issues/11)) ([5d2f5d1](https://github.com/odata2ts/odata2ts/commit/5d2f5d12b968cafd53fa07ec5e9fe4d5bd086ad0))





## [0.8.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.8.0...@odata2ts/odata-query-objects@0.8.1) (2021-09-17)


### Bug Fixes

* **qObjects:** Unnominalized must respect optional attributes ([c882690](https://github.com/odata2ts/odata2ts/commit/c8826902a778612470363433e52c120e214303fa))





# [0.8.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.7.0...@odata2ts/odata-query-objects@0.8.0) (2021-09-16)


### Features

* **qObjects:** make Unnominalized recursive ([9afa139](https://github.com/odata2ts/odata2ts/commit/9afa13977e05a836a5dc5a9ddf53b3fdeb69ef63))
* **qObjects:** support lambda functions (any & all) ([3d45804](https://github.com/odata2ts/odata2ts/commit/3d458049b228f444a47491a1f002d5849c6d9577))
* **type-fest:** add type-fest as dependency ([dfb4cd6](https://github.com/odata2ts/odata2ts/commit/dfb4cd69a94cd824eb107d12cc08fb0052d4ca06))





# [0.7.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.6.0...@odata2ts/odata-query-objects@0.7.0) (2021-08-31)


### Features

* **qObjects:** add ts converter to translate nominal types into strings ([c57487b](https://github.com/odata2ts/odata2ts/commit/c57487b6d774c787cc2ae26f88a9ed14327a9cef))
* **uri-builder:** order by implementation for uri-builder ([3502b75](https://github.com/odata2ts/odata2ts/commit/3502b755f744ba2b58ee43331d85dc5ef6235304))
* map ID to id ([a0652fa](https://github.com/odata2ts/odata2ts/commit/a0652fa70617de2ce9de70d9b294532bce8c8b91))





# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.5.0...@odata2ts/odata-query-objects@0.6.0) (2021-08-16)


### Features

* **odata-query-objects:** uncapitalize qObject props ([86e7cff](https://github.com/odata2ts/odata2ts/commit/86e7cffb8d83a876006606df1921b8e186564329))
* **qObjects:** divide in QCollectionPath & QEntityCollectionPath ([cab60b4](https://github.com/odata2ts/odata2ts/commit/cab60b4fbac3b09a8d4ef0eb4aec8e8885c2974a))
* **qObjects:** make collections work ([23bf808](https://github.com/odata2ts/odata2ts/commit/23bf808fcdda2065395c2d38c4f72d7a436da942))





# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.4.0...@odata2ts/odata-query-objects@0.5.0) (2021-08-10)


### Code Refactoring

* QEntityModel without key spec ([913cd11](https://github.com/odata2ts/odata2ts/commit/913cd11df132969aca80054b2d1584bfe678a729))


### Features

* **qObjects:** add QPrimitiveCollectionPath ([0a93c74](https://github.com/odata2ts/odata2ts/commit/0a93c741ea049f3f5a075869ab58daba911e7dd0))
* **qObjects:** integrate QEnumPath & refactor to QCollectionPath ([cb95d06](https://github.com/odata2ts/odata2ts/commit/cb95d067899d5cb28b72dea22ef7f2d458f64830))
* **qObjects:** QCollectionPath & EntityPath with default enumTypes ([9743020](https://github.com/odata2ts/odata2ts/commit/9743020712df43f111d8961c41bf3c4acf6512ed))


### BREAKING CHANGES

* [query-objects]: QEntityModel without key spec & __collectionPath; [UrlBuilder]: path must be provided explicitly now for any entity set





# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.3.3...@odata2ts/odata-query-objects@0.4.0) (2021-07-08)


### Bug Fixes

* **qObjects:** or-expressions require parentheses ([1b171a3](https://github.com/odata2ts/odata2ts/commit/1b171a350966953a9f5cd10bf22354c620c39b53))
* **qObjects:** QGuidPath must return expressions ([b9cc9ac](https://github.com/odata2ts/odata2ts/commit/b9cc9acdff0be164779ef5d105cf45f057a996e8))


### Features

* **qObjects:** add in operator ([e525cea](https://github.com/odata2ts/odata2ts/commit/e525cea5e131572ef44fa712dad362e59af958f8))
* **qObjects:** add OrderByExpressions ([a7f1237](https://github.com/odata2ts/odata2ts/commit/a7f123790eb1a8261f9b64637ed115d0cfb19e80))





## [0.3.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.3.2...@odata2ts/odata-query-objects@0.3.3) (2021-07-01)


### Bug Fixes

* add declaration for all packages ([1d8b380](https://github.com/odata2ts/odata2ts/commit/1d8b380cc2db2568189121980c3bab2bdb5545f9))





## [0.3.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.3.1...@odata2ts/odata-query-objects@0.3.2) (2021-07-01)


### Bug Fixes

* **qObjects:** nominal types must come before string type ([6b91ca4](https://github.com/odata2ts/odata2ts/commit/6b91ca4a3dfe2fceb2e2410face14a318c3d26ed))





## [0.3.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-query-objects@0.3.0...@odata2ts/odata-query-objects@0.3.1) (2021-07-01)

**Note:** Version bump only for package @odata2ts/odata-query-objects
