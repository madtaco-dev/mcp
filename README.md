# @madtaco/mcp

MadTaco MCP server — verification and trust checks for AI agents.

Talks only to the public MadTaco API (`https://api.madtaco.dev/v1`). No Laravel dependency; this package is published separately at [github.com/madtaco-dev/mcp](https://github.com/madtaco-dev/mcp).

## Quick start

```bash
npx @madtaco/mcp
```

### Claude Desktop / Cursor

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

Free tools (`validate_tax_id`, `validate_iban`, `create_account`, `verify_account`) work without an API key. Paid checks and account tools that read balance/usage require `MADTACO_API_KEY`.

## Environment

| Variable | Required | Default |
| --- | --- | --- |
| `MADTACO_API_KEY` | For paid/authenticated tools | — |
| `MADTACO_API_BASE` | No | `https://api.madtaco.dev/v1` |

## Tools

| Tool | API endpoint | Credits |
| --- | --- | --- |
| `validate_tax_id` | `POST /validate/tax-id` | 0 |
| `validate_iban` | `POST /validate/iban` | 0 |
| `validate_email` | `POST /validate/email` | 0 (syntax) / 0.005 (full) |
| `validate_phone` | `POST /validate/phone` | 0 (format) / 0.005 (full) |
| `screen_sanctions` | `POST /screen/sanctions` | 0.10 |
| `verify_company` | `POST /verify/company` | 0.15 |
| `inspect_domain` | `POST /inspect/domain` | 0.05 |
| `screen` | `POST /screen` (+ optional long-poll) | sum of completed checks |
| `propose_check` | `POST /propose` | pledge hold only |
| `create_account` | `POST /accounts` | 0 |
| `verify_account` | `POST /accounts/verify` | 0 |
| `get_usage` | `GET /usage` | 0 |

## Agent onboarding flow

1. `create_account` with an email → `account_id` + `pending_verification`
2. Human or agent reads the 6-digit code from email
3. `verify_account` → `api_key` (tier `registered`)
4. Fund the account via [madtaco.dev](https://madtaco.dev) billing (browser checkout) or `POST /v1/billing/checkout`
5. Set `MADTACO_API_KEY` and run paid checks

Credentials never transit through MCP responses for human dashboard access — use the web invite flow at `POST /v1/accounts/invite-human` when needed.

## Development

```bash
cd mcp
npm install
npm test
npm run build
MADTACO_API_KEY=... npm run dev
```

## License

MIT
