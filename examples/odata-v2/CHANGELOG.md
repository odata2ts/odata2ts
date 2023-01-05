# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
