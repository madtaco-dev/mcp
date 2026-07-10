#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { formatApiResult, MadTacoClient } from './api.js';

const CL_INDICATORS = ['uf', 'utm', 'usd', 'eur', 'ipc'] as const;

const server = new McpServer({
    name: 'madtaco',
    version: '1.0.0',
});

const client = new MadTacoClient();

server.registerTool(
    'validate_tax_id',
    {
        description:
            'Validate a tax ID format and checksum. Supports CL RUT and MX RFC (more countries on the API over time). Free — no API key required.',
        inputSchema: {
            id: z.string().describe('Tax ID to validate, e.g. "11.111.111-1" or "GODE561231GR8".'),
            country: z
                .string()
                .describe('ISO 3166-1 alpha-2 country code, e.g. "CL" or "MX".'),
        },
    },
    async ({ id, country }) => formatApiResult(await client.validateTaxId(id, country)),
);

server.registerTool(
    'validate_iban',
    {
        description:
            'Validate an IBAN checksum and parse country and bank code. Free — no API key required.',
        inputSchema: {
            iban: z.string().describe('IBAN to validate, e.g. "DE89370400440532013000".'),
        },
    },
    async ({ iban }) => formatApiResult(await client.validateIban(iban)),
);

server.registerTool(
    'get_cl_indicator',
    {
        description:
            'Get a Chilean economic indicator from CMF: uf, utm, usd, eur, or ipc. Omit date for the latest value; pass YYYY-MM-DD for historical. Free — no API key required.',
        inputSchema: {
            indicator: z
                .enum(CL_INDICATORS)
                .describe('Indicator code: uf, utm, usd, eur, or ipc.'),
            date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .optional()
                .describe('Optional date in YYYY-MM-DD format for a historical value.'),
        },
    },
    async ({ indicator, date }) => formatApiResult(await client.getClIndicator(indicator, date)),
);

async function main(): Promise<void> {
    const transport = new StdioServerTransport();

    await server.connect(transport);
}

main().catch((error: unknown) => {
    console.error('MadTaco MCP server failed to start:', error);
    process.exit(1);
});
