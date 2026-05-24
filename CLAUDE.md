# CLAUDE.md

Project guidelines for Claude Code in this repository. Read this file at the start of every session before doing non-trivial work.

---

## Mindset

Four core principles that govern every interaction.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State assumptions explicitly. If uncertain, ask rather than guess.
- Present multiple interpretations when ambiguity exists; don't pick silently.
- Push back when warranted: if a simpler approach exists, say so.
- Stop when confused. Name what's unclear and ask for clarification.

### 2. Simplicity First

The minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.
- **When "elegance" and "simplicity" conflict, simplicity wins.** Don't add abstractions to make code "cleaner" if the simple version works.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

- Transform imperative tasks into verifiable goals: "fix the bug" → "write a test that reproduces it, then make it pass".
- Never mark a task complete without proving it works.
- Diff behavior between baseline and your changes when relevant.
- Run tests, check logs, demonstrate correctness before saying "done".

### Additional principles

- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards. *(But fix root cause surgically — see Surgical Changes.)*
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Workflow Orchestration

### 1. Plan Mode by Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways during execution, STOP and re-plan immediately — don't keep pushing.
- Use plan mode for verification steps too, not just building.
- Write detailed specs upfront to reduce ambiguity.

### 2. Subagent Strategy

- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute via subagents.
- One task per subagent for focused execution.

### 3. Verification Before Done

- Never mark a task complete without proving it works.
- Diff behavior between baseline and your changes when relevant.
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### 4. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- **Skip this for simple, obvious fixes** — don't over-engineer.
- Challenge your own work before presenting it.
- **Reminder:** simplicity always wins over elegance when they conflict (see Simplicity First).

### 5. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Zero context switching required from the user.
- Go fix failing CI tests without being told how.

---

## Task Management

This project uses two files under `.claude/` to manage plans and tasks.

| File | Purpose |
|------|---------|
| `./.claude/plans/<category>.md` | Detailed plan per category (description, design, tradeoffs, decisions) |
| `./.claude/tasks/todo.md` | Active task tracker, organized by category, with `Last updated:` per section |

### Workflow

1. **Plan First.** When given a non-trivial task, write the plan to `./.claude/plans/<category>.md`. Create the file if it doesn't exist.
2. **Tasks.** Add or update the matching `## <Category>` section in `./.claude/tasks/todo.md` with tasks broken down. Each task gets a `verify:` criterion.
3. **Verify Plan.** Show the user the plan and tasks before starting implementation.
4. **Track Progress.** Mark tasks `[x]` as completed.
5. **Update Date.** Bump `Last updated:` in the category section whenever the plan changes. Routine task completion does NOT bump the date — only plan-level modifications do.
6. **Explain Changes.** High-level summary at each step.
7. **Document Results.** When all tasks in a category are done, move that section to `## Completed Plans` in `todo.md` with a Review block (result + notes).

### Category hygiene

- **Reuse existing categories.** If the user mentions something that touches an existing category (e.g., "agregamos validación al login" → that's `Auth`), update the existing section. Don't create duplicates like `Auth`, `Authentication`, `Login` for the same thing.
- **Ask before inventing.** If unsure whether something fits an existing category or needs a new one, ask the user.
- **Keep granularity reasonable.** A small project might have 3-4 categories; a large one 8-12. If you're past 12, you're probably too granular — group related ones.

### Before starting non-trivial work

Always read `./.claude/tasks/todo.md` first. Don't restart from zero when the file already has project state. Read the relevant `./.claude/plans/<category>.md` if you're working on a specific area.
