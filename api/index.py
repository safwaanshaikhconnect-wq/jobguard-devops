"""
Vercel Serverless Entry Point
Wraps the FastAPI backend app and mounts it under /api
so it works alongside the Vite frontend on the same domain.
"""
import sys
import os

# Add the backend directory to Python path so all its imports resolve correctly
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

# Load .env from backend directory (for local dev; Vercel uses dashboard env vars)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the original backend app
from main import app as backend_app

# Create a wrapper app that mounts the backend under /api
# Vercel sends requests with their original path (e.g., /api/analyze)
# The mount strips /api and forwards /analyze to backend_app
app = FastAPI()

# CORS for any external consumers (not needed for same-domain frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api", backend_app)
