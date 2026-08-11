# Integrations and environments

## External systems

| System                   | Use                                          | Client surface                       |
| ------------------------ | -------------------------------------------- | ------------------------------------ |
| Supabase Auth            | Email auth, JWT session                      | `@supabase/supabase-js`              |
| Supabase Postgres        | Profiles, config, devices, (planned) grammar | Same client + RLS/RPC                |
| Firebase Cloud Messaging | Push token + message delivery                | `@react-native-firebase/messaging`   |
| Firebase Crashlytics     | Crash reporting                              | `@react-native-firebase/crashlytics` |
| Firebase Analytics       | Allow-listed events                          | `@react-native-firebase/analytics`   |
| Optional HTTP API        | Future/non-Supabase REST                     | `src/lib/api` (axios + interceptors) |

## Environment model

`APP_ENV` accepts only:

- `development`
- `production`

`staging` as an app env value is rejected by configuration validation.

### Backend pairing (current product decision)

| APP_ENV     | Firebase project (logical) | Package / bundle IDs                                        |
| ----------- | -------------------------- | ----------------------------------------------------------- |
| development | dev Firebase app/project   | Android `com.tanlabs.enforse` · iOS `com.tanlabs.en-for-se` |
| production  | prod Firebase app/project  | **Same** IDs                                                |

Client files live under `config/firebase/{development,production}/` and are selected into native projects via `scripts/select-firebase-config.sh` (Gradle / Xcode / `preios` / `preandroid`). Real client files are gitignored; `.example` placeholders are committed.

Supabase URL + anon key are supplied via env (`.env` / `env.ts`). Separate Supabase projects per env are an ops concern; the app must not hard-code service secrets.

## Configuration responsibilities

| Config                 | Owner                      | Notes                                          |
| ---------------------- | -------------------------- | ---------------------------------------------- |
| `APP_ENV`              | Build pipeline / local env | Selects Firebase folder + runtime expectations |
| Supabase public keys   | Env files                  | Public; rotate via project settings            |
| Feature flags          | `app_config` rows          | Runtime; Grammar gated by `feature_grammar`    |
| Signing / Match / Play | Fastlane / CI secrets      | Never commit                                   |

## Integration sequences (representative)

### Sign-in

```text
UI → Auth service → Supabase Auth → session in secure storage
   → profile fetch → routeResolver → stack
```

### Notification enable

```text
Settings → preference mutation → (permission) → FCM token
        → device service upsert → server row
```

### Grammar complete (planned)

```text
Practice UI → engine result → complete_grammar_attempt RPC
           → attempt insert + progress upsert → Result UI
```

## Failure & degrade

| Integration              | Degrade strategy                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Remote config fetch fail | Safe defaults (features off)                                                       |
| Profile fetch fail       | Cached profile shell when available                                                |
| FCM unavailable          | Preference retained; token paths no-op / error surfaced without crashing bootstrap |
| Crashlytics/Analytics    | Non-blocking init                                                                  |

## Observability integrations — evidence debt

SDK wiring is in-app. Live Console verification for push matrices, Crashlytics test crashes, and Analytics DebugView was deferred after PH1 close. Treat as operational follow-up, not as absence of architecture.
