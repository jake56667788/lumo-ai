/**
 * Auth providers index
 */

export { BrowserAuthProvider } from './browser.js';
export { EnvironmentAuthProvider, createEnvironmentAuthProvider } from './environment.js';
export { AuthProvider, getProviderConfig, type  ProviderConfig } from './provider.js';

// Import browsers to register their factories (side effects)
import './browser.js';

