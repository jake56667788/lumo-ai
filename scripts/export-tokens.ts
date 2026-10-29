#!/usr/bin/env node
/**
 * Token Export Script
 * 
 * Helper script to extract and display tokens for Vercel/serverless deployment.
 * 
 * Usage:
 *   node scripts/export-tokens.js
 * 
 * This will read the encrypted vault and output environment variable format.
 */

import { readFileSync } from 'fs';
import { resolveProjectPath } from '../dist/src/app/paths.js';
import { authConfig } from '../dist/src/app/config.js';
import { readVault, type VaultKeyConfig } from '../dist/src/auth/vault/index.js';

async function exportTokens() {
  console.log('=== Token Export for Vercel Deployment ===\n');
  
  try {
    const vaultPath = resolveProjectPath(authConfig.vault.path);
    const keyConfig: VaultKeyConfig = {
      keychain: authConfig.vault.keychain,
      keyFilePath: authConfig.vault.keyFilePath,
    };

    console.log(`Reading vault from: ${vaultPath}`);
    
    if (!require('fs').existsSync(vaultPath)) {
      throw new Error(
        `Vault not found at ${vaultPath}\n` +
        'Please run "tamer auth" first to create the vault.'
      );
    }

    const tokens = await readVault(vaultPath, keyConfig);

    console.log('\n✅ Vault loaded successfully!\n');
    console.log('Copy these environment variables to your Vercel project:\n');
    console.log('─'.repeat(60));
    console.log('# Required:');
    console.log(`LUMO_TAMER_UID="${tokens.uid}"`);
    console.log(`LUMO_TAMER_ACCESS_TOKEN="${tokens.accessToken}"`);
    
    if (tokens.refreshToken) {
      console.log(`\n# Recommended:`);
      console.log(`LUMO_TAMER_REFRESH_TOKEN="${tokens.refreshToken}"`);
    } else {
      console.log('\n# ⚠️  No refresh token found - tokens will expire!');
      console.log('# Run "tamer auth browser" to get a refresh token');
    }

    if (tokens.keyPassword) {
      console.log(`\n# Optional - for encrypted conversations:`);
      console.log(`LUMO_TAMER_KEY_PASSWORD="${tokens.keyPassword}"`);
    }

    if (tokens.userKeys && tokens.userKeys.length > 0) {
      console.log(`\n# Optional - cached user keys:`);
      console.log(`LUMO_TAMER_USER_KEYS='${JSON.stringify(tokens.userKeys)}'`);
    }

    if (tokens.masterKeys && tokens.masterKeys.length > 0) {
      console.log(`\n# Optional - cached master keys:`);
      console.log(`LUMO_TAMER_MASTER_KEYS='${JSON.stringify(tokens.masterKeys)}'`);
    }

    console.log('\n' + '─'.repeat(60));
    
    console.log('\nℹ️  Next steps:');
    console.log('1. Copy the above variables to your clipboard');
    console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
    console.log('3. Paste each variable in both "Production" and "Preview" environments');
    console.log('4. Deploy your project');
    console.log('5. Test with: curl https://your-app.vercel.app/health\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Run "tamer auth" to create tokens');
    console.error('2. Check that you have the vault key (keychain or key file)');
    process.exit(1);
  }
}

// Run the export
exportTokens();
