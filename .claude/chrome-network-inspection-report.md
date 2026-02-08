# Chrome MCP Network Inspection: Capabilities & Gaps

## Context

During browser automation sessions with Claude in Chrome, we identified that network inspection is limited to metadata only — URL, HTTP method, and status code. This report investigates whether this is a fundamental constraint, what alternatives exist, and whether a combined setup can close the gap.

The investigation was prompted by navigating through the LLM Prompt Lab application (Templates, Pipelines, Executions pages) and observing that `read_network_requests` captured 46 requests but provided no response bodies, headers, or timing data.

## Current Setup: Claude in Chrome Extension

### What it provides

| Field                                   | Available |
|-----------------------------------------|-----------|
| Request URL                             | Yes       |
| HTTP method                             | Yes       |
| Status code                             | Yes       |
| URL pattern filtering (`urlPattern`)    | Yes       |
| Result clearing between reads (`clear`) | Yes       |
| Result count limiting (`limit`)         | Yes       |

### What it does not provide

| Field                      | Available |
|----------------------------|-----------|
| Response body              | No        |
| Request body / payload     | No        |
| Request headers            | No        |
| Response headers           | No        |
| Timing / latency breakdown | No        |
| Payload size               | No        |
| Content type               | No        |

### Practical value

The tool is useful for answering surface-level questions:

- "Did the frontend call the backend after that button click?"
- "Which endpoint was hit?"
- "Did anything return a non-200 status?"

It is not sufficient for:

- Debugging malformed payloads or unexpected response shapes
- Inspecting authentication headers or tokens
- Measuring API latency
- Verifying response data in automated workflows

### How it works

Network tracking begins when `read_network_requests` is first called on a tab. Requests made before that first call are not captured. A page refresh or new navigation after the first call will populate the log. Requests are automatically cleared when the page navigates to a different domain.

Reference: Chrome MCP tool schema (`read_network_requests` parameters)

## Alternative: Chrome DevTools MCP

A separate MCP server maintained by the Chrome DevTools team connects to Chrome via the Chrome DevTools Protocol (CDP), providing full DevTools-level inspection.

### Repository

https://github.com/ChromeDevTools/chrome-devtools-mcp

### What it provides

- Full request and response headers
- Request and response bodies
- Network timing breakdown
- Console log access with full stack traces
- DOM inspection and manipulation
- Performance profiling
- JavaScript evaluation in page context

### Setup

```bash
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

Then enable remote debugging in Chrome at `chrome://inspect/#remote-debugging`. The server uses `--autoConnect` to attach to a running browser instance — no need to relaunch Chrome with special flags.

Reference: [Official Chrome blog — Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)

### Requirements

- Node.js v20.19+ (latest maintenance LTS)
- Chrome stable (current version)
- Since Chrome 136: remote debugging is blocked on the default profile for security. Requires either `--user-data-dir` for a separate profile or accepting the permission dialog when the MCP server requests a debugging session.

Reference: [Setup guide — raf.dev](https://raf.dev/blog/chrome-debugging-profile-mcp/)

## Combined Setup: Extension + DevTools MCP

### Compatibility

The two tools use different communication channels and can coexist on the same Chrome instance:

| Tool                | Communication layer                                            |
|---------------------|----------------------------------------------------------------|
| Claude in Chrome    | Chrome Extension APIs (runs inside the browser process)        |
| Chrome DevTools MCP | Chrome DevTools Protocol / CDP (external WebSocket connection) |

There is no known conflict between the two. Each DevTools MCP instance uses a unique debugging port to prevent collisions when running multiple sessions.

### Expected behavior when combined

| Capability                             | Claude in Chrome        | DevTools MCP            | Combined                           |
|----------------------------------------|-------------------------|-------------------------|------------------------------------|
| Page navigation                        | Yes                     | Yes                     | Either can navigate                |
| Element interaction (click, type)      | Yes (ref-based)         | Yes (CDP-based)         | Use extension for consistency      |
| Network metadata (URL, method, status) | Yes                     | Yes                     | Redundant — both provide           |
| Response bodies                        | No                      | Yes                     | DevTools MCP fills the gap         |
| Request/response headers               | No                      | Yes                     | DevTools MCP fills the gap         |
| Timing breakdown                       | No                      | Yes                     | DevTools MCP fills the gap         |
| Console logs                           | Yes (pattern filter)    | Yes (full stack traces) | DevTools MCP is richer             |
| DOM / accessibility tree               | Yes (read_page, find)   | Yes (CDP DOM methods)   | Use extension — better integration |
| Performance profiling                  | No                      | Yes                     | DevTools MCP only                  |
| Visual feedback for user               | Yes (user watches live) | No (data only)          | Extension provides the UX          |

### Recommended division of responsibility

- **Claude in Chrome**: navigation, element interaction, visual confirmation, quick network checks
- **Chrome DevTools MCP**: deep network inspection, response body assertions, performance profiling, advanced console debugging

## Comparison with Playwright

For completeness, Playwright's network capabilities compared to the MCP tools:

| Capability                    | Claude in Chrome | DevTools MCP | Playwright              |
|-------------------------------|------------------|--------------|-------------------------|
| See which calls were made     | Yes              | Yes          | Yes                     |
| Filter by URL                 | Yes              | Yes          | Yes                     |
| Read response bodies          | No               | Yes          | Yes                     |
| Read request bodies           | No               | Yes          | Yes                     |
| Intercept / mock responses    | No               | No           | Yes (`page.route()`)    |
| Record & replay traffic (HAR) | No               | No           | Yes (`routeFromHAR`)    |
| Wait for specific call        | No               | No           | Yes (`waitForResponse`) |
| Modify requests in flight     | No               | No           | Yes (`page.route()`)    |
| Runs on user's live browser   | Yes              | Yes          | No (isolated instance)  |

Playwright is the only option that supports request interception and mocking, making it the right choice for deterministic test assertions. The MCP tools operate on the live browser, making them better for exploration and debugging.

## Open Questions

1. **CDP session conflicts**: While the extension and DevTools MCP use different channels, both can potentially attach CDP debugger sessions. If the Claude in Chrome extension uses `chrome.debugger` internally, there could be edge cases where both compete for the same debugging target. This needs empirical testing.

2. **Performance overhead**: Running both simultaneously adds a CDP WebSocket connection and additional event listeners. Impact on browser performance is unknown but expected to be negligible for typical workflows.

3. **Chrome 136+ profile restrictions**: The remote debugging security change may require workflow adjustments. If the user's default profile blocks CDP, they may need to use a secondary profile or accept a permission prompt each session.

## References

- [Chrome DevTools MCP — GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools MCP — Official Chrome Blog](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP Setup Guide — raf.dev](https://raf.dev/blog/chrome-debugging-profile-mcp/)
- [Chrome DevTools Protocol Documentation](https://chromedevtools.github.io/devtools-protocol/)
- [Claude in Chrome — Claude Code Docs](https://code.claude.com/docs/en/chrome)
- [Reverse Engineering APIs with Chrome DevTools MCP](https://posts.oztamir.com/reverse-engineering-apis-with-chrome-devtools-mcp/)
