# Data and security

## Security model (summary)

| Layer          | Responsibility                                            |
| -------------- | --------------------------------------------------------- |
| Supabase Auth  | Identity, JWT                                             |
| RLS + RPC      | Authorisation of rows and privileged flows                |
| Secure storage | Session/runtime secrets on device                         |
| Client config  | Public by definition (URL, anon key, Firebase plist/json) |
| App binary     | Never contains `service_role` or private keys             |

Treat every client bundle as readable by a motivated user. **RLS is the product security boundary.**

## Logical data model — Foundation (delivered)

```text
auth.users
    │ 1:1
    ▼
profiles (display_name, english_level)
    │
    ├── user_devices (fcm tokens, active flag, ownership)
    └── notification_settings (per-user preference)

app_config (key → jsonb)   # feature flags / remote config
```

Notable RPC: `claim_device_token` (security definer) for account-switch token ownership.

Migration head at documentation time: `021_enable_learning_flags.sql` (streak `020`, learning flags `021`).

## Logical data model — Grammar (delivered)

```text
grammar_topics
    └── grammar_lessons (level A2–C1, title, description, content JSONB)
            └── grammar_exercises (structured JSONB payloads)

user_grammar_progress  (per user + lesson)
grammar_attempts       (immutable completes; unique (user_id, client_attempt_id))
practice_streaks       (per user; local calendar dates; union via merge_practice_streak)
```

Write path: security-definer `complete_grammar_attempt` derives `user_id` from `auth.uid()`, inserts attempt idempotently, upserts progress in one transaction. Migration `012` validates score matches correct/total counts. Streak writes go through `merge_practice_streak` (no direct client inserts).

Column contracts: migrations `007`–`011`; generated types in `src/types/database.ts`.

## Access control matrix (intent)

| Resource                    | Anon            | Authenticated owner         | Authenticated other | Client mutate content |
| --------------------------- | --------------- | --------------------------- | ------------------- | --------------------- |
| `profiles`                  | deny            | CRUD own (as policy allows) | deny                | n/a                   |
| `app_config`                | select (policy) | select                      | select              | deny                  |
| `user_devices`              | deny            | own rows + claim RPC        | deny                | n/a                   |
| `notification_settings`     | deny            | own                         | deny                | n/a                   |
| Grammar content (published) | deny\*          | select published            | select published    | **deny**              |
| Grammar progress/attempts   | deny            | own only                    | deny                | insert via RPC rules  |
| `practice_streaks`          | deny            | select own; write via RPC   | deny                | **deny** (RPC only)   |

\*Anonymous content access is not required for PH2 learning loop (user is signed in).

## Sensitive data classes

| Class         | Examples            | Handling                                    |
| ------------- | ------------------- | ------------------------------------------- |
| Secrets       | refresh tokens      | Keychain/Keystore                           |
| PII           | email, display name | RLS; minimise analytics props               |
| Learning data | attempts, scores    | user-owned RLS                              |
| Public config | feature flags       | readable; not secretly trusted for security |

## Client persistence rules

- Persisted query cache must not store credentials.
- Profile cache is encoded for offline shell; still not a substitute for RLS.
- Account switch must not show previous user progress (cache key / ownership discipline).

## Verification expectations

- Automated RLS script with two users (`pnpm run verify:rls`)
- Secret scan in CI/scripts
- Architecture policy tests for forbidden imports and secret-shaped examples

## Threat notes (abridged)

| Threat                            | Mitigation                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Stolen anon key                   | Expected; RLS limits damage                                                                     |
| Tampered client scores            | Server RPC derives user; validate payloads; do not trust raw client “progress” without contract |
| Duplicate offline completes       | `client_attempt_id` uniqueness                                                                  |
| Notification targeting wrong user | deactivate + claim token on switch/logout                                                       |
