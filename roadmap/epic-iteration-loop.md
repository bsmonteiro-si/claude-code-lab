# Epic: Prompt Iteration Loop

Speed up the core prompt engineering workflow — tweak, re-run, compare — so that iterating on a prompt takes seconds instead of minutes.

## Context

Today, changing a prompt and comparing results requires navigating between multiple pages, re-filling variables manually, and mentally holding previous outputs while looking at new ones. Each iteration cycle takes 5+ minutes of mechanical effort. This epic targets that friction directly.

## Success Criteria

- A user can modify a prompt, re-execute it with the same inputs, and compare the new output against the previous one without leaving the screen.
- A user can tune model parameters (temperature, max_tokens) from the UI without code changes.
- A user can set a system prompt independently of the user prompt and iterate on each separately.

## Out of Scope

- Automated evaluation or scoring of outputs (future epic)
- Batch execution across multiple input sets
- Prompt version branching or forking

---

## Feature 1: Model Parameters

### Problem

Temperature, max_tokens, and top_p are hardcoded. Users cannot tune generation behavior at all, which makes it impossible to control output style, length, or determinism. A prompt engineer needs to experiment with these settings as part of their normal workflow — a creative writing prompt at temperature 0.9 behaves very differently than at 0.2.

### Proposal

Add a collapsible "Model Parameters" section to the template and pipeline execution screens. Users set temperature, max_tokens, and top_p via sliders and inputs. These values are passed through to the provider at execution time and recorded on the execution record for reproducibility.

When parameters are not explicitly set, sensible defaults are used. Execution history displays the parameters used for each run so users can trace which settings produced which output.

### Scope: Medium

Touches the provider interface, both provider implementations, the execution data model, and the execution UIs for both templates and pipelines. Requires a migration.

---

## Feature 2: System Prompt

### Problem

Every LLM call is sent as a single user message. There is no way to set system-level instructions — role definitions, output format constraints, behavioral rules. Users end up embedding system instructions inside the template content, which conflates two concerns and makes it harder to iterate on the actual user-facing prompt independently.

### Proposal

Add a system prompt field to templates, versioned alongside the content. The template form shows two text areas: "System Prompt" and "Content" (the user prompt). Providers pass the system prompt through their respective SDK system parameter.

A change to the system prompt alone creates a new template version, just like a content change does today. This lets users iterate on role framing without touching the user prompt, and vice versa, with full version history for both.

### Scope: Medium

Extends the template versioning model, the provider interface, both provider implementations, and the template creation/editing UI. Requires a migration.

### Dependency

None. Can be built in parallel with Feature 1.

---

## Feature 3: Re-run With Same Inputs

### Problem

After executing a template, tweaking the prompt requires: close the executor, edit the template, save, reopen the executor, re-select provider and model, re-paste all variables, execute. Most of that is mechanical repetition that breaks flow.

### Proposal

Two improvements:

1. **Pre-filled re-execution.** After an execution completes, a "Re-run" button resets the output but keeps all inputs (provider, model, variables, parameters) pre-filled. The user only changes what they want to change.

2. **Inline prompt editing.** The executor shows the current template content in an editable area. Editing and executing from within the executor creates a new template version automatically, so the user never has to leave the screen to iterate.

Together, these turn the executor into the primary iteration surface rather than a one-shot execution tool.

### Scope: Small-to-Medium

Primarily a frontend change. The inline editing leverages the existing template update flow — the backend already creates a new version when content changes.

### Dependency

None. Can be built independently.

---

## Feature 4: Side-by-Side Comparison

### Problem

The most common question during prompt iteration is "did this change make it better?" Today, comparing two outputs requires navigating to the execution history, mentally holding one result, scrolling to find the other. There is no way to view two execution outputs next to each other.

### Proposal

A comparison view where users place two execution outputs side by side. Two entry points:

1. **From execution history.** Users select two executions and click "Compare." A split-pane view shows both outputs alongside their metadata — template version, provider, model, variables, and parameters.

2. **From the executor.** After a second execution, a "Compare with previous" toggle shows the current and previous output in columns, so the user sees the impact of their last change immediately.

The comparison view highlights the differences in inputs (which variable changed, which parameter was tweaked) alongside the differences in output, making it easy to attribute output changes to specific input changes.

### Scope: Medium

A new comparison component, selection mechanics on the execution history page, and state management in the executor to track the previous result. May benefit from a filtered execution listing endpoint on the backend.

### Dependency

More useful if Feature 1 (Model Parameters) and Feature 2 (System Prompt) land first, since comparison becomes richer when there are more dimensions to vary. But not blocked — it works with current execution data.

---

## Feature 5: Version Diff

### Problem

The system already versions template content behind the scenes, but users have no way to see it. There is no visibility into what changed between prompt iterations, making it hard to understand editing history or identify which change caused an improvement.

### Proposal

A "Version History" panel accessible from the template detail or edit view. It lists all versions with timestamps and version numbers. Selecting two versions shows a text diff of the content and system prompt. Users can also restore a previous version, which creates a new version with that content — preserving the full history without destructive overwrites.

This gives users a timeline of their prompt evolution and the ability to backtrack when a change makes things worse.

### Scope: Small-to-Medium

The version data and retrieval already exist on the backend. This is primarily a frontend feature — a new component for version listing, a diff rendering view, and integration into the template editing flow.

### Dependency

Ideally lands after Feature 2 (System Prompt) so the diff includes system prompt changes. But not blocked.

---

## Suggested Build Order

```
Phase 1 (unblock tuning):
  Feature 1: Model Parameters
  Feature 2: System Prompt
  Feature 3: Re-run With Same Inputs

Phase 2 (enable comparison):
  Feature 4: Side-by-Side Comparison
  Feature 5: Version Diff
```

Phase 1 features are independent and can be built in parallel by different engineers. Phase 2 features benefit from Phase 1 being complete but are not strictly blocked.
