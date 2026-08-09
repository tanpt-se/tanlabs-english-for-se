fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### doctor

```sh
[bundle exec] fastlane doctor
```

Sanity check — verifies Fastlane + project layout

----


## iOS

### ios pods

```sh
[bundle exec] fastlane ios pods
```

Install CocoaPods

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS (Release, no codesign — CI artifact / local smoke)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build signed IPA for TestFlight / Ad Hoc (needs signing ENV)

### ios release

```sh
[bundle exec] fastlane ios release
```

Production App Store upload (stub — enable when release-ready)

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build signed Android release APK

### android bundle

```sh
[bundle exec] fastlane android bundle
```

Build Android App Bundle (AAB) for Play Store

### android beta

```sh
[bundle exec] fastlane android beta
```

Upload AAB to Play internal track (needs GOOGLE_PLAY_JSON_KEY)

### android release

```sh
[bundle exec] fastlane android release
```

Production Play Store release (stub)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
