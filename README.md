# 🌮 MadTaco — MCP Server

**Verification & utility API for AI agents.**
Tax-ID validation, sanctions screening, company verification, and more —
one API, prepaid credits, priced per call. **Failed checks cost $0.**

The [MadTaco API](https://madtaco.dev) is live. This package exposes it as [MCP](https://modelcontextprotocol.io) tools for Claude, Cursor, and any MCP-compatible agent.

```bash
npx @madtaco/mcp
```

No API key required for the tools in v1.0.0 — they map to MadTaco's free endpoints (50 requests/day per IP on the API). Set `MADTACO_API_KEY` later when paid tools ship in 1.1+ for higher limits.

---

## Tools (v1.0.0)

| Tool | API endpoint | Description |
|------|--------------|-------------|
| `validate_tax_id` | `POST /v1/validate/tax-id` | Format/checksum — CL RUT, MX RFC |
| `validate_iban` | `POST /v1/validate/iban` | IBAN checksum and parsing |
| `get_cl_indicator` | `GET /v1/data/cl/{indicator}` | UF, UTM, USD, EUR, IPC (CMF source) |

Every response includes `credits_charged` (always `0` for these tools).

**Coming in 1.1+** (same package, grows with the API): `create_account`, `verify_account`, `get_balance`, `get_usage`, `screen_sanctions`, `verify_company`, `inspect_domain`, `validate_email`, `validate_phone`, `screen`, `propose_check`.

---

## Quick start — Claude Desktop

Add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "madtaco": {
      "command": "npx",
      "args": ["-y", "@madtaco/mcp"]
    }
  }
}
```

Restart Claude Desktop. You should see **madtaco** under MCP tools with the three validators above.

### Example prompts in Claude

> Validate the Chilean RUT `11.111.111-1` using MadTaco.

> Check whether IBAN `DE89 3704 0044 0532 0130 00` is valid.

> What's today's UF value in Chile?

> Get the UF for 2026-07-01.

Claude will call `validate_tax_id`, `validate_iban`, or `get_cl_indicator` and return the JSON from the API.

---

## Cursor

Add to `.cursor/mcp.json` in your project (or global Cursor MCP settings):

```json
{
  "mcpServers": {
    "madtaco": {
      "command": "npx",
      "args": ["-y", "@madtaco/mcp"]
    }
  }
}
```

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MADTACO_API_BASE` | No | `https://api.madtaco.dev/v1` | API base URL (override for staging) |
| `MADTACO_API_KEY` | No | — | Optional `X-Api-Key` header; not needed for v1.0.0 tools |

Example with a custom base (local/staging):

```json
{
  "mcpServers": {
    "madtaco": {
      "command": "npx",
      "args": ["-y", "@madtaco/mcp"],
      "env": {
        "MADTACO_API_BASE": "https://api.madtaco.dev/v1"
      }
    }
  }
}
```

---

## Development

This directory is developed inside the private MadTaco API repo and published to the public [`madtaco-dev/mcp`](https://github.com/madtaco-dev/mcp) repository.

```bash
cd mcp
npm install
npm run build
npm test
npm start
```

Stdio transport only. The server talks exclusively to the MadTaco HTTP API — no database, no secrets beyond an optional API key.

### Publish checklist

```bash
# From mcp/ after copying to madtaco-dev/mcp
npm login
npm publish --access public
```

Bump minor versions (1.1.0, 1.2.0, …) as new API endpoints get MCP tools. Update [llms.txt](https://madtaco.dev/llms.txt) when the tool list changes.

---

## Links

- [madtaco.dev](https://madtaco.dev) — product site
- [API docs](https://madtaco.dev/docs) — OpenAPI reference
- [Pricing](https://madtaco.dev/pricing.json) — machine-readable per-operation prices
- [llms.txt](https://madtaco.dev/llms.txt) — agent-oriented overview
- [Health](https://api.madtaco.dev/v1/health) — API status

---

MIT © 🌮 MadTaco · Built for agents, literally.
