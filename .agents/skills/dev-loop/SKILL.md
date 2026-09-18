---

name: dev-loop
description: Orchestrate a clean-context implementation, independent review, fix, and re-review workflow using subagents. Use only when the user explicitly asks to use dev-loop or explicitly requests this isolated subagent workflow. Do not invoke automatically for ordinary coding tasks.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Dev Loop

Use this skill to coordinate an implementation through isolated subagents.

The main agent acts as the **Coordinator**.

The normal flow is:

```text
Coordinator
    ↓
Fresh Implementer
    ↓
Fresh Reviewer
    ↓
Implementer/Fixer
    ↓
Fresh Reviewer
    ↓
Coordinator reports result
```

The purpose of this workflow is:

* keep the main conversation focused on requirements and decisions;
* isolate implementation from review;
* give every review pass a fresh context;
* avoid manual prompt copying between conversations;
* keep runtime coordination lightweight;
* avoid unnecessary agent and token overhead.

This is intentionally a small workflow. Do not expand it into a larger development methodology unless the user explicitly asks for that.

# Core principles

## Coordinator owns orchestration

The main agent is the Coordinator.

The Coordinator should normally:

* clarify requirements with the user;
* define the task contract;
* create and manage runtime handoff files;
* launch subagents;
* decide whether another fix/review cycle is needed;
* stop when escalation is required;
* report the final result to the user.

The Coordinator should normally **not implement production code itself**.

The only files the Coordinator should directly modify as part of this workflow are runtime coordination files under `.agent-work/`.

If subagents are unavailable, do not silently perform all roles in the Coordinator context. Tell the user that isolated execution is unavailable.

## Use fresh context where independence matters

The initial Implementer must be a fresh subagent.

Every Reviewer must be a **new fresh subagent**.

A Reviewer must not inherit the Implementer's conversation or reasoning.

A Fixer does not need fresh context by default.

Prefer resuming the original Implementer when the host supports resuming a subagent. This preserves implementation context and reduces repeated repository exploration.

If resuming is unavailable, launch a fresh Fixer.

## Run agents serially

Do not run the Implementer, Fixer, and Reviewer concurrently.

They operate on the same effective working tree and must run in this order:

```text
implement → review → fix → review
```

A later stage starts only after the previous stage has fully completed.

Prefer having all agents operate on the same project working tree.

Do not intentionally create separate branches or worktrees for this workflow unless the host requires them and can reliably integrate the result back into the Coordinator's working tree before the next stage.

The Reviewer must always inspect the same final implementation that the Coordinator sees.

# Runtime files

Use:

```text
.agent-work/
├── task.md
└── review.md
```

`.agent-work/` is runtime-only local state and must be excluded by the repository's `.gitignore`.

Never stage or commit files under `.agent-work/`.

Do not create additional workflow files unless they are genuinely required.

In particular, do not create files such as:

```text
implementation.md
fix-plan.md
verification.md
state.json
final-report.md
review-round-1.md
review-round-2.md
```

The repository itself is the source of truth for the implementation.

`task.md` is the source of truth for the requested task.

`review.md` is the source of truth for the latest actionable review findings.

# Starting a run

Before launching an Implementer:

1. Make sure the user's requirements are sufficiently clear.
2. Resolve material ambiguity with the user before implementation.
3. Confirm the project is inside a Git repository.
4. Check that the repository is not in an unresolved merge, rebase, cherry-pick, or similar conflicted state.
5. Create `.agent-work/` if necessary.
6. Remove a stale `.agent-work/review.md` from a previous run.
7. Create a fresh `.agent-work/task.md`.

Do not automatically:

* commit;
* stash;
* reset;
* checkout files;
* clean the working tree;
* rewrite Git history.

Preserve all pre-existing user changes.

# Task contract

The Coordinator writes `.agent-work/task.md`.

Keep it concise.

It represents the final agreed task, not the full conversation history.

Use this structure:

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

- <Anything explicitly excluded, when applicable>

## Baseline

HEAD: <git commit SHA>

