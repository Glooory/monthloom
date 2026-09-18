---

name: dev-loop
description: Implement a coding task in the main agent, then use a fresh independent subagent to review it. Fix findings in the main agent and re-review only when risk justifies the additional cost. Use only when the user explicitly requests dev-loop or this workflow.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Dev Loop

Use this skill for a lightweight implementation → independent review → fix workflow.

The main agent acts as both:

* **Coordinator**
* **Implementer / Fixer**

A fresh subagent acts as the **Reviewer**.

Default flow:

```text
User ↔ Main Agent
          ↓
     clarify task
          ↓
     write task.md
          ↓
   implement directly
          ↓
   Fresh Reviewer
          ↓
     ┌────┴────┐
   CLEAN     FINDINGS
     │           ↓
     │      Main Agent fixes
     │           ↓
     │       risk gate
     │       ┌───┴───┐
     │      low      high
     │       │         ↓
     │       │   Fresh Re-review
     │       │
     └───────┴────────────→ report
```

The goals are:

* preserve the main agent's existing understanding of the task;
* avoid repeating repository exploration in a fresh implementation agent;
* obtain an independent review from a clean context;
* use additional review rounds only when they are worth the time and tokens;
* avoid manual prompt copying between conversations.

This is intentionally a small workflow.

Do not expand it into a general development methodology.

# Core rule

The main agent implements the task itself.

Do **not** delegate normal implementation to a fresh subagent.

The main agent already participated in requirement clarification and therefore usually has the cheapest and most accurate implementation context.

Use fresh context where independence provides clear value:

```text
implementation → main agent
review         → fresh subagent
fix            → main agent
re-review      → fresh subagent only when justified
```

# Runtime workspace

Each dev-loop run has its own directory:

```text
.agent-work/<RUN_ID>/
└── task.md
```

Use a human-readable unique run ID:

```text
YYYYMMDD-HHmmss-<short-task-slug>
```

Example:

```text
.agent-work/20260918-154532-project-search/
└── task.md
```

Always pass the exact task path to a Reviewer.

Never ask a subagent to discover "the current task.md".

`.agent-work/` is runtime-only state and should be excluded by `.gitignore`:

```gitignore
.agent-work/
```

Never stage or commit files under `.agent-work/`.

Runtime files are **not automatically deleted**.

The user decides when to remove them.

# Starting a run

Before implementation:

1. Make sure the task is sufficiently clear.
2. Resolve material ambiguity with the user.
3. Generate a unique `RUN_ID`.
4. Create `.agent-work/<RUN_ID>/task.md`.
5. Record the current Git baseline.
6. Implement the task directly in the main agent.

Do not automatically:

* commit;
* stash;
* reset;
* clean;
* checkout user changes;
* rewrite Git history.

Preserve unrelated pre-existing work.

# Task contract

Write:

```text
.agent-work/<RUN_ID>/task.md
```

This file is the stable contract shared with independent Reviewers.

It should contain the **final agreed task**, not the conversation history.

Use:

````markdown
# Task

## Goal

<What needs to be accomplished.>

## Acceptance Criteria

- <Observable requirement>
- <Observable requirement>

## Constraints

- <Technical or scope constraint>

## Decisions

- <Relevant decision already agreed with the user>

## Out of Scope

- <Explicit exclusion, when useful>

## Baseline

HEAD: <git commit SHA>

Pre-existing working tree:

```text
<git status --short output, or "clean">
````

````

Keep it concise.

Include only information needed to implement and review the task correctly.

Do not include:

- rejected alternatives;
- exploratory conversation;
- implementation speculation;
- chain-of-thought or reasoning transcripts;
- unnecessary historical context.

# Implementation

After writing `task.md`, implement the task directly in the main agent.

Follow the repository's own instructions and conventions.

During implementation:

- inspect only the repository areas needed for the task;
- preserve unrelated user changes;
- keep changes scoped to the agreed task;
- run relevant tests or checks when practical;
- do not commit unless the user explicitly requests it.

Do not create additional handoff documents.

The working tree is the implementation artifact.

# First independent review

After implementation and relevant checks complete, launch **one fresh Reviewer subagent** using the host's native subagent mechanism.

The Reviewer must start from clean conversational context.

Do not pass:

- the main agent's implementation reasoning;
- implementation summaries unless strictly necessary;
- speculative concerns from the main agent;
- previous review findings.

Give the Reviewer an instruction equivalent to:

```text
Read:

