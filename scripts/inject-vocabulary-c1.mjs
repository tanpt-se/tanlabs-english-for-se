#!/usr/bin/env node
/**
 * Promote advanced B2 lemmas to C1 and prepend unique C1 workplace items
 * into each core situation source so packs show a C1 band.
 *
 * Usage: node scripts/inject-vocabulary-c1.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SOURCES_DIR = resolve(ROOT, 'supabase/seed/vocabulary/sources');

const PROMOTE = new Set(
  [
    'idempotent',
    'observability',
    'circuit-breaker',
    'dead-letter',
    'CQRS',
    'saga',
    'error-budget',
    'toil',
    'blast-radius',
    'psychological-safety',
    'disagree-and-commit',
    'two-way-door',
    'one-way-door',
    'premortem',
    'blue-green',
    'tradeoff',
    'flake-rate',
    'MTTR',
    'MTTD',
    'dress-rehearsal',
    'hypercare',
    'steerco',
    'deadlock',
    'event-driven',
    'backoff',
    'structured-log',
    'tracing',
    'span',
    'quorum',
    'ratify',
    'RAID',
    'RICE',
    'MoSCoW',
    'semver',
    'bisect',
    'flapping',
    'breadcrumb',
    'CVE',
    'TTD',
    'TTM',
    'TTR',
    'soak',
    'cutover',
    'throughput',
    'mitigation',
    'canary',
    'IaC',
    'pubsub',
    'broker',
    'shard',
    'helm',
    'bias-for-action',
    'fishbowl',
    'lean-coffee',
    'plenary',
    'stakeholder-map',
    'risk-register',
    'go/no-go',
    'parking-lot',
    'error-budget burn',
    'reduce the blast radius',
    'look for retry storms',
    'check error budget burn',
  ].map((t) => t.toLowerCase()),
);

/** @type {Record<string, object[]>} */
const NEW_C1 = {
  'daily-standup.json': [
    item(
      'operational load',
      'phrase',
      'Non-project work that consumes capacity (pages, interrupts, toil).',
      'Standup',
      ['High operational load this week', 'Operational load is crowding roadmap work'],
    ),
    item(
      'interrupt-driven',
      'word',
      'Work shaped by unplanned alerts and ad-hoc asks instead of a plan.',
      'Standup',
      ['We are interrupt-driven today'],
    ),
    item(
      'focus block',
      'phrase',
      'Protected calendar time reserved for deep engineering work.',
      'Calendar',
      ['Protect a focus block before standup follow-ups'],
    ),
    item(
      'capacity reserved for interrupts',
      'phrase',
      'Planned slack kept for pages and urgent asks.',
      'Standup',
      ['We reserved capacity for interrupts'],
    ),
    item(
      'unplanned work ratio',
      'phrase',
      'Share of time spent on work that was not on the sprint plan.',
      'Standup',
      ['Unplanned work ratio spiked after the outage'],
    ),
    item(
      'page fatigue',
      'phrase',
      'Burnout risk from frequent overnight or noisy pages.',
      'On-call',
      ['Page fatigue is rising on secondary'],
    ),
    item(
      'handover debt',
      'phrase',
      'Missing context after a shift change that slows the next owner.',
      'Standup',
      ['Handover debt slowed morning triage'],
    ),
    item(
      'stand-down',
      'word',
      'End an incident response mode and return to normal work.',
      'Incident',
      ['We can stand-down the war room'],
    ),
    item(
      'shadow on-call',
      'phrase',
      'Trainee observes paging without owning primary response yet.',
      'On-call',
      ['I am shadow on-call this week'],
    ),
    item(
      'follow-the-sun',
      'phrase',
      'Hand work across time zones so progress continues overnight.',
      'Standup',
      ['Use follow-the-sun for the migration watch'],
    ),
    item(
      'cognitive overload',
      'phrase',
      'Too many concurrent contexts reducing decision quality.',
      'Standup',
      ['Cognitive overload after three incidents'],
    ),
    item(
      'bus-factor risk',
      'phrase',
      'Risk that too few people understand a critical system.',
      'Standup',
      ['Bus-factor risk on the billing service'],
    ),
    item(
      'quiet hours breach',
      'phrase',
      'A page or deploy that violated agreed no-interrupt windows.',
      'On-call',
      ['That deploy was a quiet hours breach'],
    ),
    item(
      'severity statement',
      'phrase',
      'Concise description of user-visible impact during an incident.',
      'Incident',
      ['Need a clearer severity statement'],
    ),
    item(
      'mitigation owner',
      'phrase',
      'Person accountable for the active mitigation action.',
      'Incident',
      ['Name a mitigation owner in standup'],
    ),
    item(
      'recovery verification',
      'phrase',
      'Checks proving the system is healthy after mitigation.',
      'Incident',
      ['Recovery verification is still pending'],
    ),
    item(
      'known-error record',
      'phrase',
      'Tracked residual issue accepted temporarily with a workaround.',
      'Ticket',
      ['File a known-error record for the flake'],
    ),
    item(
      'operational readiness',
      'phrase',
      'Evidence the service can be run safely in production.',
      'Deploy',
      ['Block launch until operational readiness is signed off'],
    ),
    item(
      'runbook gap',
      'phrase',
      'Missing or outdated steps discovered during real response.',
      'On-call',
      ['We found a runbook gap at 2am'],
    ),
    item(
      'escalation latency',
      'phrase',
      'Time from first page until the right responder engages.',
      'On-call',
      ['Escalation latency exceeded the policy'],
    ),
  ],
  'meetings.json': [
    item(
      'decision log',
      'phrase',
      'Durable record of what was decided, by whom, and why.',
      'Decision',
      ['Add this to the decision log'],
    ),
    item(
      'dissent recorded',
      'phrase',
      'Formal note that someone disagreed but the group proceeded.',
      'Meeting',
      ['Dissent recorded; we still ship the RFC'],
    ),
    item(
      'consensus threshold',
      'phrase',
      'Minimum agreement level required before committing.',
      'Decision',
      ['We did not meet the consensus threshold'],
    ),
    item(
      'facilitator neutrality',
      'phrase',
      'Facilitator avoids steering outcomes while managing process.',
      'Meeting',
      ['Keep facilitator neutrality on this debate'],
    ),
    item('timebox overrun', 'phrase', 'Discussion that exceeds the agreed duration.', 'Meeting', [
      'Park it — we are in timebox overrun',
    ]),
    item(
      'parking-lot triage',
      'phrase',
      'Sort deferred topics into owners and next forums.',
      'Meeting',
      ['Do parking-lot triage in the last five minutes'],
    ),
    item(
      'pre-read compliance',
      'phrase',
      'Whether attendees actually read materials before the meeting.',
      'Meeting',
      ['Pre-read compliance was low'],
    ),
    item(
      'silent brainstorm',
      'phrase',
      'Write ideas privately first to reduce anchoring bias.',
      'Meeting',
      ['Start with a silent brainstorm'],
    ),
    item(
      'round-robin airtime',
      'phrase',
      'Give each person a turn so dominant voices do not crowd others.',
      'Meeting',
      ['Use round-robin airtime for feedback'],
    ),
    item(
      'decision rights',
      'phrase',
      'Clarity on who can decide versus who is consulted.',
      'Decision',
      ['Clarify decision rights before debating options'],
    ),
    item(
      'consulted vs informed',
      'phrase',
      'RACI distinction between people asked for input and people only notified.',
      'Meeting',
      ['You are informed, not consulted, on this change'],
    ),
    item(
      'irreversible decision',
      'phrase',
      'One-way-door choice that is costly to undo.',
      'Decision',
      ['Treat schema deletion as irreversible'],
    ),
    item(
      'reversible decision',
      'phrase',
      'Two-way-door choice that can be undone cheaply.',
      'Decision',
      ['UI copy is a reversible decision'],
    ),
    item('meeting ROI', 'phrase', 'Whether the outcome justified the calendar cost.', 'Meeting', [
      'Cancel if meeting ROI is unclear',
    ]),
    item(
      'async-first update',
      'phrase',
      'Status shared in writing so the live meeting stays for decisions.',
      'Slack',
      ['Send an async-first update before the sync'],
    ),
    item(
      'working agreements',
      'phrase',
      'Team norms for how meetings and decisions should run.',
      'Meeting',
      ['Refresh working agreements this quarter'],
    ),
    item(
      'stakeholder alignment debt',
      'phrase',
      'Accumulated mismatch in expectations across groups.',
      'Meeting',
      ['We have stakeholder alignment debt with Sales'],
    ),
    item(
      'objection handling',
      'phrase',
      'Structured way to surface and resolve blockers to a proposal.',
      'Meeting',
      ['Leave ten minutes for objection handling'],
    ),
    item(
      'closure criteria',
      'phrase',
      'Conditions that mean a topic is done and can leave the agenda.',
      'Meeting',
      ['Define closure criteria up front'],
    ),
    item(
      'cadence review',
      'phrase',
      'Periodic check of whether recurring meetings still earn their slot.',
      'Calendar',
      ['Quarterly cadence review killed two syncs'],
    ),
  ],
  'task-progress.json': [
    item(
      'critical path',
      'phrase',
      'Sequence of tasks that determines the earliest finish date.',
      'Ticket',
      ['Auth is on the critical path'],
    ),
    item('schedule contingency', 'phrase', 'Buffer kept for uncertainty in estimates.', 'Ticket', [
      'Keep schedule contingency for the migration',
    ]),
    item(
      'scope creep',
      'phrase',
      'Uncontrolled growth of work beyond the agreed boundaries.',
      'Ticket',
      ['That ask is scope creep'],
    ),
    item(
      'definition of ready',
      'phrase',
      'Checklist a ticket must meet before engineering starts.',
      'Ticket',
      ['It fails definition of ready — no AC yet'],
    ),
    item(
      'work breakdown',
      'phrase',
      'Decompose a large deliverable into trackable tasks.',
      'Ticket',
      ['Do a work breakdown before estimating'],
    ),
    item(
      'estimate confidence interval',
      'phrase',
      'Range expressing uncertainty around an estimate.',
      'Ticket',
      ['Give an estimate confidence interval, not a single day'],
    ),
    item(
      'dependency criticality',
      'phrase',
      'How severely a blocked dependency can slip the plan.',
      'Ticket',
      ['Flag dependency criticality in the update'],
    ),
    item(
      'parallelizable work',
      'phrase',
      'Tasks that can proceed concurrently without waiting.',
      'Ticket',
      ['Pull parallelizable work while we wait on Legal'],
    ),
    item('integration risk', 'phrase', 'Chance that combining parts will fail late.', 'PR', [
      'Integration risk is high without a contract test',
    ]),
    item(
      'rollout sequencing',
      'phrase',
      'Ordered stages for releasing a change safely.',
      'Deploy',
      ['Agree rollout sequencing before merge'],
    ),
    item(
      'feature completeness',
      'phrase',
      'Whether behavior meets the intended product outcome, not just code merged.',
      'Ticket',
      ['Merged ≠ feature completeness'],
    ),
    item(
      'technical precedent',
      'phrase',
      'A choice that will shape future designs if left unchallenged.',
      'RFC',
      ['Avoid setting a bad technical precedent'],
    ),
    item(
      'migration window',
      'phrase',
      'Agreed time range when a risky data or traffic change may run.',
      'Deploy',
      ['Book a migration window with on-call'],
    ),
    item(
      'backward-compatible change',
      'phrase',
      'Change that does not break existing clients or readers.',
      'PR',
      ['Keep this backward-compatible for one release'],
    ),
    item(
      'expand/contract migration',
      'phrase',
      'Ship additive schema first, migrate, then remove the old path.',
      'Deploy',
      ['Use expand/contract for the column rename'],
    ),
    item(
      'dark traffic',
      'phrase',
      'Mirrored production requests used to validate a new path safely.',
      'Deploy',
      ['Send dark traffic to the candidate service'],
    ),
    item(
      'progressive delivery',
      'phrase',
      'Gradually increase exposure of a release based on signals.',
      'Deploy',
      ['Progressive delivery gated on error rate'],
    ),
    item(
      'rollback criteria',
      'phrase',
      'Pre-agreed signals that force reverting a release.',
      'Deploy',
      ['Write rollback criteria in the change ticket'],
    ),
    item(
      'ship/no-ship',
      'phrase',
      'Explicit go decision for releasing on a planned date.',
      'Decision',
      ['We need a ship/no-ship call by Thursday'],
    ),
    item(
      'execution risk',
      'phrase',
      'Risk from delivery mechanics rather than product ambiguity.',
      'Ticket',
      ['Main risk is execution, not scope'],
    ),
  ],
  'bugs-problems.json': [
    item(
      'fault isolation',
      'phrase',
      'Contain failure so one component does not take down others.',
      'Incident',
      ['Improve fault isolation around payments'],
    ),
    item(
      'degraded mode',
      'phrase',
      'Reduced but usable behavior while a dependency is unhealthy.',
      'Incident',
      ['Checkout is in degraded mode'],
    ),
    item(
      'blast-radius analysis',
      'phrase',
      'Assess who and what a failure can affect.',
      'Incident',
      ['Start with blast-radius analysis'],
    ),
    item(
      'contributing factor',
      'phrase',
      'Condition that helped an incident happen without being the sole cause.',
      'Postmortem',
      ['Missing alerts were a contributing factor'],
    ),
    item(
      'latent defect',
      'phrase',
      'Bug present for a long time that only surfaces under rare conditions.',
      'Postmortem',
      ['It was a latent defect in retry logic'],
    ),
    item(
      'error amplification',
      'phrase',
      'Retries or fans-out that multiply load during a failure.',
      'Incident',
      ['Retries caused error amplification'],
    ),
    item(
      'saturation point',
      'phrase',
      'Load level where the system can no longer keep up.',
      'Alert',
      ['We hit the saturation point on the pool'],
    ),
    item(
      'symptom vs cause',
      'phrase',
      'Distinguish visible effects from the underlying fault.',
      'Incident',
      ['High CPU is a symptom, not the cause'],
    ),
    item(
      'mitigation efficacy',
      'phrase',
      'How well the temporary fix actually restored user outcomes.',
      'Incident',
      ['Measure mitigation efficacy with checkout success'],
    ),
    item(
      'residual risk',
      'phrase',
      'Risk that remains after mitigation or a partial fix.',
      'Postmortem',
      ['Document residual risk in the ticket'],
    ),
    item(
      'corrective action',
      'phrase',
      'Change intended to prevent recurrence, not just stop pain now.',
      'Postmortem',
      ['Assign owners to each corrective action'],
    ),
    item(
      'detection gap',
      'phrase',
      'Failure mode that users felt before monitors fired.',
      'Alert',
      ['Customer tweets exposed a detection gap'],
    ),
    item(
      'alert fatigue',
      'phrase',
      'Responders ignore pages because too many are noisy or low-value.',
      'On-call',
      ['Noise is creating alert fatigue'],
    ),
    item(
      'flaky signal',
      'phrase',
      'Metric or test that fails intermittently without a real regression.',
      'QA',
      ['Ignore that flaky signal for the rollback call'],
    ),
    item(
      'reproducibility',
      'word',
      'Ability to trigger the same failure reliably for debugging.',
      'QA',
      ['Low reproducibility is blocking the fix'],
    ),
    item('heisenbug', 'word', 'Defect that changes behavior when you try to observe it.', 'QA', [
      'Looks like a heisenbug under the debugger',
    ]),
    item(
      'regression window',
      'phrase',
      'Time range of commits where a fault was likely introduced.',
      'PR',
      ['Bisect within the regression window'],
    ),
    item(
      'fail-stop behavior',
      'phrase',
      'System halts clearly on fault instead of corrupting state quietly.',
      'Incident',
      ['Prefer fail-stop over silent corruption'],
    ),
    item(
      'graceful degradation',
      'phrase',
      'Continue serving a useful subset when parts fail.',
      'Incident',
      ['Cache miss path needs graceful degradation'],
    ),
    item(
      'post-incident review',
      'phrase',
      'Blameless analysis of what happened and what to change.',
      'Postmortem',
      ['Schedule the post-incident review within 72 hours'],
    ),
  ],
  'client-communication.json': [
    item(
      'expectation management',
      'phrase',
      'Keep stakeholders aligned on realistic dates and risk.',
      'Client',
      ['This is expectation management, not pessimism'],
    ),
    item(
      'executive summary',
      'phrase',
      'Short top-of-note for leaders: status, impact, ask.',
      'Client',
      ['Lead with an executive summary'],
    ),
    item(
      'risk disclosure',
      'phrase',
      'Transparent statement of what could go wrong and mitigation.',
      'Client',
      ['Include risk disclosure in the update'],
    ),
    item(
      'commitment language',
      'phrase',
      'Wording that creates a promise versus a forecast.',
      'Client',
      ['Avoid commitment language until Legal signs'],
    ),
    item(
      'forecast vs promise',
      'phrase',
      'Separate probable dates from contractually binding commitments.',
      'Client',
      ['That Friday is a forecast, not a promise'],
    ),
    item(
      'commercial sensitivity',
      'phrase',
      'Detail that must stay limited because of contracts or PR risk.',
      'Client',
      ['Redact commercially sensitive numbers'],
    ),
    item(
      'single source of truth',
      'phrase',
      'One agreed place stakeholders should trust for status.',
      'Docs',
      ['The status page is the single source of truth'],
    ),
    item(
      'stakeholder map',
      'phrase',
      'Who cares, who decides, and who must be informed.',
      'Client',
      ['Update the stakeholder map before the steerco'],
    ),
    item('escalation path', 'phrase', 'Named route for raising blocked decisions.', 'Client', [
      'Share the escalation path in the kickoff',
    ]),
    item(
      'acceptance criteria alignment',
      'phrase',
      'Confirm client and team share the same done definition.',
      'Client',
      ['We need acceptance criteria alignment first'],
    ),
    item(
      'change-control request',
      'phrase',
      'Formal ask to alter scope, date, or budget.',
      'Client',
      ['Raise a change-control request for the extra locale'],
    ),
    item(
      'go-live communications',
      'phrase',
      'Customer-facing messaging plan around a launch.',
      'Client',
      ['Draft go-live communications with Support'],
    ),
    item(
      'service credit discussion',
      'phrase',
      'Talk about contractual remedies after an SLA miss.',
      'Client',
      ['Keep service credit discussion with Account lead'],
    ),
    item(
      'goodwill gesture',
      'phrase',
      'Non-contractual concession to preserve the relationship.',
      'Client',
      ['Offer a goodwill gesture, not a new SLA'],
    ),
    item(
      'status cadence',
      'phrase',
      'Agreed rhythm for updates during delivery or incidents.',
      'Client',
      ['Hourly status cadence until recovered'],
    ),
    item(
      'decision memo',
      'phrase',
      'Short written rationale for a choice shared with stakeholders.',
      'Decision',
      ['Circulate a decision memo after the call'],
    ),
    item('non-goal', 'word', 'Explicitly out-of-scope outcome for this phase.', 'Client', [
      'Mobile offline mode is a non-goal for v1',
    ]),
    item(
      'success narrative',
      'phrase',
      'Story stakeholders will tell if the project works.',
      'Client',
      ['Align on the success narrative early'],
    ),
    item(
      'trust reset',
      'phrase',
      'Deliberate actions to rebuild confidence after a miss.',
      'Client',
      ['We need a trust reset after the slip'],
    ),
    item(
      'over-communication bias',
      'phrase',
      'Prefer more frequent clarity over silence when risk is high.',
      'Client',
      ['Use over-communication bias this week'],
    ),
  ],
};

