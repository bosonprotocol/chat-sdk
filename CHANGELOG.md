# [2.0.0](https://github.com/bosonprotocol/chat-sdk/compare/v1.4.5...v2.0.0) (2026-06-04)


* feat(mcp)!: source wallet private key from hosting env, not tool args ([#101](https://github.com/bosonprotocol/chat-sdk/issues/101)) ([#103](https://github.com/bosonprotocol/chat-sdk/issues/103)) ([a1bc3ea](https://github.com/bosonprotocol/chat-sdk/commit/a1bc3ea0c227d85b5e4f872afddca4f8d61a8baf))


### Bug Fixes

* **ci:** bump npm to 11.16.0 and force provenance for OIDC publish [skip ci] ([e2b625e](https://github.com/bosonprotocol/chat-sdk/commit/e2b625e70bc9e63cc9cd49be63bc27882198899b))
* **ci:** decouple npm publish from semantic-release for OIDC latest ([2f3aa1b](https://github.com/bosonprotocol/chat-sdk/commit/2f3aa1b2198f6009664c28b9306dd1fa36b14700))
* **ci:** drop setup-node registry-url so npm OIDC publishing works ([fe736e6](https://github.com/bosonprotocol/chat-sdk/commit/fe736e6b527327d97dd60ae4a1308ec35b051ae3)), closes [actions/setup-node#1440](https://github.com/actions/setup-node/issues/1440)


### Reverts

* undo failed 2.0.0 release commit [skip ci] ([8ff6707](https://github.com/bosonprotocol/chat-sdk/commit/8ff6707bab87d69a34013df7a1b776980fedfbdb))
* undo failed-run 2.0.0 release commit 4a972b0 [skip ci] ([1efa305](https://github.com/bosonprotocol/chat-sdk/commit/1efa305d8f715198a9a8818d7fbff5e9829ecc1f))
* undo failed-run 2.0.0 release commit 8bc1354 [skip ci] ([84d475f](https://github.com/bosonprotocol/chat-sdk/commit/84d475f5b6cc67e92b3bdce1c143569422e383a4))


### BREAKING CHANGES

* the MCP server no longer accepts `privateKey` as a tool
argument. Provide the wallet key via the BOSON_XMTP_PRIVATE_KEY environment
variable / hosting secret (one wallet per server instance). For the goat-sdk
plugin, `{ stdio: true, privateKey }` now forwards the key to the spawned
server's environment, and `{ http: true, url }` no longer takes a `privateKey`
(the remote server must be configured with its own secret). The public Cloud
Run deployment has been removed; the HTTP server is self-hosted only.

# [1.4.0](https://github.com/bosonprotocol/chat-sdk/compare/v1.3.2...v1.4.0) (2025-09-19)


### Features

* trigger ci ([#87](https://github.com/bosonprotocol/chat-sdk/issues/87)) ([f240fa3](https://github.com/bosonprotocol/chat-sdk/commit/f240fa351fe2b819fb874ab80ef6cacf945a0c17))

## [1.3.2](https://github.com/bosonprotocol/chat-sdk/compare/v1.3.1...v1.3.2) (2025-09-19)


### Bug Fixes

* attempt to fix publish-latest github action ([#78](https://github.com/bosonprotocol/chat-sdk/issues/78)) ([926780a](https://github.com/bosonprotocol/chat-sdk/commit/926780ac366042dc6cb092c27a9e900dbf92349b))
* attempt to fix publish-latest github action ([#79](https://github.com/bosonprotocol/chat-sdk/issues/79)) ([35d4349](https://github.com/bosonprotocol/chat-sdk/commit/35d4349168715c6f8b290a7eace9819f87fc4be8))
* attempt to fix publish-latest github action ([#80](https://github.com/bosonprotocol/chat-sdk/issues/80)) ([eb5625a](https://github.com/bosonprotocol/chat-sdk/commit/eb5625a7dac30f046342952c4498ddc40b7de039))
* attempt to fix publish-latest github action ([#82](https://github.com/bosonprotocol/chat-sdk/issues/82)) ([0effd49](https://github.com/bosonprotocol/chat-sdk/commit/0effd495c0faa237140462979d886b7b2d13aa66))
* attempt to fix publish-latest github action ([#83](https://github.com/bosonprotocol/chat-sdk/issues/83)) ([421abff](https://github.com/bosonprotocol/chat-sdk/commit/421abff6fecaa9b756988ec8c18901596459c51e))
* attempt to fix publish-latest github action ([#84](https://github.com/bosonprotocol/chat-sdk/issues/84)) ([9bb1764](https://github.com/bosonprotocol/chat-sdk/commit/9bb176485610f4089fe774bc44c1a9b4e8c29c8d))

# [1.3.0](https://github.com/bosonprotocol/chat-sdk/compare/v1.2.0...v1.3.0) (2022-11-23)


### Features

* add env to boson xmt client ([#38](https://github.com/bosonprotocol/chat-sdk/issues/38)) ([9123526](https://github.com/bosonprotocol/chat-sdk/commit/9123526ed178c3198be53f467101ef4051b899b1))

# [1.2.0](https://github.com/bosonprotocol/chat-sdk/compare/v1.1.0...v1.2.0) (2022-11-07)


### Features

* change env name ([#36](https://github.com/bosonprotocol/chat-sdk/issues/36)) ([1138675](https://github.com/bosonprotocol/chat-sdk/commit/11386753a58f9a4df50e492a7bccdebf48242ced))

# [1.1.0](https://github.com/bosonprotocol/chat-sdk/compare/v1.0.1...v1.1.0) (2022-10-12)


### Features

* change isXmtpEnabled to check any address given an initialized random client ([#30](https://github.com/bosonprotocol/chat-sdk/issues/30)) ([463663d](https://github.com/bosonprotocol/chat-sdk/commit/463663dac2df25c9ff8b137a61ead0fff220c3a5))
* make the validate proposal part in validateMessage fail if the proposal percentage is not a string positive integer ([#34](https://github.com/bosonprotocol/chat-sdk/issues/34)) ([e99d156](https://github.com/bosonprotocol/chat-sdk/commit/e99d1568398a5db7dde6809f8b7dc681cdfdf0eb))
* move files to v0.0.1, jest config in ts and validateMessage function call before sending a message ([#29](https://github.com/bosonprotocol/chat-sdk/issues/29)) ([130076e](https://github.com/bosonprotocol/chat-sdk/commit/130076e8319562cba59ccb117ac3c6f04598fbf7))
* stop monitor thread ([#32](https://github.com/bosonprotocol/chat-sdk/issues/32)) ([a8dd646](https://github.com/bosonprotocol/chat-sdk/commit/a8dd646fd42d416af4fdf716dbd85306a258adf8)), closes [#28](https://github.com/bosonprotocol/chat-sdk/issues/28)
* update @xmtp/xmtp-js to ^6.0.2 ([#33](https://github.com/bosonprotocol/chat-sdk/issues/33)) ([914f4ef](https://github.com/bosonprotocol/chat-sdk/commit/914f4ef253da89eeae64df6d9f898ce4d10a8032))

## [1.0.1](https://github.com/bosonprotocol/chat-sdk/compare/v1.0.0...v1.0.1) (2022-08-04)

### Bug Fixes

- change patch to dev ([#22](https://github.com/bosonprotocol/chat-sdk/issues/22)) ([099cd17](https://github.com/bosonprotocol/chat-sdk/commit/099cd174bbd6450e1dff40037b48a5b6dc1110a8))
- patch-package on prepare ([#23](https://github.com/bosonprotocol/chat-sdk/issues/23)) ([9772938](https://github.com/bosonprotocol/chat-sdk/commit/9772938d0837cd2685390077350478714304ab24))
