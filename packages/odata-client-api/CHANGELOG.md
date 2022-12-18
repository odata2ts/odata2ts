# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-client-api@0.4.0...@odata2ts/odata-client-api@0.6.0) (2022-12-18)


### Features

* **odata-client-api:** dynamic response data model for put and patch ([b6d9a7d](https://github.com/odata2ts/odata2ts/commit/b6d9a7de45b39106693515c6e2b5490112547ae4))


### BREAKING CHANGES

* **odata-client-api:** put and patch allow for response values now => OData v4 specifies that either void or the model representation might be returned (void is more usual though)





# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-client-api@0.4.0...@odata2ts/odata-client-api@0.5.0) (2022-12-18)


### Features

* **odata-client-api:** dynamic response data model for put and patch ([b6d9a7d](https://github.com/odata2ts/odata2ts/commit/b6d9a7de45b39106693515c6e2b5490112547ae4))


### BREAKING CHANGES

* **odata-client-api:** put and patch allow for response values now => OData v4 specifies that either void or the model representation might be returned (void is more usual though)






# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-client-api@0.3.1...@odata2ts/odata-client-api@0.4.0) (2022-09-08)


### Features

* **odata-service:** allow to pass custom headers per request ([#58](https://github.com/odata2ts/odata2ts/issues/58)) ([d783e51](https://github.com/odata2ts/odata2ts/commit/d783e51e4b5a69892c79a03bedc6bf041abba9ec))





## [0.3.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-client-api@0.3.0...@odata2ts/odata-client-api@0.3.1) (2022-06-30)


### Bug Fixes

* add prebulish script to guarantee building before publishing ([b6986db](https://github.com/odata2ts/odata2ts/commit/b6986dbdb258b7b3cb8f36ab52ae1ff7b093f7dc))






# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata-client-api@0.2.0...@odata2ts/odata-client-api@0.3.0) (2022-05-21)


### Bug Fixes

* **test:** collect code coverage from src folders, thus exhibiting untested code ([3acef8b](https://github.com/odata2ts/odata2ts/commit/3acef8b83b2625579bbce4a967724e884c39c358))
* **test:** make coverage test run again ([f2d360b](https://github.com/odata2ts/odata2ts/commit/f2d360bac59901bd056dab5755dcf66d66988af5))


### Code Refactoring

* **clientApi:** Refactor response model & remove individual response types, e.g. collection or raw data ([36c644b](https://github.com/odata2ts/odata2ts/commit/36c644b865533ff4e0788726ac55b27947b1f943))


### BREAKING CHANGES

* **clientApi:** refactored interfaces





# 0.2.0 (2021-08-16)


### Features

* **client-api:** add module for odata-client-api ([42b801a](https://github.com/odata2ts/odata2ts/commit/42b801a89fa8d40827661939c329cbc8e1dfd0c1))
* **client-api:** fix post request ([d1c1de3](https://github.com/odata2ts/odata2ts/commit/d1c1de35036cf82505d5f51f014c9e392364e782))
