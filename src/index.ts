#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { formatApiResult, formatThrownError, MadTacoClient } from './api.js';
import { requireApiKey } from './config.js';
import { TOOL_NAMES } from './tools.js';

export { TOOL_NAMES };

const checkTypeSchema = z.enum(['sanctions', 'registry', 'domain', 'email', 'phone']);

const server = new McpServer({
    name: 'madtaco',
    version: '1.1.3',
});

const client = new MadTacoClient();

server.registerTool(
    'validate_tax_id',
    {
        description:
            'Validate a tax ID format and checksum. Supports CL RUT, MX RFC, and more. Free — no API key required.',
        inputSchema: {
            id: z.string().describe('Tax ID to validate, e.g. "11.111.111-1".'),
            country: z.string().describe('ISO 3166-1 alpha-2 country code, e.g. "CL".'),
        },
    },
    async ({ id, country }) => formatApiResult(await client.validateTaxId(id, country)),
);

server.registerTool(
    'validate_iban',
    {
        description: 'Validate an IBAN checksum and parse country and bank code. Free — no API key required.',
        inputSchema: {
            iban: z.string().describe('IBAN to validate, e.g. "DE89370400440532013000".'),
        },
    },
    async ({ iban }) => formatApiResult(await client.validateIban(iban)),
);

server.registerTool(
    'lookup_instrument',
    {
        description:
            'Map a ticker, ISIN, CUSIP, or other identifier to FIGI and instrument metadata via OpenFIGI. Free — no API key required.',
        inputSchema: {
            id_type: z.string().describe('OpenFIGI idType, e.g. TICKER, ID_ISIN, ID_CUSIP, ID_BB_GLOBAL.'),
            id_value: z.string().describe('Third-party identifier value to map.'),
            exchange_code: z.string().optional().describe('Optional exchange code filter (not with mic_code).'),
            mic_code: z.string().optional().describe('Optional MIC filter (not with exchange_code).'),
            currency: z.string().optional().describe('Optional ISO 4217 currency filter.'),
        },
    },
    async (args) => {
        const { id_type, id_value, exchange_code, mic_code, currency } = args;
        const body: Record<string, unknown> = { id_type, id_value };

        if (exchange_code) {
            body.exchange_code = exchange_code;
        }

        if (mic_code) {
            body.mic_code = mic_code;
        }

        if (currency) {
            body.currency = currency;
        }

        return formatApiResult(await client.lookupInstrument(body));
    },
);

server.registerTool(
    'validate_email',
    {
        description:
            'Validate an email address. mode "syntax" is free; mode "full" costs 0.005 credits (tier 2).',
        inputSchema: {
            address: z.string().email().describe('Email address to validate.'),
            mode: z.enum(['syntax', 'full']).optional().describe('syntax (free) or full (paid).'),
        },
    },
    async ({ address, mode }) => formatApiResult(await client.validateEmail(address, mode)),
);

server.registerTool(
    'validate_phone',
    {
        description:
            'Validate a phone number. mode "format" is free; mode "full" costs 0.005 credits (tier 2).',
        inputSchema: {
            number: z.string().describe('Phone number, E.164 preferred.'),
            mode: z.enum(['format', 'full']).optional().describe('format (free) or full (paid).'),
        },
    },
    async ({ number, mode }) => formatApiResult(await client.validatePhone(number, mode)),
);