.agent-work/<RUN_ID>/task.md

and the repository's own instructions.

Independently review the current implementation against the task contract.

Inspect the relevant diff, surrounding code, and tests as needed.

Focus on concrete defects, regressions, missing requirements, and meaningful risks.

Do not modify production files.

Do not produce preference-only style comments.

Return:

RESULT: CLEAN

if there are no actionable findings.

Otherwise return structured actionable findings.
````

# Reviewer isolation

Every Reviewer must be fresh.

Never reuse the main agent as the independent Reviewer.

Never resume a previous Reviewer for a later independent review.

Use read-only permissions or a read-only sandbox when supported.

If enforced read-only mode is unavailable, explicitly instruct the Reviewer not to modify files.

The Reviewer should receive the smallest sufficient context:

```text
task contract
+
repository instructions
+
current implementation
+
relevant diff
```

It does not need the full user conversation.

# Review scope

The Reviewer independently answers:

> Does the current implementation satisfy the task contract without introducing actionable defects?

Review for:

* unmet acceptance criteria;
* functional bugs;
* regressions;
* edge cases;
* incorrect error handling;
* meaningful missing test coverage;
* security risks when relevant;
* concurrency or data-integrity risks when relevant;
* performance problems when relevant;
* accidental scope expansion;
* repository convention violations that materially affect correctness or maintainability.

Do not report findings merely to produce feedback.

Do not report preference-only style differences.

Do not perform an unrelated repository-wide audit.

Do not report unrelated pre-existing defects unless:

* this implementation changed or worsened them; or
* they directly prevent the task from working correctly.

# Reviewer output

For a clean review:

```text
RESULT: CLEAN

No actionable findings.
```

For findings:

```markdown
RESULT: FINDINGS

## Finding 1

Severity: <critical | high | medium | low>

Location:
<file and line/range when practical>

Issue:
<Concrete defect.>

Evidence:
<Why this is a real problem based on the task and implementation.>

Suggested direction:
<Concise direction for addressing it.>
```

Findings must be:

* concrete;
* actionable;
* evidence-based;
* relevant.

`low` still means a real defect, not a stylistic preference.

# Handling findings

The main agent receives the Reviewer findings directly.

Do not create a `review.md` handoff file by default.

For every finding:

1. validate it against the actual code;
2. accept it only if it is correct;
3. fix valid findings directly;
4. leave correct code unchanged when a finding is invalid;
5. run relevant tests/checks after fixing.

Do not blindly follow Reviewer suggestions.

The Reviewer identifies problems.

The main agent retains responsibility for choosing the appropriate fix.

# Re-review risk gate

A second fresh review is **not automatic**.

After fixing findings, decide whether another independent review is worth its cost.

Perform a fresh re-review when one or more of these conditions apply:

* a `critical` or `high` severity finding was fixed;
* the fix materially changed the original implementation approach;
* the fix spans multiple components or introduces substantial new logic;
* the finding involves security, authentication, authorization, concurrency, transactions, persistence, data integrity, or similarly high-risk behavior;
* the main agent rejected or substantially disagreed with a Reviewer finding and independent verification would resolve the uncertainty;
* the fix caused additional failures or unexpected behavior;
* meaningful verification cannot be achieved through available tests/checks;
* the user explicitly requested strict or repeated independent review.

A fresh re-review is normally unnecessary when all findings are:

* localized;
* well understood;
* low or ordinary medium risk;
* fixed with small scoped changes;
* directly verified by relevant tests/checks.

Examples that normally do **not** justify another fresh Reviewer:

