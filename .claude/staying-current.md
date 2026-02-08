# Staying Current: Sources & Search Strategies

## Primary Sources (check weekly)

### Claude Code

- GitHub releases: `https://github.com/anthropics/claude-code/releases` — every release has a changelog. Major features and bugfixes land here.
- GitHub issues: search `is:issue label:bug` or `is:issue label:enhancement` for known problems and upcoming features
- Search query: `site:github.com/anthropics/claude-code changelog OR release` + current month/year

### Claude in Chrome MCP

- No public repo (it's a Chrome extension), so track through:
  - Chrome Web Store update history
  - Search: `"claude in chrome" extension update OR changelog` + current month/year
  - The Claude Code repo issues often surface Chrome MCP bugs too — search `chrome MCP` in issues

### MCP Protocol

- Spec: `https://modelcontextprotocol.io/specification` — the spec version matters (currently 2025-11-25). New versions add capabilities like batching.
- Search: `"model context protocol" new features OR specification update` + current year

### Playwright

- Releases: `https://github.com/microsoft/playwright/releases` — they ship roughly monthly with meaningful features
- Search: `playwright new features OR release notes` + month/year
- Blog: `https://playwright.dev/blog`

## Community Sources (check periodically)

- **Anthropic engineering blog**: `https://www.anthropic.com/engineering` — deep dives on tool use patterns, agent design
- **Dev blogs that benchmark**: sites like `kumak.dev`, `paddo.dev` produced MCP performance benchmarks — search `claude code MCP performance OR benchmark`
- **Claude Code community**: search `claude code tips OR tricks OR workflow` on relevant platforms

## Effective Search Patterns

When searching for updates, structure queries like this:

```
# What's new in a tool
"claude code" new features [month] [year]
"playwright" release notes [version OR month year]

# Specific problems
"claude in chrome" [error message OR behavior]
site:github.com/anthropics/claude-code [keyword] is:issue

# Performance/optimization
claude code MCP "reduce tokens" OR "faster" OR "optimize"
playwright best practices [year]

# Integration patterns
claude code playwright integration OR e2e
MCP browser automation patterns [year]
```

Always include the current year — results from previous years are often outdated given how fast this ecosystem moves.

## Update Workflow

When checking for updates, ask Claude to:

1. **Search for recent releases** — check GitHub releases for Claude Code, Playwright, and MCP spec changes
2. **Search for new community findings** — blog posts, benchmarks, tips that emerged since last check
3. **Test any new features** — if something relevant landed, try it in the project
4. **Update CLAUDE.md** — capture what works into the project instructions so it persists

Good cadence: once a week during active development, or whenever you hit friction that feels like it should have been solved.

## Open Items to Watch

These are specific issues from our research that could land soon:

| Item | Issue/Source | Impact |
|------|-------------|--------|
| Parallel MCP tool calls | claude-code #14353 | Independent browser actions run concurrently |
| MCP JSON-RPC batching | MCP spec supports it, client doesn't use it | Multiple tool calls in single request |
| Chrome extension service worker idle fix | claude-code #16350 | 30s idle timeout breaks long sessions |
| Playwright component testing | playwright docs | Could replace some Vitest tests for React components |
