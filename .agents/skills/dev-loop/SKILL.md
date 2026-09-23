---
name: dev-loop
description: Use when the user explicitly requests dev-loop for a Y-Guard coding task, with independent review and a user decision before fixing findings.
---

# Dev Loop

Use this opt-in workflow to implement a coding task in the main agent, obtain one independent review, and let the user decide which findings to fix. Invocation of this skill is the user's request for the subagent review described in `AGENTS.md`. Ordinary tasks continue to follow the repository's proportional workflow.

## Roles and limits

- The main agent clarifies requirements, implements, verifies, and fixes findings the user selects. Do not delegate implementation or fixes merely to separate roles.
- A fresh subagent reviews independently, without editing files. Use an enforced read-only mode when available; otherwise explicitly instruct the reviewer not to edit.
- The normal flow is implementation → review → user decision → fix → user decision on re-review. One independent review is required; no second round is required by default.
- Follow `AGENTS.md` and select relevant guides through `docs/agents/README.md`. This skill does not replace their implementation, review, source, or verification rules.

## Start a run

1. Resolve material ambiguity before implementation. For a clear task, proceed without extra planning.
2. Create a unique `.agent-work/YYYYMMDD-HHmmss-short-slug/task.md`. The `.agent-work/` directory is ignored by Git and contains only local runtime state.
3. Record the agreed goal, observable acceptance criteria, relevant constraints and decisions, the current `HEAD` SHA, and the pre-existing `git status --short` output (or `clean`). Add out-of-scope items only when they help prevent a real misunderstanding. Keep the contract concise; do not copy the conversation or implementation reasoning.
4. Implement in the main agent. Preserve unrelated work. Run the smallest relevant verification required by the repository. Do not commit, stash, reset, clean, or switch branches unless separately requested.

Never stage or commit `.agent-work/`. Do not delete run files automatically; leave their removal to the user. Pass the exact `task.md` path to each reviewer.

## Independent review

After implementation and verification, start one **fresh** reviewer subagent with clean conversational context. Do not pass implementation reasoning, suspected issues, or earlier findings. Give it the exact task path and this instruction:

> Read the task contract and the repository instructions. Independently review the current working tree against the contract. Inspect the relevant diff, surrounding code, and tests as needed. Follow the repository's review guidance, including `docs/agents/code-review.md`. Report only concrete, actionable defects or unmet criteria; avoid style preferences and unrelated pre-existing issues. Do not modify files. Return `RESULT: CLEAN` with no actionable findings, or `RESULT: FINDINGS` with each finding's severity, location, issue, evidence, and suggested direction.

If isolated reviewer subagents are unavailable, report that the independent review could not be completed. Do not present a self-review as independent.

## Handle findings

Before changing code in response to findings, validate each one against the code and task contract. Show the user **every finding**, including ones the main agent considers invalid or unnecessary. For each, give the evidence, likely impact, and a concise recommendation to fix or leave it. Ask the user which findings to fix, and wait for an explicit decision. A missing response is not approval. Do not automatically fix a finding merely because the reviewer or main agent considers it valid.

After the user decides, fix only the selected findings in the main agent and run relevant checks. If a requested fix would be unsafe or unsupported by the evidence, explain why before editing. If the user chooses to leave a finding, preserve that decision for this run and report any resulting limitation. Ask again if later evidence materially changes the decision.

In normal mode, after fixes and checks, tell the user whether another independent review would materially improve confidence, with a brief reason, and ask them to choose. Recommend re-review for a critical or high severity fix; security, authorization, concurrency, persistence, or data integrity changes; a material change in approach or multiple components; unexpected failures; insufficient verification; or a substantial unresolved disagreement with the reviewer. A small, directly verified fix usually needs no re-review. Do not launch another reviewer without the user's decision.

If the user chooses re-review, use a **new** reviewer subagent. Give it the task contract and current working tree, and ask for a full independent review from scratch. Do not resume the previous reviewer or pass its findings. Apply the same user decision gate to any new findings. Further rounds also require an explicit user decision.

If the user explicitly requests `dev-loop strict` or repeated independent verification, that request authorizes a fresh re-review after each fix round, up to two fix/review cycles. Still ask the user which findings to fix in each round. If that limit is reached with further findings, present them to the user and stop automatic review cycling; make only the fixes the user selects. The user may request another review separately.

## Stop and report

Stop automatic execution when requirements need a new product or architecture decision, the working tree becomes unsafe or conflicted, continuing requires destructive Git operations, a reviewer edits files, or a significant unrelated failure prevents meaningful verification. Do not invent a decision just to complete the loop.

On completion, report the implementation, review result, the user's finding and re-review decisions, fixes, verification, remaining risks, and the run directory. Leave the implementation and runtime task file available for inspection.