* adding a missing null guard;
* fixing an obvious conditional;
* correcting a localized mapping error;
* adding a missing test case;
* fixing a small validation mistake whose behavior is directly testable.

The goal is not to maximize the number of reviews.

The goal is to spend independent-review cost where it materially improves confidence.

# Re-review

When the risk gate requires re-review, launch a **brand-new fresh Reviewer**.

Do not resume the previous Reviewer.

Do not pass the previous review findings.

Do not ask only:

> Were the previous findings fixed?

Instead ask the new Reviewer to independently evaluate the **current implementation against `task.md` from scratch**.

Use an instruction equivalent to:

```text
Read:

.agent-work/<RUN_ID>/task.md

and the repository's own instructions.

Independently review the current implementation against the task contract.

This is a fresh review.

Do not rely on previous review findings or implementation reasoning.

Inspect the relevant diff, surrounding code, and tests as needed.

Do not modify production files.

Return RESULT: CLEAN or structured actionable findings.
```

This allows re-review to detect:

* unresolved defects;
* incorrectly rejected findings;
* regressions introduced by fixes;
* defects missed in the previous review.

# Loop limit

Default dev-loop is **not** an open-ended review loop.

The normal maximum is:

```text
implementation
→ fresh review
→ fix
→ optional fresh re-review
```

If the optional fresh re-review still produces actionable findings:

1. validate and fix what is clearly safe to fix;
2. run relevant tests/checks;
3. stop automatic fresh-review cycling;
4. report the remaining state to the user.

Do not automatically launch Reviewer after Reviewer.

The user can explicitly request another review if additional assurance is desired.

# Strict mode

If the user explicitly requests:

* `dev-loop strict`;
* strict review;
* repeated independent verification;
* or equivalent wording;

use the same architecture but require a fresh re-review after every fix round.

Even in strict mode:

* implementation stays in the main agent;
* fixing stays in the main agent;
* Reviewers remain fresh;
* automatic execution stops after at most two fix/review cycles.

Strict mode should be exceptional rather than the default.

# Escalation

Stop automatic execution and return control to the user when:

* requirements become materially ambiguous;
* a new product decision is required;
* a significant unagreed architecture decision is required;
* the repository enters an unsafe or conflicted state;
* continuing safely requires destructive Git operations;
* the Reviewer unexpectedly modifies production code;
* tests expose a significant unrelated failure that prevents meaningful verification;
* isolated Reviewer subagents are unavailable.

Do not invent decisions merely to finish the workflow.

# Concurrency

Separate run directories prevent coordination-file collisions.

They do **not** make simultaneous writes to one working tree safe.

If multiple dev-loop runs operate against the same checkout:

* do not allow their implementation/fix phases to write concurrently.

True concurrent implementation requires isolated worktrees or equivalent isolated workspaces.

# Token and time discipline

Efficiency is a primary design goal.

Do not:

* delegate implementation just to create role separation;
* pass full conversation history to Reviewers;
* create redundant planning or review documents;
* launch specialist agents without a concrete need;
* automatically re-review every small fix;
* recursively invoke `dev-loop` from a subagent;
* perform broad repository exploration unrelated to the task.

Prefer:

```text
main conversation
→ requirements + implementation + fixes

task.md
→ stable reviewer contract

fresh subagent
→ independent review only
```

One fresh Reviewer is the normal case.

Additional fresh Reviewers require a reason.

# Completion

The workflow is complete when either:

1. the first Reviewer returns `RESULT: CLEAN`; or
2. valid findings were fixed, relevant checks pass, and the risk gate does not require re-review; or
3. a required fresh re-review returns `RESULT: CLEAN`.

After completion, report concisely:

* what was implemented;
* the independent review result;
* what findings were fixed, if any;
* whether a re-review was performed and why;
* relevant tests/checks and their results;
* any verification limitations or residual risks;
* the run directory.

Do not automatically commit.

Do not automatically delete `.agent-work/<RUN_ID>/`.

Leave both code and runtime task file available for human inspection.
