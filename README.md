# lumo-tamer ☁️

> **Deploy Lumo to Vercel in 5 Minutes** – Use Proton's private AI on any platform without installing Node.js or Go locally.

```
                        ┌─────────────────┐     ┌─────────────────┐
┌─────────────────┐     │   lumo-tamer    │◄───►│  Home Assistant │
│  Proton Lumo    │     │   (Vercel)      │     └─────────────────┘
│                 │     │                 │     ┌─────────────────┐
│  Your favorite  │◄───►│   Translation   │◄───►│  Open WebUI     │
│  private AI     │     │   Encryption    │     └─────────────────┘
│                 │     │   Tooling       │     ┌─────────────────┐
└─────────────────┘     │                 │◄───►│   Mobile Apps   │ 
                        └─────────────────┘     └─────────────────┘
```

lumo-tamer is an **OpenAI-compatible API server** that lets you use Proton's private Lumo AI in any app that supports the OpenAI API format. **Deploy it to Vercel's free tier** and access Lumo from anywhere without running your own server.

## ✨ Why Vercel?

- ✅ **Free Tier**: 100k requests/month, perfect for personal use
- ✅ **Zero Maintenance**: Serverless = no servers to manage
- ✅ **Fast**: Cold starts only happen occasionally (2-5s)
- ✅ **Global CDN**: Fast responses worldwide
- ✅ **Easy Setup**: GitHub → Vercel → Done

---

## 🚀 Quick Deploy to Vercel

### Step 1: Get Your Auth Tokens (One-time setup)

You need to extract tokens from your Proton account **once** on a local machine:

#### Option A: Use Browser Auth (Easiest)

1. **Install Node.js 18+** (temporary, only for setup)
2. **Clone and setup:**
   ```bash
   git clone https://github.com/jake56667788/lumo-ai.git
   cd lumo-ai
   npm install
   npm run build
   ```

