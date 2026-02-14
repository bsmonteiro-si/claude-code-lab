# Epic: Organization & Navigation

Give users the tools to find, group, and navigate their work so that the application scales gracefully from 5 templates to 500.

## Context

Every listing in the application is a flat, chronological list with no search, filtering, or categorization. The Home page is a placeholder. As users accumulate templates, pipelines, and execution history, the product becomes increasingly difficult to navigate. Finding a specific template means scrolling through an unsorted list. Understanding how a template has performed means scanning through a global execution log. There is no way to group related work or get a high-level view of recent activity.

This epic introduces the organizational primitives — search, tags, filtering, and a useful dashboard — that make the product usable at scale.

## Success Criteria

- A user can find any template or pipeline by searching for its name or description without scrolling.
- A user can tag templates and pipelines, then filter their lists by tag to focus on a specific project or domain.
- The Home page shows a personalized summary of recent activity that helps the user resume where they left off.
- A user can filter execution history by template, status, or date range to analyze the performance of a specific prompt.
- A user can see which pipelines reference a given template before editing or deleting it.

## Out of Scope

- Folders or nested hierarchies (tags provide sufficient lightweight organization for now)
- Full-text search within template content or execution outputs
- Saved searches or custom views
- Bulk operations (mass tag, mass delete)

---

## Feature 1: Search

### Problem

There is no search anywhere in the application. Users scroll through flat lists to find the template or pipeline they need. This is the single most common friction point in daily usage — every work session begins with hunting for the right starting point.

### Proposal

A search bar appears at the top of the Templates and Pipelines list views. As the user types, the list filters in real time to show only items whose name or description matches the query. Search is case-insensitive and supports partial matches (typing "summ" finds "Summarizer v2").

Optionally, a global search in the sidebar or header allows users to search across both templates and pipelines from anywhere in the app, with results grouped by type. This is a natural enhancement but not required for the first version — per-list search bars deliver most of the value.

### Scope: Small

A straightforward filtering mechanism on existing list views. The data is already loaded on the client; the simplest version is purely client-side filtering with no backend changes.

---

## Feature 2: Tags

### Problem

Users working across multiple projects or domains have no way to group related templates and pipelines. A chatbot project's templates sit next to a classifier project's templates sit next to experimental one-offs. There is no visual or logical separation.

### Proposal

Users can assign one or more freeform tags to any template or pipeline. Tags are created on the fly — type a tag name, press enter, and it exists. The template and pipeline list views show tags as small badges on each row and provide a tag filter: click a tag to show only items with that tag. Clicking multiple tags narrows the filter further.

Tags are managed inline — users add or remove tags from the list view or the edit form without navigating to a separate settings page. There is no predefined tag taxonomy; users create whatever tags make sense for their workflow.

### Scope: Medium

Introduces a new concept (tags) with its own data storage, a many-to-many relationship to templates and pipelines, and UI for creation, display, and filtering on multiple views.

---

## Feature 3: Home Dashboard

### Problem

The Home page displays a static welcome message. It provides no information and no entry points into the user's work. Every session starts with a manual navigation to Templates or Pipelines, followed by scrolling to find the relevant item. The most valuable screen real estate in the application is wasted.

### Proposal

Replace the placeholder with a dashboard that helps users resume work and stay oriented:

- **Recent templates** — the last 5-10 templates the user edited or executed, with one-click access to edit or execute.
- **Recent executions** — the last several execution results with status, template name, and a snippet of the output. Failed executions are visually distinct so users can quickly spot issues.
- **Quick stats** — simple counts (total templates, total pipelines, executions this week) that give a sense of activity.

The dashboard is read-only and requires no configuration. It assembles itself from existing data. The goal is not to be a comprehensive analytics page — it is a launch pad that gets the user into their work within seconds of opening the app.

### Scope: Medium

A new page layout that aggregates data from multiple existing entities. Requires new API queries (recent items, counts) and a frontend view that composes them into a dashboard. No new data models — everything is derived from existing records.

---

## Feature 4: Filtered Execution History

### Problem

Execution history is a single global list — every execution for every template, in reverse chronological order. If a user wants to understand how a specific template has performed over time, or find a failed execution from earlier today, they have to scan through everything else to locate it. The execution page becomes less useful the more it is used.

### Proposal

Add filtering controls to the execution history views:

- **By template** (or pipeline) — show only executions for a specific prompt. This is the most important filter; it turns the execution list from a global log into a per-template performance history.
- **By status** — show only completed, failed, or running executions. Useful for quickly finding errors.
- **By date range** — narrow results to a specific time window.

Filters are combinable: "show me all failed executions of the Summarizer template this week." The active filters are visible and clearable so users always know what they're looking at.

### Scope: Small-to-Medium

Adds filtering UI to existing list views and may require new query parameters on existing API endpoints. No new data models.

---

## Feature 5: Template Cross-References

### Problem

Pipelines reference templates by design — each pipeline step uses a template. But there is no reverse view. When a user wants to edit or delete a template, they have no way to know which pipelines depend on it. This creates anxiety around changes ("will I break something?") and leads to orphaned pipeline steps when templates are deleted.

### Proposal

Two improvements:

1. **Usage indicator on templates.** The template list and detail view shows how many pipelines reference each template. A "Used in 3 pipelines" badge gives immediate visibility into dependencies.

2. **Deletion guard.** When a user attempts to delete a template that is referenced by one or more pipelines, a confirmation dialog lists the affected pipelines by name. The user can proceed (the pipeline steps become orphaned, which is an existing behavior) or cancel. This replaces the current silent deletion with an informed decision.

### Scope: Small

A reverse lookup query and minor UI additions to existing views. No new data models — the relationship data already exists through pipeline steps.

---

## Suggested Build Order

```
Phase 1 (find things fast):
  Feature 1: Search
  Feature 4: Filtered Execution History

Phase 2 (organize and orient):
  Feature 2: Tags
  Feature 3: Home Dashboard
  Feature 5: Template Cross-References
```

Phase 1 delivers immediate relief — users can find what they need without scrolling. These are the "I need something right now" features. Phase 2 builds the organizational layer — users can group their work, get oriented on login, and understand dependencies. These are the "I want to stay organized over time" features.

Features within each phase can be built in parallel. Phase 2 benefits from Phase 1 being complete (the dashboard may incorporate search, tags integrate with search filtering) but is not strictly blocked.