Pre-existing working tree:

```text
<output equivalent to git status --short, or "clean">
````

````

Only include confirmed decisions.

Do not copy exploratory discussion, rejected alternatives, implementation speculation, or unnecessary chat history into `task.md`.

Record the current `HEAD` before implementation starts.

Record pre-existing working-tree changes so later agents know that unrelated changes may already exist.

Pre-existing changes belong to the user and must be preserved.

# Implementer

Launch a fresh implementation subagent using the host's native subagent mechanism.

Give it a short instruction equivalent to:

```text
Read .agent-work/task.md and the repository's own instructions.

Inspect the repository and implement the task.

Preserve unrelated pre-existing changes.
Keep the implementation scoped to the task.
Do not commit, stash, reset, or rewrite existing user changes.

Run the relevant tests or checks when practical.

When finished, return a concise summary of:
- what changed;
- tests/checks run and their results;
- any blockers or unresolved concerns.
````

Do not provide the Implementer with a long restatement of the conversation when `task.md` already contains the required information.

Let the Implementer inspect the repository itself.

Do not require an `implementation.md` handoff file.

The implementation itself lives in the working tree.

# After implementation

When the Implementer finishes:

1. Confirm the working tree is accessible to the Coordinator.
2. Confirm `HEAD` has not unexpectedly changed because the subagent committed.
3. Preserve the Implementer's handle/session if the host supports later resumption.
4. Remove `.agent-work/review.md` if it exists.
5. Launch a fresh Reviewer.

If the Implementer unexpectedly committed, rewrote history, destroyed pre-existing changes, or otherwise changed repository state in a way that cannot be safely interpreted, stop the automatic loop and report the problem to the user.

Do not automatically rewrite history to repair it.

# Reviewer

Every review pass must use a **new fresh Reviewer**.

Never resume a previous Reviewer.

Use read-only permissions or a read-only sandbox when the host supports them.

If the host does not support enforced read-only subagents, explicitly instruct the Reviewer not to modify files.

The Reviewer must read:

* `.agent-work/task.md`;
* repository-level instructions and conventions;
* the current implementation;
* the relevant diff and surrounding code;
* relevant tests when useful.

The Reviewer must **not read `.agent-work/review.md` from an earlier review pass**.

Delete the previous `review.md` before launching a new Reviewer.

This prevents anchoring the next Reviewer on earlier findings.

The Reviewer must independently answer:

> Does the current implementation correctly satisfy the task contract without introducing actionable defects?

The review should consider:

* acceptance criteria;
* functional correctness;
* regressions;
* edge cases;
* error handling;
* relevant test coverage;
* security implications when relevant;
* performance implications when relevant;
* accidental scope expansion;
* violations of established repository conventions that materially affect correctness or maintainability.

Do not report preference-only style comments.

Do not create findings merely to produce feedback.

Do not report unrelated pre-existing problems unless:

* the current implementation changed or worsened them; or
* they directly prevent the task from satisfying its acceptance criteria.

The Reviewer must not fix the code.

# Reviewer output contract

The Reviewer should return one of two outcomes.

For a clean review:

```text
RESULT: CLEAN

No actionable findings.
```

Optional concise verification notes may follow.

For findings:

```markdown
RESULT: FINDINGS

## Finding 1

Severity: <critical | high | medium | low>
Location: <file and line/range when practical>

Issue:
<Concrete defect.>

Evidence:
<Why this is a real problem based on the task and code.>

Suggested direction:
<Concise direction for addressing it, without prescribing unnecessary implementation details.>

## Finding 2

...
```

Findings must be:

* concrete;
* actionable;
* evidence-based;
* relevant to the task or regression risk.

`low` severity should still represent a real defect, not a stylistic preference.

# Review handoff

The Reviewer itself should not write `.agent-work/review.md`.

After the Reviewer returns, the Coordinator writes the result to:

```text
.agent-work/review.md
```

This allows the Reviewer to remain truly read-only.

If the review is clean, the implementation passes the review stage.

If actionable findings exist, proceed to fixing.

