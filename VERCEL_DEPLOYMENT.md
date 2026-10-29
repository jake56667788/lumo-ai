# Vercel Deployment Guide for lumo-tamer

This guide explains how to deploy lumo-tamer to Vercel as a serverless API.

## Prerequisites

1. A GitHub account with the repository cloned
2. A Vercel account (free tier works)
3. Proton account with access to Lumo AI

## Step 1: Extract Authentication Tokens

Before deploying, you need to extract your authentication tokens locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Authenticate using browser method
npm run dev:server &  # Start server in background
tamer auth browser    # Follow the prompts
```

After authenticating, you'll need to extract the tokens from your environment. The easiest way is to check your browser's localStorage and cookies, or use the token refresh mechanism.

Required values:
- `uid`: Your Proton user ID (UUID format)
- `accessToken`: Current access token
- `refreshToken`: Refresh token (recommended for automatic renewal)
- `keyPassword`: Optional - for encrypted conversation storage
- `userKeys`: Optional - JSON array of cached user keys
- `masterKeys`: Optional - JSON array of cached master keys

## Step 2: Configure Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
LUMO_TAMER_UID=<your-uid>
LUMO_TAMER_ACCESS_TOKEN=<your-access-token>
LUMO_TAMER_REFRESH_TOKEN=<your-refresh-token> (recommended)
LUMO_TAMER_KEY_PASSWORD=<key-password> (optional, for encryption)
LUMO_TAMER_USER_KEYS=[...] (optional, paste JSON array)
LUMO_TAMER_MASTER_KEYS=[...] (optional, paste JSON array)
```

### Getting Refresh Token

To get a refresh token:
1. Run `tamer auth browser` locally
2. Check your browser's cookies for `REFRESH-{uid}` on `account.proton.me`
3. Decode the cookie value (it's URL-encoded JSON)
4. Extract the `RefreshToken` field

Alternatively, after initial setup, you can get the refresh token from the generated vault file.

## Step 3: Deploy to Vercel

### Option A: Vercel CLI

```bash
vercel login
vercel
vercel --prod
```

### Option B: GitHub Integration

1. Push your code to GitHub
2. Import the repository in Vercel dashboard
3. Add environment variables (Step 2)
4. Click "Deploy"

## Step 4: Configure Vercel Settings

In Vercel project settings:

1. **Build Command**: `npm run build`
2. **Output Directory**: Leave empty (uses default)
3. **Install Command**: `npm install`
4. **Framework Preset**: None (custom Node.js server)

## Step 5: Test Your Deployment

Once deployed, test the API:

```bash
# Health check (no auth required)
curl https://your-deployment.vercel.app/health

# Chat completions (requires API key if enabled)
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-api-key>" \
     -d '{"model": "lumo", "messages": [{"role": "user", "content": "Hello"}]}' \
     https://your-deployment.vercel.app/v1/chat/completions
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **No API Key Protection**: By default, the serverless deployment has no API key protection. Only use this when your Vercel deployment URL is private or behind additional authentication.

2. **Enable API Key Protection**: If you want to protect your API endpoint:
   ```yaml
   # Add to your config.yaml before building
   server:
     apiKey: "your-secure-random-key"
   ```
   Then redeploy and use the `Authorization: Bearer <your-api-key>` header.

3. **Environment Variables**: Never commit sensitive environment variables to Git. Vercel manages them securely.

4. **Token Refresh**: Without `LUMO_TAMER_REFRESH_TOKEN`, your access token will expire (~24h) and require manual redeployment.

## Serverless Limitations

- **No Persistent Storage**: Conversations are stored in-memory only. They're lost between cold starts.
- **No Sync to Proton**: Since we skip the upstream storage system, conversations won't sync to Proton servers.
- **Cold Starts**: First request after idle period may take 2-5 seconds.
- **Max Duration**: Functions timeout after 60 seconds (configurable in Vercel plan).
- **No File System**: Cannot write to disk; all state is ephemeral.

## Troubleshooting

### "Missing required environment variable"

Ensure all required env vars are set in Vercel dashboard:
- `LUMO_TAMER_UID`
- `LUMO_TAMER_ACCESS_TOKEN`

### "Token refresh failed"

Check that `LUMO_TAMER_REFRESH_TOKEN` is correctly set and hasn't expired.

### "No encryption keys"

Add `LUMO_TAMER_KEY_PASSWORD`, `LUMO_TAMER_USER_KEYS`, and `LUMO_TAMER_MASTER_KEYS` for encrypted conversation support (though in serverless, conversations are in-memory anyway).

### High latency / Cold starts

- Use Vercel Pro plan for faster cold starts
- Enable "Always On" feature (Pro+ feature)
- Keep function memory allocation at 1024MB or higher

## Local Testing

Test serverless mode locally:

```bash
# Set environment variables
export LUMO_TAMER_UID=<your-uid>
export LUMO_TAMER_ACCESS_TOKEN=<your-token>
export LUMO_TAMER_REFRESH_TOKEN=<your-refresh-token>

# Run locally in server mode
npm run dev:server
```

This simulates the serverless environment without actually deploying.

## Migration from Docker Deployment

If migrating from Docker:

1. Extract tokens from your local setup
2. Set up Vercel project with environment variables
3. Update any API clients to use new Vercel URL
4. Note: Conversation history will NOT migrate (in-memory only)

## Cost Estimate

On free tier:
- 100GB bandwidth/month
- 100,000 function invocations/month
- 60s max duration per invocation

Typical usage (light): ~$0-5/month
Heavy usage (multiple chats/hour): ~$10-20/month

Monitor usage in Vercel dashboard.

## Support

For issues:
1. Check logs in Vercel dashboard
2. Verify environment variables are correct
3. Ensure tokens haven't expired
4. Review README.md for general troubleshooting
