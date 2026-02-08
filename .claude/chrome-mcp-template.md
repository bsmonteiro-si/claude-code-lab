# Claude for Chrome — MCP Optimization Template

Copy the sections below into your project's CLAUDE.md and customize the "App Structure" section for your specific application.

---

## Speed Principles

- NEVER take screenshots unless explicitly requested by the user
- Minimize round trips: every tool call is a full LLM-to-browser round trip — fewer calls = faster
- Trust actions succeeded — do not verify after every click unless something seems wrong
- Only enable `--chrome` when needed — Chrome tools consume ~32K tokens of schema just by being loaded. Use `claude /chrome` to enable mid-session instead of always-on.

## Element Interaction

- Use `find` for targeted element lookup — one call instead of scanning the full accessibility tree
- Click/interact using `ref`, not coordinates — avoids the screenshot-then-calculate cycle
- For known pages (this app), skip `read_page` entirely — go straight to `find` or `javascript_tool`

## Batch Operations with `javascript_tool`

- Prefer `javascript_tool` for multi-step DOM interactions — one JS call replaces 5+ round trips
- Use it for: filling multiple form fields, reading multiple values, click-then-verify sequences
- React/Vue/Angular forms need event dispatch after setting values:
  ```javascript
  el.value = 'text';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  ```
- For recurring operations, inject a helper library once at session start:
  ```javascript
  window.__helpers = {
    fill: (sel, val) => {
      const el = document.querySelector(sel);
      if (el) { el.value = val; el.dispatchEvent(new Event('input', {bubbles: true})); }
    },
    read: (sels) => Object.fromEntries(
      Object.entries(sels).map(([k, sel]) => [k, document.querySelector(sel)?.textContent?.trim()])
    )
  };
  ```
  Then call: `__helpers.fill('#name', 'John')` in subsequent calls.

## Scoped `read_page`

- When `read_page` is needed, always scope it:
  - `filter: "interactive"` — returns only buttons/links/inputs, cuts output 50-93%
  - `depth: 3-5` — limits tree traversal for deep DOMs
  - `ref_id` — reads a specific subtree instead of the whole page
- Use `get_page_text` instead of `read_page` when you only need to read content, not interact

## Console and Network

- Always provide a `pattern` to `read_console_messages` — unfiltered output floods context
- Always provide `urlPattern` to `read_network_requests` — e.g., `"/api/"` to filter API calls only

## Known Limitations

- Chrome extension service worker idles after 30s of inactivity — can break the MCP connection in long gaps between browser actions
- MCP tool calls are sequential (parallel execution is regressed as of early 2026)
- One action per tool call — the MCP protocol doesn't support batching yet (spec allows it, client doesn't implement it)

## App Structure (customize per project)

```
- Sidebar: nav links at /, /about, /settings
- Login form: inputs "Email", "Password", button "Sign In"
- Dashboard: cards with class ".metric-card", table with id "#data-table"
- Modal: triggered by buttons with data-modal attr, close via ".modal-close"
```
