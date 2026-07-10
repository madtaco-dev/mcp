const DEFAULT_API_BASE = 'https://api.madtaco.dev/v1';

export function apiBaseUrl(): string {
    const base = process.env.MADTACO_API_BASE?.trim() || DEFAULT_API_BASE;

    return base.replace(/\/$/, '');
}

export function optionalApiKey(): string | undefined {
    const key = process.env.MADTACO_API_KEY?.trim();

    return key || undefined;
}
