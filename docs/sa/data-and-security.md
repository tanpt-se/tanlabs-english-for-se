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

Migration head at documentation time: `006_security_hardening.sql`.

## Logical data model — Grammar (planned)

```text
grammar_topics
    └── grammar_lessons
            ├── examples (or embedded structured content)
            └── exercises (structured JSONB payloads)

user_grammar_progress  (per user + lesson)
grammar_attempts       (immutable completes; unique (user_id, client_attempt_id))
```

Planned write path: security-definer `complete_grammar_attempt` derives `user_id` from `auth.uid()`, inserts attempt idempotently, upserts progress in one transaction.

Exact column contracts freeze in the PH2 content/database tasks; this doc states intent only.

## Access control matrix (intent)

| Resource                    | Anon            | Authenticated owner         | Authenticated other | Client mutate content |
| --------------------------- | --------------- | --------------------------- | ------------------- | --------------------- |
| `profiles`                  | deny            | CRUD own (as policy allows) | deny                | n/a                   |
| `app_config`                | select (policy) | select                      | select              | deny                  |
| `user_devices`              | deny            | own rows + claim RPC        | deny                | n/a                   |
| `notification_settings`     | deny            | own                         | deny                | n/a                   |
| Grammar content (published) | deny\*          | select published            | select published    | **deny**              |
| Grammar progress/attempts   | deny            | own only                    | deny                | insert via RPC rules  |

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