function normalize(term) {
  return String(term)
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function item(term, type, meaning, context, patterns, alternatives = [], notes = []) {
  return {
    term,
    type,
    meaning,
    context,
    level: 'C1',
    patterns,
    example: [context, `${patterns[0] ?? term}.`],
    alternatives,
    notes,
  };
}

function main() {
  const existing = new Set();
  const files = readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const rows = JSON.parse(readFileSync(resolve(SOURCES_DIR, file), 'utf8'));
    for (const row of rows) existing.add(normalize(row.term));
  }

  let promoted = 0;
  let inserted = 0;
  let skippedDup = 0;

  for (const file of files) {
    const path = resolve(SOURCES_DIR, file);
    let rows = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      if (PROMOTE.has(normalize(row.term)) && row.level !== 'C1') {
        row.level = 'C1';
        promoted += 1;
      }
    }

    const additions = NEW_C1[file] ?? [];
    const fresh = [];
    for (const row of additions) {
      const norm = normalize(row.term);
      if (existing.has(norm)) {
        skippedDup += 1;
        continue;
      }
      existing.add(norm);
      fresh.push(row);
      inserted += 1;
    }
    if (fresh.length > 0) {
      rows = [...fresh, ...rows];
    }
    writeFileSync(path, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify({ promoted, inserted, skippedDup }, null, 2));
}

main();
