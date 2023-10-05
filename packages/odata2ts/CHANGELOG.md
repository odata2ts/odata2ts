# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.30.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.29.1...@odata2ts/odata2ts@0.30.0) (2023-10-05)

### Features

* one file for all services ([#223](https://github.com/odata2ts/odata2ts/issues/223)) ([f48bf5a](https://github.com/odata2ts/odata2ts/commit/f48bf5ab36aa09ddc7760cc078d952c79b7a2185))

## [0.29.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.29.0...@odata2ts/odata2ts@0.29.1) (2023-09-13)

**Note:** Version bump only for package @odata2ts/odata2ts

# [0.29.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.28.0...@odata2ts/odata2ts@0.29.0) (2023-08-08)

### Bug Fixes

* **odata2ts:** downgrade prettier plugin xml to 2.2.0 ([36525f9](https://github.com/odata2ts/odata2ts/commit/36525f90e03199a0a4cce197df4662e8288493a6))

### Features

* service generation for primitive types ([#201](https://github.com/odata2ts/odata2ts/issues/201)) ([ea9e645](https://github.com/odata2ts/odata2ts/commit/ea9e6452f6b4033c489fbceaf6b75591b550a3f1))

### BREAKING CHANGES

* removed the public method "getQObject"

* refactor(odata2ts): use __base properties of inherited services

* feat(service): introduce PrimitiveTypeService

* feat(odata2ts): allow to generate PrimitiveTypeServices via option enablePrimitivePropertyServices

* feat(example): integration tests for primitive type services

# [0.28.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.27.0...@odata2ts/odata2ts@0.28.0) (2023-07-31)

### Features

* **odat2ts:** v4 big number generation ([#195](https://github.com/odata2ts/odata2ts/issues/195)) ([3e5fdcd](https://github.com/odata2ts/odata2ts/commit/3e5fdcda42f893ed7d069489faa2ad10da8d7837))

* **odata2ts:** ESM support for the generator ([#198](https://github.com/odata2ts/odata2ts/issues/198)) ([6956b9c](https://github.com/odata2ts/odata2ts/commit/6956b9c8321707f04b7109653de50de0b739df3e))

# [0.27.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.26.1...@odata2ts/odata2ts@0.27.0) (2023-07-20)

### Features

* **odata2ts:** metadata download ([#191](https://github.com/odata2ts/odata2ts/issues/191)) ([718058d](https://github.com/odata2ts/odata2ts/commit/718058d4fa93884212ca7e3fe12ac5385a36fecb))

## [0.26.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.26.0...@odata2ts/odata2ts@0.26.1) (2023-07-13)

### Bug Fixes

* **odata2ts:** correct fieldName for nav props ([#189](https://github.com/odata2ts/odata2ts/issues/189)) ([ec198d4](https://github.com/odata2ts/odata2ts/commit/ec198d48f6770d2c203be2f4e640370170d87f6e))

# [0.26.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.25.1...@odata2ts/odata2ts@0.26.0) (2023-07-13)

### Bug Fixes

* **odata2ts:** bound operations with namespace as part of the name ([#187](https://github.com/odata2ts/odata2ts/issues/187)) ([68209f2](https://github.com/odata2ts/odata2ts/commit/68209f2bb5bc16fdaa36e5a3ddef21d72ce8f273))

### Features

* **odata2ts:** allow property configuration via entity ([#188](https://github.com/odata2ts/odata2ts/issues/188)) ([bdb5bef](https://github.com/odata2ts/odata2ts/commit/bdb5bef6d70827e4cc06d8a8b73c6a31edb92a2e))

## [0.25.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.25.0...@odata2ts/odata2ts@0.25.1) (2023-07-10)

### Bug Fixes

* **odata2ts:** duplicate output paths ([#184](https://github.com/odata2ts/odata2ts/issues/184)) ([b55366d](https://github.com/odata2ts/odata2ts/commit/b55366dab8d331ace3c766b4279b5b0cc575aa03))

# [0.25.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.24.0...@odata2ts/odata2ts@0.25.0) (2023-07-10)

### Bug Fixes

* **odata2ts:** use qualified name for bound operations ([#182](https://github.com/odata2ts/odata2ts/issues/182)) ([120c9b8](https://github.com/odata2ts/odata2ts/commit/120c9b807ac209a8eb82b389bc7c21d7df7fe876))

### Features

* **odata2ts:** support for multiple namespaces by merging ([#175](https://github.com/odata2ts/odata2ts/issues/175)) ([db8fd61](https://github.com/odata2ts/odata2ts/commit/db8fd6165c57ceb9e04488789a62f2a5467ecc68))

* **odata2ts:** support schema alias ([#181](https://github.com/odata2ts/odata2ts/issues/181)) ([e0c04a8](https://github.com/odata2ts/odata2ts/commit/e0c04a83e32d99187652966bb9cc32f36ead3df2))

* **odata2ts:** support TypeDefinition elements ([#183](https://github.com/odata2ts/odata2ts/issues/183)) ([d77d2cb](https://github.com/odata2ts/odata2ts/commit/d77d2cbf17383dab50d35bb7374e08a83d264db2))

# [0.24.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.23.1...@odata2ts/odata2ts@0.24.0) (2023-06-14)

### Features

* **odata2ts:** generate comments for model properties ([#173](https://github.com/odata2ts/odata2ts/issues/173)) ([b218297](https://github.com/odata2ts/odata2ts/commit/b2182974637499060d7d0c8d358da17ca03608e0))

## [0.23.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.23.0...@odata2ts/odata2ts@0.23.1) (2023-06-10)

**Note:** Version bump only for package @odata2ts/odata2ts

# [0.23.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.22.0...@odata2ts/odata2ts@0.23.0) (2023-06-03)

### Features

* force new minor for new http-client-api ([5628666](https://github.com/odata2ts/odata2ts/commit/56286668abf6fe5f3c0639f07a4a9f99cc549068))

# [0.22.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.21.0...@odata2ts/odata2ts@0.22.0) (2023-04-27)

### Code Refactoring

* **odata2ts:** dispense with resolver & directly implement related services as getter ([9b49501](https://github.com/odata2ts/odata2ts/commit/9b49501e279b6c5869cbc5ac2fd246577780b81f))

### BREAKING CHANGES

* **odata2ts:** Changed defaults for properties representing related services: no prefix anymore, just the name of the property as function (previously, prefix `navTo`).

Removed `get` method of EntitySetServices: use property directly instead.

Removed the following naming options regarding generated services: `serviceResolverFunction`, `publicProps`

# [0.21.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.20.3...@odata2ts/odata2ts@0.21.0) (2023-04-20)

### Features

* option for extra-results-wrapping for V2 services and model generation only ([#155](https://github.com/odata2ts/odata2ts/issues/155)) ([795a04c](https://github.com/odata2ts/odata2ts/commit/795a04c42b9e2485975b85b70bc72772bd4bf25a))

## [0.20.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.20.2...@odata2ts/odata2ts@0.20.3) (2023-04-18)

### Bug Fixes

* **odata2ts:** add empty array as type for empty params ([#154](https://github.com/odata2ts/odata2ts/issues/154)) ([fbdd000](https://github.com/odata2ts/odata2ts/commit/fbdd0005d46d7d402d8039bec3ea4aecdb593b88))

* prevent idModel and qIdFunction from baseclass to be overwritten in digester which breaks multiple inheritance ([#150](https://github.com/odata2ts/odata2ts/issues/150)) ([e17038e](https://github.com/odata2ts/odata2ts/commit/e17038ee0e924101f9dd6ed97e10da5847cb8857))

* Reorder models and qobjects by inheritance (base types first) ([#151](https://github.com/odata2ts/odata2ts/issues/151)) ([7d456fe](https://github.com/odata2ts/odata2ts/commit/7d456fe3fd28b246721a170cd878d04c3dbc2d80))

## [0.20.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.20.1...@odata2ts/odata2ts@0.20.2) (2023-04-13)

**Note:** Version bump only for package @odata2ts/odata2ts

## [0.20.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.20.0...@odata2ts/odata2ts@0.20.1) (2023-04-08)

**Note:** Version bump only for package @odata2ts/odata2ts

# [0.20.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.19.2...@odata2ts/odata2ts@0.20.0) (2023-04-04)

### Features

* **odata2ts:** Entity configuration options ([#145](https://github.com/odata2ts/odata2ts/issues/145)) ([03264c5](https://github.com/odata2ts/odata2ts/commit/03264c5f31a758f9b8d854630cf2c90632e9d8d8))

## [0.19.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.19.1...@odata2ts/odata2ts@0.19.2) (2023-03-23)

### Bug Fixes

* **odata2ts:** entity resolver uses wrong Q-Id function when id is inherited ([e05f4eb](https://github.com/odata2ts/odata2ts/commit/e05f4ebd8afd472cdad0194f899159d2a60c3d92))

* **odata2ts:** semantically wrong unit test ([541a687](https://github.com/odata2ts/odata2ts/commit/541a6874517ef6444fe6f428b64dc894158b066b))

## [0.19.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.19.0...@odata2ts/odata2ts@0.19.1) (2023-02-24)

### Bug Fixes

* **odata2ts:** ts-node as proper dep instead of peer-dep ([2050524](https://github.com/odata2ts/odata2ts/commit/2050524e8102549f2fca3911d55834892f0caf94))

# [0.19.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.6...@odata2ts/odata2ts@0.19.0) (2023-02-14)

### Features

* improved handling of multiple schemas ([#133](https://github.com/odata2ts/odata2ts/issues/133)) ([9c7733f](https://github.com/odata2ts/odata2ts/commit/9c7733f5f95e8f65df52ed13889d352cc9c7f4fb))

## [0.18.6](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.3...@odata2ts/odata2ts@0.18.6) (2023-02-13)

### Bug Fixes

* build ([2a54611](https://github.com/odata2ts/odata2ts/commit/2a54611ff0dbad14621743361307c261785ca62a))

## [0.18.5](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.3...@odata2ts/odata2ts@0.18.5) (2023-02-13)

### Bug Fixes

* build ([2a54611](https://github.com/odata2ts/odata2ts/commit/2a54611ff0dbad14621743361307c261785ca62a))

## [0.18.4](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.3...@odata2ts/odata2ts@0.18.4) (2023-02-13)

**Note:** Version bump only for package @odata2ts/odata2ts

## [0.18.3](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.2...@odata2ts/odata2ts@0.18.3) (2023-02-03)

### Bug Fixes

* **odata2ts:** peer dep versions did not get auto upated ([#120](https://github.com/odata2ts/odata2ts/issues/120)) ([586627e](https://github.com/odata2ts/odata2ts/commit/586627e354c03ed36135d0b7f21a05b97a11072f))

## [0.18.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.1...@odata2ts/odata2ts@0.18.2) (2023-01-11)

### Bug Fixes

* **odata2ts:** wrong generation of complex and enum params for q operations ([#111](https://github.com/odata2ts/odata2ts/issues/111)) ([f69aadf](https://github.com/odata2ts/odata2ts/commit/f69aadf52201fbf854d00103f763f465c7557de4))

## [0.18.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2ts@0.18.0...@odata2ts/odata2ts@0.18.1) (2023-01-10)

### Bug Fixes

* **odata2ts:** no model param and no q operation generation for collection bound operations ([#110](https://github.com/odata2ts/odata2ts/issues/110)) ([71769c2](https://github.com/odata2ts/odata2ts/commit/71769c22affa37c3a443e91f5070fa07f90d03d6))

# 0.18.0 (2023-01-07)

### Bug Fixes

* **odata2ts:** configurable naming of main service ([c2bdeeb](https://github.com/odata2ts/odata2ts/commit/c2bdeeb9e35f8a4ed31e35c41e4f01ddef9bd9a6))

### Code Refactoring

* odata2model => odata2ts ([#97](https://github.com/odata2ts/odata2ts/issues/97)) ([4085c7c](https://github.com/odata2ts/odata2ts/commit/4085c7ccf173c6712c5238f8b43e86842eecb19a))

* rename odata-uri-builder to odata-query-builder ([#98](https://github.com/odata2ts/odata2ts/issues/98)) ([e0de825](https://github.com/odata2ts/odata2ts/commit/e0de825663fab15c37854ae08f75ab8df761cd3e))

### Features

* **odata-service:** introduce entity service resolver ([#100](https://github.com/odata2ts/odata2ts/issues/100)) ([66dd853](https://github.com/odata2ts/odata2ts/commit/66dd853bbc28a0758fae04abd5e8885689aeabc2))

* **odata2ts:** add snakeCase as new renaming strategy ([#101](https://github.com/odata2ts/odata2ts/issues/101)) ([09f9bfb](https://github.com/odata2ts/odata2ts/commit/09f9bfbde7f1e75c9a29ff774f7d771cfab7106b))

* **odata2ts:** minimal naming options ([#104](https://github.com/odata2ts/odata2ts/issues/104)) ([67ddfa7](https://github.com/odata2ts/odata2ts/commit/67ddfa74f977e164892c2953dc8c5459a92c11d4))

* **odata2ts:** use navToX instead of getXSrv ([#99](https://github.com/odata2ts/odata2ts/issues/99)) ([4aafcb0](https://github.com/odata2ts/odata2ts/commit/4aafcb0cd307748feed4df075459e17e83876f3b))

### BREAKING CHANGES

* **odata2ts:** option `service.fileNames` was removed in favour of `service.main`, so that the main service can be configured individually; the underlying bug was that file names SHOULD NOT be configurable for services

* **odata2ts:** changed default: uses "navToX" instead of "getXSrv" to navigate to other services; old behaviour can be restored via naming configuration prefix: "get", suffix: "Srv"

* rename module odata-uri-builder to odata-query-builder; API completely refactored by renaming all models, classes, functions, props from "uri" to "query"

* rename odata2model to odata2ts; affects import in `odata2ts.config`, affects scripts in `package.json` or any scripts which use to call `odata2model` command directly

# [0.17.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.16.1...@odata2ts/odata2model@0.17.0) (2023-01-05)

### Bug Fixes

* **odata2ts:** broken js generation ([#95](https://github.com/odata2ts/odata2ts/issues/95)) ([6df7392](https://github.com/odata2ts/odata2ts/commit/6df7392b6bf72fc1621585d299ed3adebee53021))

* **odata2ts:** operation return type for primitive values is wrong ([#91](https://github.com/odata2ts/odata2ts/issues/91)) ([fcbc28a](https://github.com/odata2ts/odata2ts/commit/fcbc28a8c388d256cb14ddf2a5935431e3a50478))

### Code Refactoring

* **odata2ts:** changing default regarding renaming ([#94](https://github.com/odata2ts/odata2ts/issues/94)) ([67124a2](https://github.com/odata2ts/odata2ts/commit/67124a206d28442e86ab4db50b4aa3eb17056727))

### Features

* dedicated number params for V2 ([#84](https://github.com/odata2ts/odata2ts/issues/84)) ([7a440d9](https://github.com/odata2ts/odata2ts/commit/7a440d92c40b39aedd4479ceed4afa18cc3a0ce9))

* encode & decode function params properly ([#96](https://github.com/odata2ts/odata2ts/issues/96)) ([ca88f57](https://github.com/odata2ts/odata2ts/commit/ca88f572674181962760005cf33f820e231a2b51))

* improved number handling ([#86](https://github.com/odata2ts/odata2ts/issues/86)) ([08e9fe0](https://github.com/odata2ts/odata2ts/commit/08e9fe0feaf5af6fcfe0ab8af7ff27d1d52eb097))

* **odata2ts:** automatically handle managed props ([#88](https://github.com/odata2ts/odata2ts/issues/88)) ([37eef19](https://github.com/odata2ts/odata2ts/commit/37eef1918f25a4943ae19475dc987463639ab9f4))

### BREAKING CHANGES

* **odata2ts:** new default: allowRenaming=false; removed prop `naming.disableNamingStrategy`

## [0.16.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.16.0...@odata2ts/odata2model@0.16.1) (2022-12-21)

### Bug Fixes

* **odata2ts:** import deferred content from core (V2 only) ([66bee43](https://github.com/odata2ts/odata2ts/commit/66bee43bfe16bc930614bd82df48c46348e25b2b))

* only import QEntityPath when needed ([81a4e77](https://github.com/odata2ts/odata2ts/commit/81a4e77b78d0fb02505b7989e7ae6737dc279e80))

# [0.16.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.14.2...@odata2ts/odata2model@0.16.0) (2022-12-18)

### Bug Fixes

* **odata2model:** don't generate useless constructors ([f495604](https://github.com/odata2ts/odata2ts/commit/f4956044df9cc081e90208fb3a961fa6572911db))

* **odata2ts:** disable entities by name from config interfaces => not implemented yet ([96fefbe](https://github.com/odata2ts/odata2ts/commit/96fefbe22dc10cf7549a61551eadc93b870dcc0d))

* **odata2ts:** disable own section about entitiesByName ([78d9c6e](https://github.com/odata2ts/odata2ts/commit/78d9c6e7e9eccd31f47a7f7b34af9e77dfeeb000))

### Features

* **odata2model:** extensive configuration model via config file ([#67](https://github.com/odata2ts/odata2ts/issues/67)) ([a42aee4](https://github.com/odata2ts/odata2ts/commit/a42aee494a4e30d8704569d7262fc31020ed7711))

* **odata2ts:** adapt method generation for services ([486a85c](https://github.com/odata2ts/odata2ts/commit/486a85cffc2ee06e6461ecd1f3dd00a8208b95f7))

* **odata2ts:** adapt query object generation to OperationReturnTypes ([734e2bd](https://github.com/odata2ts/odata2ts/commit/734e2bd51a67cc285153c97f96655b950c62a230))

* **odata2ts:** apply name mapping in all places ([dd5a6fd](https://github.com/odata2ts/odata2ts/commit/dd5a6fdde83cdc3f803eb1d96553571e78364849))

* **odata2ts:** property configuration with name mapping and managed flag ([#78](https://github.com/odata2ts/odata2ts/issues/78)) ([797566c](https://github.com/odata2ts/odata2ts/commit/797566cf962e8c9b1f3a1a8081e066c9f0829b91))

# [0.15.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.14.2...@odata2ts/odata2model@0.15.0) (2022-12-18)

### Bug Fixes

* **odata2model:** don't generate useless constructors ([f495604](https://github.com/odata2ts/odata2ts/commit/f4956044df9cc081e90208fb3a961fa6572911db))

* **odata2ts:** disable entities by name from config interfaces => not implemented yet ([96fefbe](https://github.com/odata2ts/odata2ts/commit/96fefbe22dc10cf7549a61551eadc93b870dcc0d))

* **odata2ts:** disable own section about entitiesByName ([78d9c6e](https://github.com/odata2ts/odata2ts/commit/78d9c6e7e9eccd31f47a7f7b34af9e77dfeeb000))

### Features

* **odata2model:** extensive configuration model via config file ([#67](https://github.com/odata2ts/odata2ts/issues/67)) ([a42aee4](https://github.com/odata2ts/odata2ts/commit/a42aee494a4e30d8704569d7262fc31020ed7711))

* **odata2ts:** adapt method generation for services ([486a85c](https://github.com/odata2ts/odata2ts/commit/486a85cffc2ee06e6461ecd1f3dd00a8208b95f7))

* **odata2ts:** adapt query object generation to OperationReturnTypes ([734e2bd](https://github.com/odata2ts/odata2ts/commit/734e2bd51a67cc285153c97f96655b950c62a230))

* **odata2ts:** apply name mapping in all places ([dd5a6fd](https://github.com/odata2ts/odata2ts/commit/dd5a6fdde83cdc3f803eb1d96553571e78364849))

* **odata2ts:** property configuration with name mapping and managed flag ([#78](https://github.com/odata2ts/odata2ts/issues/78)) ([797566c](https://github.com/odata2ts/odata2ts/commit/797566cf962e8c9b1f3a1a8081e066c9f0829b91))

## [0.14.2](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.14.1...@odata2ts/odata2model@0.14.2) (2022-09-09)

### Bug Fixes

* IdFunction never gets v2Mode flag ([f36d173](https://github.com/odata2ts/odata2ts/commit/f36d173c3e48255777e5346441030b711706b1ad))

## [0.14.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.14.0...@odata2ts/odata2model@0.14.1) (2022-09-08)

### Bug Fixes

* corrected int tests ([fff88be](https://github.com/odata2ts/odata2ts/commit/fff88be110cc53a5193ed72bd39a53cddc997a93))

* don't map param names for now ([f39f541](https://github.com/odata2ts/odata2ts/commit/f39f541672f8a61a1d7554b8e86e58f606bd117b))

# [0.14.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.13.1...@odata2ts/odata2model@0.14.0) (2022-09-08)

### Code Refactoring

* centralize formatting and parsing of params & attributes ([#62](https://github.com/odata2ts/odata2ts/issues/62)) ([ba93a27](https://github.com/odata2ts/odata2ts/commit/ba93a278afd2de356675973fb2889483bc370f7a))

### Features

* **odata-service:** allow to pass custom headers per request ([#58](https://github.com/odata2ts/odata2ts/issues/58)) ([d783e51](https://github.com/odata2ts/odata2ts/commit/d783e51e4b5a69892c79a03bedc6bf041abba9ec))

* **odata2model:** add typescript support for odata2ts.config ([70a01e5](https://github.com/odata2ts/odata2ts/commit/70a01e5fd03baa5a470bc26b876df6a526782668))

* **odata2model:** support V2 functions with HTTP method POST ([#61](https://github.com/odata2ts/odata2ts/issues/61)) ([c9213fa](https://github.com/odata2ts/odata2ts/commit/c9213faecd9e0ee7bebe049879b58a0f1b2ccd95))

### BREAKING CHANGES

* UrlHelper including compile and parse methods have been removed; interfaces for EntityKeyProp, EntityKeySpec, InlineUrlProp, and InlineUrlProps have been removed; parsing of passed parameters is more strict.

Introducing static functions on QPath objects to format and parse url conform values.

Introducing QParams, QFunction and QAction to bundle logic around operations including the id function (url path generation).

Generate models for IdType of entity & parameter models for functions / actions in general

Generate Q-objects for EntityIdFunctions, and functions & actions in general

## [0.13.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.13.0...@odata2ts/odata2model@0.13.1) (2022-08-25)

### Bug Fixes

* always create errors with new operator ([#54](https://github.com/odata2ts/odata2ts/issues/54)) ([562dede](https://github.com/odata2ts/odata2ts/commit/562dede85d7ce276957a4b1683856d4adfee3ad1))

# [0.13.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.12.1...@odata2ts/odata2model@0.13.0) (2022-08-11)

### Code Refactoring

* **uri-builder:** composition over inheritance, proper interfaces ([#48](https://github.com/odata2ts/odata2ts/issues/48)) ([36c8a0a](https://github.com/odata2ts/odata2ts/commit/36c8a0a27dabfbcfbd2359d040dcda518615a4e0))

### Features

* **uri-builder:** V2 implementation of "expanding" method ([#49](https://github.com/odata2ts/odata2ts/issues/49)) ([e237c61](https://github.com/odata2ts/odata2ts/commit/e237c61710125daa6e7e6617ebf377304f1b5d89))

### BREAKING CHANGES

* **uri-builder:** It was possible to select nested props by using q-props (V2 only); this syntax has been removed and will be replaced by making use of the current V4 syntax: you first expand the property (method "expanding") and then select (or expand) on the expanded entity.

* **uri-builder:** ODataUriBuilder was removed from export, it might have served as base class but was of no other use.

## [0.12.1](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.12.0...@odata2ts/odata2model@0.12.1) (2022-08-01)

### Bug Fixes

* add imports for returnType & don't camel case function / action params ([#44](https://github.com/odata2ts/odata2ts/issues/44)) ([b46e4fd](https://github.com/odata2ts/odata2ts/commit/b46e4fdf5bd1566c03c8833daf1a7afcbb471d53))

# [0.12.0](https://github.com/odata2ts/odata2ts/compare/@odata2ts/odata2model@0.11.2...@odata2ts/odata2model@0.12.0) (2022-08-01)

### Bug Fixes

* remove superfluous constructor from qObjects ([#41](https://github.com/odata2ts/odata2ts/issues/41)) ([f5f5623](https://github.com/odata2ts/odata2ts/commit/f5f56233eeadff584dc91c4a05c4d3d8196a7af3))

### Code Refactoring

* consistent casing for services, models and props ([#42](https://github.com/odata2ts/odata2ts/issues/42)) ([70e6e92](https://github.com/odata2ts/odata2ts/commit/70e6e92a888c67f65dadb643ed12ace692d2cc8a))

* use proper getMethods for services ([#43](https://github.com/odata2ts/odata2ts/issues/43)) ([e05c818](https://github.com/odata2ts/odata2ts/commit/e05c818f193711a161a34be8e7a4c3ba71572a75))

### Features

* createKey and parseKey for EntitySetService & correct V2 type prefixing ([#39](https://github.com/odata2ts/odata2ts/issues/39)) ([edd05bb](https://github.com/odata2ts/odata2ts/commit/edd05bbf7747ba280786c9ba274160ef274c030a))

* typing improvements & editable model versions ([#27](https://github.com/odata2ts/odata2ts/issues/27)) ([df290df](https://github.com/odata2ts/odata2ts/commit/df290dff953a9e37c64c39c18ffdec74ce1874d4))

### BREAKING CHANGES

* use proper getMethods for services "getXxxSrv()" instead of get accessors "xxx"

* consistent camel or pascal casing for services, models and props

* fix: always empty output dir before generating

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
