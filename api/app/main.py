# api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, candidate, public, recruiter, notifications


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="HireMatch API",
        version="0.1.0",
        description="Role-based API for recruiters, candidates, and admins.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(public.router)
    app.include_router(candidate.router)
    app.include_router(recruiter.router)
    app.include_router(admin.router)
    app.include_router(notifications.router)
    return app


app = create_app()


@app.get("/")
def root():
    return {"status": "ok", "message": "HireMatch API running on Vercel"}