server.registerTool(
    'screen_sanctions',
    {
        description:
            'Screen a name against OFAC SDN, EU, UK, and UN sanctions lists. Costs 0.10 credits (tier 2).',
        inputSchema: {
            name: z.string().describe('Name to screen.'),
            country: z.string().optional().describe('Optional ISO country hint.'),
            match_threshold: z
                .number()
                .min(0.5)
                .max(1)
                .optional()
                .describe('Similarity threshold, default 0.85.'),
            idempotency_key: z.string().optional().describe('Optional Idempotency-Key header.'),
        },
    },
    async (args) => {
        try {
            requireApiKey();
            const { idempotency_key, ...body } = args;

            return formatApiResult(await client.screenSanctions(body, idempotency_key));
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

server.registerTool(
    'verify_company',
    {
        description:
            'Verify a company against an official registry (GB only in v1). Costs 0.15 credits (tier 2).',
        inputSchema: {
            country: z.string().describe('ISO 3166-1 alpha-2 country code.'),
            name: z.string().optional().describe('Company name.'),
            registration_number: z.string().optional().describe('Registry number.'),
            idempotency_key: z.string().optional().describe('Optional Idempotency-Key header.'),
        },
    },
    async (args) => {
        try {
            requireApiKey();
            const { idempotency_key, ...body } = args;

            return formatApiResult(await client.verifyCompany(body, idempotency_key));
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

server.registerTool(
    'inspect_domain',
    {
        description:
            'Inspect domain age, DNS posture, and lookalike risk. Costs 0.05 credits (tier 2).',
        inputSchema: {
            domain: z.string().describe('Domain to inspect, e.g. example.com.'),
            idempotency_key: z.string().optional().describe('Optional Idempotency-Key header.'),
        },
    },
    async ({ domain, idempotency_key }) => {
        try {
            requireApiKey();

            return formatApiResult(await client.inspectDomain(domain, idempotency_key));
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

server.registerTool(
    'screen',
    {
        description:
            'Run a composite trust screen across sanctions, registry, domain, email, and phone checks. Only completed checks are charged. Optionally long-polls when still running.',
        inputSchema: {
            entity: z
                .object({
                    name: z.string().optional(),
                    country: z.string().optional(),
                    registration_number: z.string().optional(),
                    domain: z.string().optional(),
                    email: z.string().optional(),
                    phone: z.string().optional(),
                })
                .describe('Entity identifiers — each check uses what it needs.'),
            checks: z.array(checkTypeSchema).min(1).describe('Checks to run in parallel.'),
            max_credits: z.number().optional().describe('Hard spend cap; excess checks are skipped.'),
            wait_seconds: z
                .number()
                .int()
                .min(0)
                .max(60)
                .optional()
                .describe('Long-poll up to N seconds when status is queued/running.'),
            idempotency_key: z.string().optional().describe('Optional Idempotency-Key header.'),
        },
    },
    async (args) => {
        try {
            requireApiKey();
            const { idempotency_key, wait_seconds, entity, checks, max_credits } = args;
            const body: Record<string, unknown> = { entity, checks };

            if (max_credits !== undefined) {
                body.max_credits = max_credits;
            }

            let result = await client.screen(body, idempotency_key);

            if (!result.ok) {
                return formatApiResult(result);
            }

            const screenId = typeof result.data.screen_id === 'string' ? result.data.screen_id : undefined;
            const status = typeof result.data.status === 'string' ? result.data.status : undefined;
            const wait = wait_seconds ?? 0;
            const terminal = new Set(['completed', 'failed']);

            if (screenId && wait > 0 && status && !terminal.has(status)) {
                result = await client.getScreen(screenId, wait);
            }

            return formatApiResult(result);
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

server.registerTool(
    'propose_check',
    {
        description:
            'Propose a new check capability MadTaco does not offer yet. Optionally pledge credits (held, not charged).',
        inputSchema: {
            capability: z.string().describe('Description of the capability you want.'),
            willing_to_pay_per_call: z.number().optional(),
            pledge_credits: z.number().optional(),
            expected_monthly_volume: z.number().int().optional(),
        },
    },
    async (args) => {
        try {
            requireApiKey();

            return formatApiResult(await client.proposeCheck(args));
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

server.registerTool(
    'create_account',
    {
        description:
            'Create a MadTaco account (agent-native signup). A 6-digit verification code is emailed — no API key yet.',
        inputSchema: {
            email: z.string().email().describe('Account email (disposable domains rejected).'),
            name: z.string().optional().describe('Optional display name.'),
        },
    },
    async ({ email, name }) => formatApiResult(await client.createAccount(email, name)),
);

server.registerTool(
    'verify_account',
    {
        description: 'Verify the emailed 6-digit code and receive an API key (tier registered).',
        inputSchema: {
            account_id: z.string().describe('account_id from create_account.'),
            code: z.string().describe('6-digit verification code from email.'),
        },
    },
    async ({ account_id, code }) => formatApiResult(await client.verifyAccount(account_id, code)),
);

server.registerTool(
    'get_usage',
    {
        description:
            'Get today usage totals, per-operation counts, credits spent, and balance. Optional period=7d|30d for daily breakdown.',
        inputSchema: {
            period: z
                .enum(['7d', '30d'])
                .optional()
                .describe('Include daily breakdown for the last 7 or 30 days.'),
        },
    },
    async ({ period }) => {
        try {
            requireApiKey();

            return formatApiResult(await client.getUsage(period));
        } catch (error) {
            return formatThrownError(error);
        }
    },
);

async function main(): Promise<void> {
    const transport = new StdioServerTransport();

    await server.connect(transport);
}

main().catch((error: unknown) => {
    console.error('MadTaco MCP server failed to start:', error);
    process.exit(1);
});
