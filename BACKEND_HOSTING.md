# 🚀 Deploying JobGuard (Frontend + Backend on Vercel)

JobGuard deploys as a single Vercel project — the React frontend and Python backend run on the **same domain**, eliminating CORS issues entirely.

## Architecture

```
https://jobguard-nu.vercel.app/          → Vite frontend (static)
https://jobguard-nu.vercel.app/api/*     → Python serverless functions (FastAPI)
```

## Deployment Steps

### 1. Push your code to GitHub
Make sure your repo includes:
- `api/index.py` — Vercel serverless entry point
- `requirements.txt` — Root-level Python dependencies
- `vercel.json` — Route configuration

### 2. Set Environment Variables on Vercel
In your **Vercel Dashboard** → **Settings** → **Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | `gsk_your_key_here` | ✅ Yes |
| `HF_API_KEY` | `hf_your_key_here` | ✅ Yes |
| `VT_API_KEY` | `your_virustotal_key` | ✅ Yes |

> **Note:** You do NOT need to set `VITE_API_URL`. The frontend auto-detects `/api` in production.

### 3. Redeploy
After setting env vars, trigger a redeployment from the Vercel dashboard or push a new commit.

### 4. Verify
Test the backend is working:
```
curl https://jobguard-nu.vercel.app/api/health
```
Expected response: `{"status": "ok", "service": "jobguard-api"}`

---

## Local Development

Run the frontend and backend separately:

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
npm install
npm run dev
```

The frontend auto-detects `http://localhost:8000` in dev mode.

---

## ⚠️ Limitations

- **Vercel Hobby plan** has a 10-second timeout for serverless functions. If analysis takes longer (due to slow external APIs), consider upgrading to Pro.
- **Cold starts**: First request after inactivity may take 2-5 seconds while the Python runtime boots.
