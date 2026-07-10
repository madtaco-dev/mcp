import { afterEach, describe, expect, it, vi } from 'vitest';

import { MadTacoClient } from './api.js';

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MADTACO_API_KEY;
});

describe('MadTacoClient', () => {
    it('posts tax id validation to the api', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                valid: true,
                normalized: '11111111-1',
                type: 'rut',
                country: 'CL',
                credits_charged: 0,
            }),
        });

        vi.stubGlobal('fetch', fetchMock);

        const client = new MadTacoClient('https://api.madtaco.dev/v1');
        const result = await client.validateTaxId('11.111.111-1', 'CL');

        expect(result.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.objectContaining({ href: 'https://api.madtaco.dev/v1/validate/tax-id' }),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ id: '11.111.111-1', country: 'CL' }),
            }),
        );
    });

    it('sends X-Api-Key when MADTACO_API_KEY is set', async () => {
        process.env.MADTACO_API_KEY = 'mt_live_test';

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ valid: true, credits_charged: 0 }),
        });

        vi.stubGlobal('fetch', fetchMock);

        const client = new MadTacoClient('https://api.madtaco.dev/v1');
        await client.validateIban('DE89370400440532013000');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.objectContaining({ href: 'https://api.madtaco.dev/v1/validate/iban' }),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Api-Key': 'mt_live_test',
                }),
            }),
        );
    });
});
