# Journeys and use cases

IDs are stable for traceability (`UC-*`). Status: **Delivered** = implemented in app.

## Journey map (high level)

```text
Install → Register/Login → Complete profile → Home
  ├─ Settings (notifications, edit profile, sign out)
  └─ [flag] Grammar Home → Topic → Lesson → Practice → Result
         └─ Continue learning / Retry later
```

## Use cases — Foundation (PH1)

### UC-AUTH-01 Register with email

- **Actor:** New learner
- **Preconditions:** App installed; network available
- **Main flow:** Open Register → enter email/password → submit → receive auth result (session or confirmation-required messaging per environment policy)
- **Postcondition:** Account exists; user proceeds toward profile or confirmation handling
- **Status:** Delivered

### UC-AUTH-02 Sign in

- **Actor:** Returning learner
- **Main flow:** Login → credentials → Home or Complete Profile per profile completeness
- **Status:** Delivered

### UC-AUTH-03 Restore session

- **Actor:** Returning learner
- **Main flow:** Cold start with valid secure session → destination resolved without re-login
- **Alternate:** Invalid/expired session → Auth
- **Status:** Delivered

### UC-AUTH-04 Sign out

- **Actor:** Authenticated learner
- **Main flow:** Settings → Sign out → Auth; device delivery deactivated server-side where applicable
- **Status:** Delivered

### UC-PROF-01 Complete profile

- **Actor:** Authenticated user missing profile fields
- **Main flow:** Enter display name + English level → save → Home
- **Status:** Delivered

### UC-PROF-02 Edit profile

- **Actor:** Authenticated learner on Home
- **Main flow:** Settings → Edit profile → change name/level → save
- **Status:** Delivered

### UC-HOME-01 View feature teasers

- **Actor:** Authenticated learner
- **Main flow:** Open Home → see Grammar/Vocabulary/Interview/AI cards reflecting remote flags (interactive or coming-soon)
- **Status:** Delivered

### UC-NOTIF-01 Manage notification preference

- **Actor:** Authenticated learner
- **Main flow:** Settings → enable/disable notifications → preference persisted; OS permission handled; token lifecycle follows preference
- **Alternate:** Offline → mutation pauses and resumes later
- **Status:** Delivered

### UC-ACCT-01 Switch account safely

- **Actor:** Learner signing into account B after A
- **Main flow:** Sign out A → sign in B → UI and cached identity show only B; device token ownership claimed for B
- **Status:** Delivered (historical + lifecycle rules)

## Use cases — Grammar (PH2)

### UC-GR-01 Enter Grammar when enabled

- **Preconditions:** `feature_grammar` true; profile complete
- **Main flow:** Home → Grammar Home
- **Alternate:** Flag false → coming-soon / no entry
- **Status:** Delivered

### UC-GR-02 Browse topics and open a lesson

- **Main flow:** Grammar Home → select topic → open lesson (rules + SE examples from published content)
- **Status:** Delivered

### UC-GR-03 Practise exercises

- **Main flow:** Start practice → answer MC / fill-blank / sentence-order items → immediate deterministic feedback and optional retry of an item per rules
- **Alternate:** Connectivity lost after questions loaded → local practice continues
- **Status:** Delivered

### UC-GR-04 Complete attempt and view result

- **Main flow:** Finish practice → Review answers → Submit → Result (score, completion vs 70%) → persist attempt idempotently
- **Status:** Delivered

### UC-GR-05 Continue learning

- **Main flow:** Return to Grammar Home → Continue Learning selects most recent incomplete published lesson (stable tie-breakers) or first not-started
- **Status:** Delivered

### UC-GR-06 Retry lesson

- **Main flow:** From Result or progress → new attempt; best score never decreases
- **Status:** Delivered

## Non-goals (not use cases in current phases)

- Voice answer submission
- AI free-text correction
- Multiplayer or social sharing of scores
- Admin CMS inside the mobile app

## Traceability hints

| Journey step                     | FR family                                           |
| -------------------------------- | --------------------------------------------------- |
| Auth / profile / home / settings | `FR-AUTH-*`, `FR-PROF-*`, `FR-HOME-*`, `FR-NOTIF-*` |
| Grammar loop                     | `FR-GR-*`                                           |
| Privacy / isolation              | `FR-SEC-*` (see FR doc + SA data/security)          |
