# Test structure

- `unit/`: isolated tests arranged to mirror `src/`.
- `integration/`: behavior spanning providers, hooks, services, or screens.
- `security/`: security invariants and configuration checks.
- `regression/`: cross-cutting edge cases and dependency patch guards.

Name new unit tests after their source module and place them under the matching domain path.
