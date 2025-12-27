"""
Vercel serverless entrypoint for the FastAPI app.
"""
from pathlib import Path
import sys

# Ensure the api directory is on sys.path so `app` package can be imported.
sys.path.append(str(Path(__file__).resolve().parent))

from app.main import app  # noqa: E402

# Vercel looks for a module-level `app` for ASGI frameworks (FastAPI).
