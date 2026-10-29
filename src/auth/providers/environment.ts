/**
 * Environment Variable Auth Provider - Serverless compatible
 *
 * For Vercel/serverless deployments, use environment variables:
 * - LUMO_TAMER_UID: User ID (UUID)
 * - LUMO_TAMER_ACCESS_TOKEN: Access token from browser extraction
 * - LUMO_TAMER_REFRESH_TOKEN: Refresh token for automatic renewal (recommended)
 * - LUMO_TAMER_KEY_PASSWORD: keyPassword for decrypting user keys (optional)
 * - LUMO_TAMER_USER_KEYS: JSON array of cached user keys (optional)
 * - LUMO_TAMER_MASTER_KEYS: JSON array of cached master keys (optional)
 *
 * This bypasses the need for keytar, Playwright, or local file storage.
 */

import { logger } from '../../app/logger.js';
import { refreshWithRefreshToken, canRefreshWithToken } from '../token-refresh.js';
import { AuthProvider, type ProviderConfig } from './provider.js';
import type { StoredTokens, CachedUserKey, CachedMasterKey } from '../types.js';

export class EnvironmentAuthProvider extends AuthProvider {
    readonly method = 'environment' as const;

    constructor() {
        const uid = requireEnv('LUMO_TAMER_UID');
        const accessToken = requireEnv('LUMO_TAMER_ACCESS_TOKEN');
        const refreshToken = process.env.LUMO_TAMER_REFRESH_TOKEN;
        const keyPassword = process.env.LUMO_TAMER_KEY_PASSWORD;
        const userKeys = parseJsonEnv<CachedUserKey[]>('LUMO_TAMER_USER_KEYS');
        const masterKeys = parseJsonEnv<CachedMasterKey[]>('LUMO_TAMER_MASTER_KEYS');

        if (!refreshToken) {
            logger.warn(
                'No LUMO_TAMER_REFRESH_TOKEN set - access token will expire and require a redeploy'
            );
        }

        const tokens: StoredTokens = {
            method: 'environment',
            uid,
            accessToken,
            refreshToken,
            keyPassword,
            extractedAt: new Date().toISOString(),
            // Env tokens are assumed valid at boot; refresh handles expiry.
            expiresAt: undefined,
            userKeys,
            masterKeys,
        };

        // Dummy config - vault I/O is never used in environment mode.
        const config: ProviderConfig = {
            vaultPath: '',
            keyConfig: {
                keychain: { service: '', account: '' },
                keyFilePath: '',
            },
        };

        super(tokens, config);

        logger.info(
            { uid: uid.slice(0, 8) + '...', hasRefreshToken: !!refreshToken, hasUserKeys: !!userKeys },
            'Environment auth provider initialized'
        );
    }

    /**
     * Environment mode always has the lumo scope when tokens were extracted
     * from a browser session, so full API is supported if keys are present.
     */
    supportsFullApi(): boolean {
        return this.supportsPersistence();
    }

    /**
     * Refresh tokens in-memory only (no vault writes on serverless).
     */
    async refresh(): Promise<void> {
        if (!canRefreshWithToken(this.tokens)) {
            throw new Error(
                'No refresh token available. Set LUMO_TAMER_REFRESH_TOKEN to enable automatic refresh.'
            );
        }

        const refreshed = await refreshWithRefreshToken(this.tokens);
        this.tokens = { ...this.tokens, ...refreshed };

        logger.info(
            { hasAccessToken: !!this.tokens.accessToken },
            'Environment token refresh successful (in-memory)'
        );
    }

    /**
     * No-op: serverless has no writable vault.
     */
    protected async saveTokensToVault(): Promise<void> {
        // Intentionally empty - tokens live only in memory.
    }
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(
            `Missing required environment variable: ${name}\n` +
                'For Vercel deployment, set these in your project settings.'
        );
    }
    return value;
}

function parseJsonEnv<T>(name: string): T | undefined {
    const raw = process.env[name];
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        logger.warn({ error, name }, 'Failed to parse JSON environment variable');
        return undefined;
    }
}

/**
 * Create an environment-based auth provider for serverless deployments
 */
export function createEnvironmentAuthProvider(): AuthProvider {
    return new EnvironmentAuthProvider();
}
