import { apiBaseUrl, optionalApiKey } from './config.js';

export type ApiResult<T> =
    | { ok: true; status: number; data: T }
    | { ok: false; status: number; data: unknown };

export class MadTacoClient {
    constructor(private readonly baseUrl: string = apiBaseUrl()) {}

    async validateTaxId(id: string, country: string): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/tax-id', { id, country });
    }

    async validateIban(iban: string): Promise<ApiResult<Record<string, unknown>>> {
        return this.post('/validate/iban', { iban });
    }

    async getClIndicator(
        indicator: string,
        date?: string,
    ): Promise<ApiResult<Record<string, unknown>>> {
        const path = date
            ? `/data/cl/${encodeURIComponent(indicator)}/${encodeURIComponent(date)}`
            : `/data/cl/${encodeURIComponent(indicator)}`;

        return this.get(path);
    }

    private async post(path: string, body: Record<string, string>): Promise<ApiResult<Record<string, unknown>>> {
        return this.request('POST', path, body);
    }

    private async get(path: string): Promise<ApiResult<Record<string, unknown>>> {
        return this.request('GET', path);
    }

    private async request(
        method: 'GET' | 'POST',
        path: string,
        body?: Record<string, string>,
    ): Promise<ApiResult<Record<string, unknown>>> {
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };

        const apiKey = optionalApiKey();

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
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