3. **Authenticate via browser:**
   - Close all Chrome/Brave/Edge windows
   - Start browser with debug mode:
     ```powershell
     # Windows PowerShell
     & "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222
     
     # Or Chrome
     & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
     ```
   - Log in to [https://lumo.proton.me](https://lumo.proton.me) in the new browser window
   - In terminal, run:
     ```bash
     node dist/src/tamer.js auth browser
     # Press Enter when prompted for CDP endpoint
     ```

4. **Export tokens for Vercel:**
   ```bash
   npx tsx scripts/export-tokens.ts
   ```
   
   **Copy the output** - you'll need these values!

#### Option B: Manual Token Extraction (Advanced)

If you can't run the script, manually extract from browser DevTools:
- Console: `localStorage.getItem('ps-1')` (replace `1` with your session ID)
- Cookies: Look for `AUTH-{uid}` and `REFRESH-{uid}` on `lumo.proton.me`
- Extract `UID`, `access_token`, `refresh_token` from the JSON blob

---

### Step 2: Deploy to Vercel

#### 2A: Push to GitHub

If you don't already have a GitHub repo:

```bash
git init
git add .
git commit -m "Initial Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/lumo-ai.git
git branch -M main
git push -u origin main
```

#### 2B: Import in Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"** → Select `YOUR_USERNAME/lumo-ai`
3. **Configure Project:**
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Add Environment Variables** (CRITICAL):

   Click **"Environment Variables"** and add these (replace with your values):

   | Variable | Value | Required |
   |----------|-------|----------|
   | `LUMO_TAMER_UID` | `<your-uid>` | ✅ Yes |
   | `LUMO_TAMER_ACCESS_TOKEN` | `<your-access-token>` | ✅ Yes |
   | `LUMO_TAMER_REFRESH_TOKEN` | `<your-refresh-token>` | ✅ Strongly recommended |
   | `LUMO_TAMER_KEY_PASSWORD` | `<password-if-you-have-it>` | Optional |
   | `LUMO_TAMER_USER_KEYS` | `[...]` | Optional (JSON array) |
   | `LUMO_TAMER_MASTER_KEYS` | `[...]` | Optional (JSON array) |

   **Check all environments** (Production, Preview, Development)

5. **Click "Deploy"**

Wait ~2 minutes for the build to complete. Vercel will give you a URL like:
```
https://lumo-ai-username.vercel.app
```

---

### Step 3: Test Your Deployment

#### Health Check (No auth required)
```bash
curl https://lumo-ai-username.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "auth": {
    "method": "environment",
    "valid": true
  }
}
```

#### Test Chat API (Optional API key protection)

By default, lumo-tamer accepts all requests. To protect your deployment, set an API key in Vercel:

1. In `config.defaults.yaml` (before building), add:
   ```yaml
   server:
     apiKey: "my-secret-key-123"
   ```
   
2. Build, commit, and push to trigger redeploy

3. Then use the API with authentication:
   ```bash
   curl -X POST https://lumo-ai-username.vercel.app/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer my-secret-key-123" \
     -d '{
       "model": "lumo",
       "messages": [{"role": "user", "content": "Hello!"}]
     }'
   ```

---

## 🎯 Usage in Popular Apps

### Open WebUI

1. Admin Settings → Connections → Add Provider
2. **Base URL**: `https://lumo-ai-username.vercel.app/v1`
3. **API Key**: `my-secret-key-123` (or leave blank if unprotected)
4. **Models**: Add manually: `lumo`, `lumo-lite`, `lumo-max`

### VS Code / Cursor

Use any extension that supports custom OpenAI endpoints:

- **Base URL**: `https://lumo-ai-username.vercel.app/v1`
- **API Key**: (same as above)
- **Model**: `lumo`

### Home Assistant

In `configuration.yaml`:
```yaml
openai_conversation:
  api_key: "my-secret-key-123"
  base_url: "https://lumo-ai-username.vercel.app/v1"
  conversation_agent: lumo
```

### Obsidian / Other Apps

Any app supporting custom OpenAI endpoints will work!

---

## 🔧 Available Models

- `lumo` - Standard Lumo model
- `lumo-lite` - Faster, cheaper
- `lumo-max` - Most capable (if available)

## 💡 Tips & Tricks

### Reduce Cold Starts
- Keep the service warm with periodic pings (cron job every 15 min)
- Upgrade to Vercel Pro ($20/mo) for instant cold-start-free deployments

### Cost Estimation (Free Tier)
- **50-100 messages/day**: Well within free limits
- **Monthly cost**: $0 (free tier covers up to 100k requests)

### Token Expiry
- Access tokens expire after 24 hours
- With `LUMO_TAMER_REFRESH_TOKEN`, auto-refresh works seamlessly
- Without refresh token, re-run `tamer auth browser` locally every 24h

---

## ⚠️ Important Notes

### Privacy
- All communications are encrypted end-to-end
- Proton logs nothing about your prompts
- Your tokens are stored only in Vercel's environment variables (encrypted at rest)

### Terms of Service
- This is an unofficial, personal project
- Not affiliated with or endorsed by Proton AG
- May violate Proton's ToS; use at your own risk
- Official API support coming soon (this will become obsolete)

### Limitations
- **Cold starts**: 2-5s delay on free tier (first request after ~15min idle)
- **Timeout**: Max 60s per request (configure longer in Vercel paid plans)
- **Rate limiting**: Respect Proton's rate limits (start slow)

---

## 🛠️ Troubleshooting

### "Invalid API key"
- Check that you set the correct key in Vercel env vars
- If no key is set in config, API accepts all requests (no auth)

### "Logger not initialized" / "Circular dependency"
- Redeploy after pulling latest changes

### "No vault found"
- You haven't extracted tokens yet. Run the auth steps above.

### "Refresh token expired"
- Re-run `tamer auth browser` locally and update `LUMO_TAMER_REFRESH_TOKEN`

---

## 📚 Advanced Configuration

### Custom Domain
Add your own domain in Vercel:
- Settings → Domains → Add domain
- Point CNAME to your Vercel deployment

### API Key Protection
To require API key on all requests:

1. Edit `config.defaults.yaml`:
   ```yaml
   server:
     apiKey: "super-secret-key-change-this"
   ```

2. Commit and push to trigger redeploy

3. Now all API calls require:
   ```
   Authorization: Bearer super-secret-key-change-this
   ```

### Disable Auto-Refresh
If you want manual control:
```yaml
auth:
  autoRefresh:
    enabled: false
```

---

## 🤝 Contributing

This is a hobby project in active development. Contributions welcome!

- Issues: Report bugs or request features
- PRs: Submit improvements (test coverage appreciated)
- Star: ⭐ if you find it useful!

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔒 Security Disclosure

This project extracts authentication tokens from browser sessions. While it encrypts them at rest, the extraction process requires physical access to your device and a logged-in browser session. This is by design - tokens must come from somewhere.

**Never share your tokens or API keys publicly.**

---

## 🙏 Credits

- Built on [Proton Lumo](https://lumo.proton.me)
- Inspired by the community's desire for API access
- Uses Proton's existing web protocols (reverse-engineered)

---

**Enjoy your private, portable Lumo AI!** 🎉
