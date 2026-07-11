# 🌮 MadTaco — MCP Server

**npm:** [`@madtaco/mcp`](https://www.npmjs.com/package/@madtaco/mcp)

[![smithery badge](https://smithery.ai/badge/madtaco/madtaco-mcp)](https://smithery.ai/servers/madtaco/madtaco-mcp)

Verification and utility API for AI agents. Validate tax IDs, screen sanctions, verify companies, inspect domains — prepaid USD credits. Failed checks are never charged.

This package is a **stdio [MCP](https://modelcontextprotocol.io) server** that wraps the public MadTaco API at `https://api.madtaco.dev/v1`. Every response includes `credits_charged` (0 for free operations). Prefer remote HTTP instead? See [HTTP MCP](#remote-http) below.

## Docs

- [madtaco.dev](https://madtaco.dev) — product site
- [Setup guide](https://madtaco.dev/mcp) — Cursor, Claude, Smithery
- [API docs](https://madtaco.dev/docs) — OpenAPI reference
- [Agent skill](https://madtaco.dev/skills/madtaco-api) — integration guide (MCP + REST)
- [llms.txt](https://madtaco.dev/llms.txt) — full endpoint catalog
- [pricing.json](https://madtaco.dev/pricing.json) — per-operation prices
- [Health](https://api.madtaco.dev/v1/health) — API status
- [Server card](https://api.madtaco.dev/.well-known/mcp/server-card.json) — tool metadata

## Quick start (stdio)

```bash
npx @madtaco/mcp
```

### Claude Desktop / Cursor

**Claude Desktop config:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).  
**Cursor:** `.cursor/mcp.json` in your project or global MCP settings.

```json
{
  "mcpServers": {
    "madtaco": {
      "command": "npx",
      "args": ["-y", "@madtaco/mcp"],
      "env": {
        "MADTACO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Without an API key:** `validate_tax_id`, `validate_iban`, `lookup_instrument`, `validate_email` (syntax), `validate_phone` (format), `create_account`, `verify_account`.

**With an API key (tier registered):** `get_usage`, `propose_check`.

**Funded account required (tier 2):** paid screening/verification tools and `validate_email`/`validate_phone` full modes. Top up via `POST /v1/billing/checkout` or [madtaco.dev](https://madtaco.dev) billing.

**Rate limits:** 50 req/day anonymous (per IP), 100 req/day registered (per API key), 500/day included once funded — see [llms.txt](https://madtaco.dev/llms.txt).

### Try it

> Validate the Chilean RUT `11.111.111-1` using MadTaco.

> Check whether IBAN `DE89370400440532013000` is valid.

> Look up ticker `CMG` on exchange `US`.

## Remote HTTP

Streamable HTTP MCP on the API subdomain — no npm install required:

```json
{
  "mcpServers": {
    "madtaco": {
      "url": "https://api.madtaco.dev/mcp",
      "headers": { "X-Api-Key": "your_api_key_here" }
    }
  }
}
```

Authenticate with `X-Api-Key` or `Authorization: Bearer`. Same 13 tools as this stdio package.

## Environment

| Variable | Required | Default |
| --- | --- | --- |
| `MADTACO_API_KEY` | For authenticated and paid tools | — |
| `MADTACO_API_BASE` | No | `https://api.madtaco.dev/v1` |

Override for staging or local dev:

```json
"env": { "MADTACO_API_BASE": "https://api.madtaco.dev/v1" }
```

## Tools

All paths are relative to `MADTACO_API_BASE` (default `https://api.madtaco.dev/v1`).

| Tool | API endpoint | Credits |
| --- | --- | --- |
| `validate_tax_id` | `POST /validate/tax-id` | 0 |
| `validate_iban` | `POST /validate/iban` | 0 |
| `lookup_instrument` | `POST /lookup/instrument` | 0 |
| `validate_email` | `POST /validate/email` | 0 (syntax) / 0.005 (full, tier 2) |
| `validate_phone` | `POST /validate/phone` | 0 (format) / 0.005 (full, tier 2) |
| `screen_sanctions` | `POST /screen/sanctions` | 0.10 |
| `verify_company` | `POST /verify/company` | 0.15 |
| `inspect_domain` | `POST /inspect/domain` | 0.05 |
| `screen` | `POST /screen` + optional `GET /screens/{id}?wait=60` | sum of completed checks |
| `propose_check` | `POST /propose` | pledge hold only |
| `create_account` | `POST /accounts` | 0 |
| `verify_account` | `POST /accounts/verify` | 0 |
| `get_usage` | `GET /usage` | 0 |

## Not in MCP (REST only)

Call these directly against the API — see [llms.txt](https://madtaco.dev/llms.txt):

- `GET /data/cl/{indicator}` — Chilean indicators (UF, UTM, USD, EUR, IPC)
- `GET /balance` — credit balance (`get_usage` includes balance)
- `GET /evidence/{id}` — signed evidence URLs
- `GET /health` — uptime check

## Agent onboarding flow

1. `create_account` with an email → `account_id` + `pending_verification`
2. Human or agent reads the 6-digit code from email
3. `verify_account` → `api_key` (tier `registered`)
4. Fund the account via [madtaco.dev](https://madtaco.dev) billing or `POST /v1/billing/checkout`
5. Set `MADTACO_API_KEY` and run paid checks

Credentials never transit through MCP responses for human dashboard access — use `POST /v1/accounts/invite-human` when needed.

## Development

Stdio transport only — this server calls the public HTTP API; no database or secrets beyond an optional API key.

```bash
git clone https://github.com/madtaco-dev/mcp.git
cd mcp
npm install
npm test
npm run build
MADTACO_API_KEY=... npm run dev
```

New tools ship as minor npm releases as the API grows. See [llms.txt](https://madtaco.dev/llms.txt) for the current tool list.

## License

MIT © 🌮 MadTaco · Built for agents, literally.
