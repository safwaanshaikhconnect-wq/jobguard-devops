# JobGuard Core

An automated employment fraud detection matrix. JobGuard aggregates 7 specialized network sensors (including ML patterns, DNS MX, and government registries) to perform forensic analysis on job postings and detect scams.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: FastAPI + Python 3.12 (AsyncIO)
- **Primary AI**: Groq Llama 3.3
- **Network Sensors**: VirusTotal, DNS MX Validation, MCA Registry (simulated), Indian Pincode API

## Setup Instructions

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. Configure `.env` with required API keys (Groq, HuggingFace, VirusTotal).
6. Run the server: `python -m uvicorn main:app --reload --port 8000`

### Frontend Setup
1. Ensure you are in the root directory.
2. `npm install`
3. Configure `.env` with your `VITE_API_URL` (backend URL).
4. Run the UI: `npm run dev`

Navigate to `http://localhost:3000` to access the JobGuard Intelligence Dashboard.
