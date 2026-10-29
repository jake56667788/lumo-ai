#!/usr/bin/env node
/**
 * Token Export Script
 *
 * Helper script to extract and display tokens for Vercel/serverless deployment.
 *
 * Usage:
 *   npx tsx scripts/export-tokens.ts
 *
 * Reads the encrypted vault and outputs environment variable format.
 */

import { existsSync } from 'fs';
import { initConfig, authConfig } from '../src/app/config.js';
import { initLogger } from '../src/app/logger.js';
import { resolveProjectPath } from '../src/app/paths.js';
import { readVault, type VaultKeyConfig } from '../src/auth/vault/index.js';
import { print } from '../src/app/terminal.js';

async function exportTokens(): Promise<void> {
  // Initialize config and logger (error level to suppress logs)
  initConfig('cli');
  initLogger({ level: 'error', target: 'stdout', filePath: '', messageContent: false });

  print('=== Token Export for Vercel Deployment ===');
  print('');

  const vaultPath = resolveProjectPath(authConfig.vault.path);
  const keyConfig: VaultKeyConfig = {
    keychain: authConfig.vault.keychain,
    keyFilePath: authConfig.vault.keyFilePath,
  };

  print(`Reading vault from: ${vaultPath}`);

  if (!existsSync(vaultPath)) {
    throw new Error(
      `Vault not found at ${vaultPath}\n` +
      'Please run "tamer auth browser" first to create the vault.'
    );
  }

  const tokens = await readVault(vaultPath, keyConfig);

  print('\n✅ Vault loaded successfully!');
  print('');
  print('Copy these environment variables to your Vercel project:\n');
  print('─'.repeat(60));
  print('# Required:');
  print(`LUMO_TAMER_UID="${tokens.uid}"`);
  print(`LUMO_TAMER_ACCESS_TOKEN="${tokens.accessToken}"`);

  if (tokens.refreshToken) {
    print('\n# Recommended:');
    print(`LUMO_TAMER_REFRESH_TOKEN="${tokens.refreshToken}"`);
  } else {
    print('\n# ⚠️  No refresh token found - tokens will expire in 24h!');
    print('# Log in fresh in the browser, then re-run "tamer auth browser"');
  }

  if (tokens.keyPassword) {
    print('\n# Optional - for encrypted conversations:');
    print(`LUMO_TAMER_KEY_PASSWORD="${tokens.keyPassword}"`);
  }

  if (tokens.userKeys && tokens.userKeys.length > 0) {
    print('\n# Optional - cached user keys:');
    print(`LUMO_TAMER_USER_KEYS='${JSON.stringify(tokens.userKeys)}'`);
  }

  if (tokens.masterKeys && tokens.masterKeys.length > 0) {
    print('\n# Optional - cached master keys:');
    print(`LUMO_TAMER_MASTER_KEYS='${JSON.stringify(tokens.masterKeys)}'`);
  }

  print('\n' + '─'.repeat(60));
  print('');
  print('ℹ️  Next steps:');
  print('1. Copy the above variables to your clipboard');
  print('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  print('3. Paste each variable in both "Production" and "Preview" environments');
  print('4. Deploy your project');
  print('5. Test with: curl https://your-app.vercel.app/health\n');
}

exportTokens().catch((error: any) => {
  print('\n❌ Error: ' + error.message);
  print('\nTroubleshooting:');
  print('1. Run "tamer auth browser" to create tokens');
  print('2. Check that you have the vault key (keychain or key file)');
  process.exit(1);
});
