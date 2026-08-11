# Non-functional requirements

NFRs apply to the mobile system unless marked phase-specific.

Priority: **M** Must | **S** Should | **C** Could.  
Status: **Delivered** | **Planned** | **Deferred**.

## Security & privacy

| ID         | NFR                                                      | Pri | Status                                |
| ---------- | -------------------------------------------------------- | --- | ------------------------------------- |
| NFR-SEC-01 | No service_role/private keys in the mobile binary or git | M   | Delivered                             |
| NFR-SEC-02 | Authorisation enforced by RLS for user-owned data        | M   | Delivered (PH1); Planned (PH2 tables) |
| NFR-SEC-03 | Secure storage for session tokens                        | M   | Delivered                             |
| NFR-SEC-04 | Secret scanning in delivery pipeline                     | M   | Delivered                             |

## Reliability & offline

| ID         | NFR                                                                                         | Pri | Status    |
| ---------- | ------------------------------------------------------------------------------------------- | --- | --------- |
| NFR-REL-01 | Cold start shall not crash when network is unavailable if a valid session/cache path exists | M   | Delivered |
| NFR-REL-02 | Critical preference mutations shall survive offline via pause/resume                        | S   | Delivered |
| NFR-REL-03 | Grammar completion writes shall be idempotent across retry/reconnect                        | M   | Planned   |
| NFR-REL-04 | Bootstrap of analytics/crash/messaging shall be non-blocking                                | M   | Delivered |

## Performance

| ID          | NFR                                                                                         | Pri | Status                 |
| ----------- | ------------------------------------------------------------------------------------------- | --- | ---------------------- |
| NFR-PERF-01 | Auth destination after bootstrap shall avoid unnecessary full remounts on same-user refresh | S   | Delivered              |
| NFR-PERF-02 | Practice interactions shall remain responsive after questions are loaded (local grading)    | M   | Planned                |
| NFR-PERF-03 | Images use FastImage for remote content                                                     | S   | Delivered (capability) |

## Usability & accessibility

| ID          | NFR                                                                                         | Pri | Status                   |
| ----------- | ------------------------------------------------------------------------------------------- | --- | ------------------------ |
| NFR-A11Y-01 | Primary controls meet ≥44pt touch height on core flows                                      | M   | Delivered                |
| NFR-A11Y-02 | Form errors expose accessible announcements / relationships                                 | M   | Delivered                |
| NFR-A11Y-03 | Selection state is not colour-only where selection matters                                  | M   | Delivered                |
| NFR-A11Y-04 | Grammar exercises completable with Dynamic Type / screen reader assumptions of the phase    | M   | Planned                  |
| NFR-UX-01   | Loading, empty, error, and retry states must not leave blank blocking screens on core flows | M   | Partial → tighten in PH2 |

## Operability

| ID         | NFR                                                     | Pri | Status                                    |
| ---------- | ------------------------------------------------------- | --- | ----------------------------------------- |
| NFR-OPS-01 | Dual Firebase client configs selectable by `APP_ENV`    | M   | Delivered                                 |
| NFR-OPS-02 | Feature rollout via remote flags without store resubmit | M   | Delivered (mechanism)                     |
| NFR-OPS-03 | Lint, format, typecheck, unit/coverage gates in CI      | M   | Delivered                                 |
| NFR-OPS-04 | Representative Maestro auth smoke for both platforms    | S   | Delivered (emulator/simulator acceptance) |
| NFR-OPS-05 | Representative Grammar E2E before PH2 release           | M   | Planned                                   |
| NFR-OPS-06 | Console push/crash/DebugView evidence packs             | S   | Deferred                                  |

## Maintainability

| ID           | NFR                                                                 | Pri | Status    |
| ------------ | ------------------------------------------------------------------- | --- | --------- |
| NFR-MAINT-01 | Layering screen → hook → service preserved                          | M   | Delivered |
| NFR-MAINT-02 | Database types generated from linked schema                         | M   | Delivered |
| NFR-MAINT-03 | Global unit coverage gate ≈ 90% statements/branches/functions/lines | M   | Delivered |
| NFR-MAINT-04 | BA/SA docs updated when scope or architecture contracts change      | S   | This pack |

## Compatibility

| ID            | NFR                                          | Pri | Status    |
| ------------- | -------------------------------------------- | --- | --------- |
| NFR-COMPAT-01 | Support iOS and Android from one RN codebase | M   | Delivered |
| NFR-COMPAT-02 | Package manager is pnpm; lockfile committed  | M   | Delivered |
| NFR-COMPAT-03 | React Native core UI only for PH foundation  | M   | Delivered |

## Compliance posture (pragmatic)

- Privacy manifests / permission minimisation pursued in native projects.
- Analytics allow-listing preferred over unrestricted event dictionaries.
- No claim of formal certification (SOC2, ISO) in this baseline.

## Acceptance envelopes

A phase may be released when:

1. All **M** FRs/NFRs for that phase are Delivered or explicitly waived with recorded change control.
2. Automated gates for the candidate revision are green.
3. Platform smoke for the phase’s critical journey passes under the agreed device policy.
4. Production feature flags default to safe (off) until operator enablement.
