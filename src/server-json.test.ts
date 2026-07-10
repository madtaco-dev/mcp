import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverJson = JSON.parse(readFileSync(join(rootDir, 'server.json'), 'utf8')) as {
    name: string;
    version: string;
    packages: Array<{ identifier: string; version: string }>;
};

describe('server.json', () => {
    it('matches package.json mcpName and version', () => {
        expect(serverJson.name).toBe(packageJson.mcpName);
        expect(serverJson.version).toBe(packageJson.version);
        expect(serverJson.packages[0]?.identifier).toBe(packageJson.name);
        expect(serverJson.packages[0]?.version).toBe(packageJson.version);
    });

    it('keeps description within registry limit', () => {
        expect(serverJson.description.length).toBeLessThanOrEqual(100);
    });
});