# Fixer

Prefer resuming the original Implementer if the host supports it.

This is the normal path because the Implementer already understands the implementation context.

Give it an instruction equivalent to:

```text
Read:

- .agent-work/task.md
- .agent-work/review.md

Validate every review finding against the actual code.

Do not blindly accept reviewer suggestions.

Fix findings that are valid.
If a finding is invalid, explain why instead of changing correct code.

Keep changes scoped to the original task and the validated findings.
Preserve unrelated user changes.
Do not commit, stash, reset, or rewrite Git history.

Run relevant tests/checks after fixing.

Return a concise summary of:
- findings fixed;
- findings rejected and why;
- tests/checks run and their results;
- remaining blockers.
```

If the original Implementer cannot be resumed, start a fresh Fixer with the same instructions.

A fresh Fixer may read both `task.md` and `review.md`.

# When to use a new Fixer

Normally reuse the Implementer.

Prefer a fresh Fixer when the review shows that the original implementation approach itself is fundamentally flawed rather than requiring localized corrections.

Examples include:

* the chosen architecture cannot satisfy the requirement;
* the implementation misunderstood a core requirement;
* fixing the implementation would effectively require rebuilding it;
* the Implementer is stuck repeating the same invalid approach.

The Coordinator should not replace the Implementer merely because a normal bug was found.

# Re-review

After fixing:

1. Remove `.agent-work/review.md`.
2. Launch a brand-new fresh Reviewer.
3. Perform a complete independent review of the current implementation.

The new Reviewer must not be told to merely verify previous findings.

It should review the current implementation against `task.md` from scratch.

This allows it to detect both:

* unresolved previous issues;
* new regressions introduced by the fix.

# Iteration limit

Do not create an unlimited review/fix loop.

Allow at most:

```text
initial implementation
→ review
→ fix #1
→ fresh review
→ fix #2
→ fresh review
```

That means at most **two fix cycles** after the initial implementation.

If actionable findings still remain after the final allowed review, stop.

Do not continue automatically.

The Coordinator should report the remaining findings to the user.

# Escalation conditions

Stop the automatic workflow and return control to the user when:

* requirements become materially ambiguous;
* a product or architecture decision is required that was not previously agreed;
* the implementation direction needs substantial redesign outside the existing task contract;
* the allowed fix cycles are exhausted;
* the repository enters an unsafe or conflicted Git state;
* a subagent cannot access the required working tree;
* isolated subagents are unavailable;
* a Reviewer unexpectedly modifies production files;
* tests expose a significant unrelated failure that prevents safe verification;
* continuing would require destructive Git operations.

Do not guess through these situations merely to complete the loop.

# Reviewer write protection

When read-only enforcement is unavailable, the Coordinator should compare repository state before and after review.

If the Reviewer unexpectedly changed tracked or untracked project files, stop and report it.

Do not silently keep Reviewer-authored production changes.

Do not automatically reset those changes if doing so could destroy user work.

# Token and context discipline

Keep this workflow lightweight.

Do not pass full conversation history to every subagent.

Use:

```text
requirements → .agent-work/task.md
implementation → working tree / git diff
review findings → .agent-work/review.md
```

Do not ask subagents to generate redundant summaries or planning documents.

Do not recursively invoke `dev-loop` inside a subagent.

Do not create additional specialist agents unless the task genuinely requires one and the user has agreed to the additional complexity.

Reviewer agents should inspect the parts of the repository necessary to establish correctness, not perform unrelated repository-wide audits.

# Completion

The workflow succeeds when a fresh Reviewer returns:

```text
RESULT: CLEAN
```

After success, the Coordinator reports to the user:

* what was implemented;
* how many review/fix cycles occurred;
* relevant tests/checks and their results;
* any verification limitations or residual risks.

Keep the final report concise.

Do not automatically commit the implementation.

Leave the resulting working tree for the user to inspect and commit.

The runtime files under `.agent-work/` may remain until the next run. They are overwritten or cleaned when the next `dev-loop` starts.
