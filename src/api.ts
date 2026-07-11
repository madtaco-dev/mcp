import { apiBaseUrl, optionalApiKey } from './config.js';

export type ApiResult<T> =
    | { ok: true; status: number; data: T }
    | { ok: false; status: number; data: unknown };

type RequestOptions = {
    idempotencyKey?: string;
    query?: Record<string, string | number | undefined>;
};

export class MadTacoClient {
    constructor(private readonly baseUrl: string = apiBaseUrl()) {}

    async validateTaxId(id: string, country: string): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/tax-id', { id, country });
    }

    async validateIban(iban: string): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/iban', { iban });
    }

    async lookupInstrument(
        body: Record<string, unknown>,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/lookup/instrument', body);
    }

    async validateEmail(
        address: string,
        mode?: 'syntax' | 'full',
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/email', { address, ...(mode ? { mode } : {}) });
    }

    async validatePhone(
        number: string,
        mode?: 'format' | 'full',
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/phone', { number, ...(mode ? { mode } : {}) });
    }

    async screenSanctions(
        body: Record<string, unknown>,
        idempotencyKey?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/screen/sanctions', body, { idempotencyKey });
    }

    async verifyCompany(
        body: Record<string, unknown>,
        idempotencyKey?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/verify/company', body, { idempotencyKey });
    }

    async inspectDomain(
        domain: string,
        idempotencyKey?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/inspect/domain', { domain }, { idempotencyKey });
    }

    async screen(
        body: Record<string, unknown>,
        idempotencyKey?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/screen', body, { idempotencyKey });
    }

    async getScreen(
        screenId: string,
        wait?: number,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.get(`/screens/${encodeURIComponent(screenId)}`, {
            query: wait !== undefined ? { wait } : undefined,
        });
    }

    async proposeCheck(body: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/propose', body);
    }

    async createAccount(
        email: string,
        name?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/accounts', { email, ...(name ? { name } : {}) });
    }

    async verifyAccount(
        accountId: string,
        code: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/accounts/verify', { account_id: accountId, code });
    }

    async getUsage(period?: '7d' | '30d'): Promise<ApiResult<Record<string, unknown>>> {
        return this.get('/usage', { query: period ? { period } : undefined });
    }

    private async post(
        path: string,
        body: Record<string, unknown>,
        options: RequestOptions = {},
    ): Promise<ApiResult<Record<string, unknown>>> {
        return this.request('POST', path, body, options);
    }

    private async get(path: string, options: RequestOptions = {}): Promise<ApiResult<Record<string, unknown>>> {
        return this.request('GET', path, undefined, options);
    }

    private async request(
        method: 'GET' | 'POST',
        path: string,
        body?: Record<string, unknown>,
        options: RequestOptions = {},
    ): Promise<ApiResult<Record<string, unknown>>> {
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };

        const apiKey = optionalApiKey();

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        if (options.idempotencyKey) {
            headers['Idempotency-Key'] = options.idempotencyKey;
        }

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const url = new URL(`${this.baseUrl}${path}`);

        if (options.query) {
            for (const [key, value] of Object.entries(options.query)) {
                if (value !== undefined) {
                    url.searchParams.set(key, String(value));
                }
            }
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = (await response.json().catch(() => ({
            error: 'invalid_response',
            message: 'MadTaco API returned a non-JSON response.',
        }))) as Record<string, unknown>;

        if (!response.ok) {
            return { ok: false, status: response.status, data };
        }

        return { ok: true, status: response.status, data };
    }
}

export function formatApiResult(result: ApiResult<Record<string, unknown>>): {
    content: Array<{ type: 'text'; text: string }>;
    isError: boolean;
} {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result.data, null, 2),
            },
        ],
        isError: !result.ok,
    };
}

export function formatThrownError(error: unknown): {
    content: Array<{ type: 'text'; text: string }>;
    isError: boolean;
} {
    const message = error instanceof Error ? error.message : String(error);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ error: 'tool_error', message }, null, 2),
            },
        ],
        isError: true,
    };
}
