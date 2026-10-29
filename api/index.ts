import type { VercelRequest, VercelResponse } from '@vercel/node';
import { APIServer } from '../dist/src/api/server.js';
import { Application } from '../dist/src/app/index.js';
import { logger, initLogger } from '../dist/src/app/logger.js';
import { initConfig, getLogConfig } from '../dist/src/app/config.js';

// Initialize config in server mode
initConfig('server');

// Initialize logger BEFORE using it
const logConfig = getLogConfig();
initLogger(logConfig);

let expressApp: any = null;

async function initializeServer() {
  logger.info('Starting lumo-tamer serverless API (cold start)...');
  
  try {
    const app = await Application.create();
    const apiServer = new APIServer(app);
    
    // Initialize without binding to a port (serverless mode)
    await apiServer.initialize();
    
    // Get the Express app
    expressApp = apiServer.getExpressApp();
    
    logger.info('lumo-tamer serverless API initialized successfully');
    
    return expressApp;
  } catch (error: any) {
    logger.error({ error: error?.message || error }, 'Failed to initialize server');
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize server on first request (cold start)
    if (!expressApp) {
      await initializeServer();
    }

    // Pass the request through to Express
    return expressApp(req, res);
  } catch (error: any) {
    logger.error({ error: error?.message || error }, 'Request error');
    
    // Don't leak internal error details in production
    if (res.headersSent) {
      return; // Already started sending response
    }
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? error?.message 
        : 'Internal server error' 
    });
  }
}

// Function configuration (memory/maxDuration) lives in vercel.json to avoid conflicts.
