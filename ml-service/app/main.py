"""ArtShield Phase 1 ML service entrypoint."""

from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="ArtShield ML Service", version="1.0.0")
app.include_router(router)