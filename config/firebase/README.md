# Firebase client configs (WP-08)

PH1 uses **two** app environments: `development` and `production`.
Android package and iOS bundle stay fixed across both Firebase backends:

- Android: `com.tanlabs.enforse`
- iOS: `com.tanlabs.en-for-se`

## Layout

```text
config/firebase/
  development/
    google-services.json          # gitignored locally
    GoogleService-Info.plist      # gitignored locally
  production/
    google-services.json
    GoogleService-Info.plist
  *.example                       # tracked placeholders
```

Real Firebase client files are **gitignored** (see root `.gitignore`). Do not commit
server service-account JSON or private keys.

## Setup

1. Create (or use) two Firebase projects/apps registered with the package/bundle IDs above.
2. Download each platform's client config into the matching folder.
3. Run:

```bash
pnpm run firebase:config            # uses APP_ENV from env / .env
pnpm run firebase:config:development
pnpm run firebase:config:production
```

`preandroid` / `preios` and Android Gradle invoke the selector so Debug uses development
and Release uses production (via `.env` / `.env.production` `APP_ENV`).

## Verify

```bash
pnpm run verify:firebase-config
```
