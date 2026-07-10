const DEFAULT_API_BASE = 'https://api.madtaco.dev/v1';

export function apiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
    const base = env.MADTACO_API_BASE?.trim() || DEFAULT_API_BASE;

    return base.replace(/\/$/, '');
}

export function optionalApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
    const key = env.MADTACO_API_KEY?.trim();

    return key || undefined;
}

export function requireApiKey(env: NodeJS.ProcessEnv = process.env): string {
    const apiKey = optionalApiKey(env);

    if (!apiKey) {
        throw new Error(
            'MADTACO_API_KEY is required for this tool. Create an account with create_account + verify_account, or set the env var.',
        );
    }

    return apiKey;
}
