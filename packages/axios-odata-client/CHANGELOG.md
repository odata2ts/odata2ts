# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.6.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.5.3...@odata2ts/axios-odata-client@0.6.0) (2023-04-20)

### Features

* better errors for jquery and axios odata clients ([#139](https://github.com/odata2ts/odata2ts/issues/139)) ([bb74514](https://github.com/odata2ts/odata2ts/commit/bb745144fb37235ad9864ab78eebbecf1d69107c))

## [0.5.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.5.2...@odata2ts/axios-odata-client@0.5.3) (2023-04-08)

**Note:** Version bump only for package @odata2ts/axios-odata-client

## [0.5.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.5.1...@odata2ts/axios-odata-client@0.5.2) (2023-02-03)

**Note:** Version bump only for package @odata2ts/axios-odata-client

## [0.5.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.5.0...@odata2ts/axios-odata-client@0.5.1) (2023-01-07)

**Note:** Version bump only for package @odata2ts/axios-odata-client

# [0.5.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.4.0...@odata2ts/axios-odata-client@0.5.0) (2023-01-05)

### Features

* **axios-odata-client:** default error message retriever ([#82](https://github.com/odata2ts/odata2ts/issues/82)) ([11b7b61](https://github.com/odata2ts/odata2ts/commit/11b7b6171291ba78c2e2b4c7ab39a6c425d02cf1))
* **axios-odata-client:** MERGE implementation for V2 ([#83](https://github.com/odata2ts/odata2ts/issues/83)) ([097005f](https://github.com/odata2ts/odata2ts/commit/097005fda1f4008c1fe3ea71f177697867e761fe))

### BREAKING CHANGES

* **axios-odata-client:** errorMessageRetriever is not part of the constructor signature anymore; use the setter if you want to apply a custom error message retriever

# [0.4.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.2.3...@odata2ts/axios-odata-client@0.4.0) (2022-12-18)

### Features

* **odata-client-api:** dynamic response data model for put and patch ([b6d9a7d](https://github.com/odata2ts/odata2ts/commit/b6d9a7de45b39106693515c6e2b5490112547ae4))

### BREAKING CHANGES

* **odata-client-api:** put and patch allow for response values now => OData v4 specifies that either void or the model representation might be returned (void is more usual though)

# [0.3.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.2.3...@odata2ts/axios-odata-client@0.3.0) (2022-12-18)

### Features

* **odata-client-api:** dynamic response data model for put and patch ([b6d9a7d](https://github.com/odata2ts/odata2ts/commit/b6d9a7de45b39106693515c6e2b5490112547ae4))

### BREAKING CHANGES

* **odata-client-api:** put and patch allow for response values now => OData v4 specifies that either void or the model representation might be returned (void is more usual though)

## [0.2.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.2.2...@odata2ts/axios-odata-client@0.2.3) (2022-09-08)

**Note:** Version bump only for package @odata2ts/axios-odata-client

## [0.2.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.2.1...@odata2ts/axios-odata-client@0.2.2) (2022-08-25)

### Bug Fixes

* **axios-odata-client:** export everything from AxiosODataClient ([#55](https://github.com/odata2ts/odata2ts/issues/55)) ([b43e8f8](https://github.com/odata2ts/odata2ts/commit/b43e8f88b54605edd75ced95fd09b84267c52716))

## [0.2.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.2.0...@odata2ts/axios-odata-client@0.2.1) (2022-07-11)

**Note:** Version bump only for package @odata2ts/axios-odata-client

# [0.2.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.1.1...@odata2ts/axios-odata-client@0.2.0) (2022-07-06)

### Features

* add option to enable automatic csrf token handling ([#32](https://github.com/odata2ts/odata2ts/issues/32)) ([cf4b8c6](https://github.com/odata2ts/odata2ts/commit/cf4b8c60f02ef1fdf7af267e61791e4b7d94fb3e))

## [0.1.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/axios-odata-client@0.1.0...@odata2ts/axios-odata-client@0.1.1) (2022-06-30)

### Bug Fixes

* add prebulish script to guarantee building before publishing ([b6986db](https://github.com/odata2ts/odata2ts/commit/b6986dbdb258b7b3cb8f36ab52ae1ff7b093f7dc))

# 0.1.0 (2022-06-02)

### Features

* **axios-odata-client:** introduce new module ([ea5684f](https://github.com/odata2ts/odata2ts/commit/ea5684f1f07a7b753e7ef587f41fbc450578497a))
