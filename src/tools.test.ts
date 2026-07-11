import { describe, expect, it } from 'vitest';

import { TOOL_NAMES } from '../src/tools.js';

describe('TOOL_NAMES', () => {
    it('matches the M5 tool list from the project brief', () => {
        expect([...TOOL_NAMES]).toEqual([
            'validate_tax_id',
            'validate_iban',
            'lookup_instrument',
            'validate_email',
            'validate_phone',
            'screen_sanctions',
            'verify_company',
            'inspect_domain',
            'screen',
            'propose_check',
            'create_account',
            'verify_account',
            'get_usage',
        ]);
    });
});
