"""ArtShield Phase 1 ML service entrypoint.

The ML worker is intended to sit on a private network behind the Node API.
When ML_SERVICE_TOKEN is configured, every non-health request must carry it.
"""

import hmac
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import router

app = FastAPI(title="ArtShield ML Service", version="1.0.0")


@app.middleware("http")
async def require_internal_token(request: Request, call_next):
    if request.url.path == "/v1/health":
        return await call_next(request)
    token = os.getenv("ML_SERVICE_TOKEN")
    supplied = request.headers.get("x-artshield-ml-token", "")
    # Development may omit the variable for direct local test runs. Deployments
    # must set it; the backend then supplies it server-to-server.
    if token and not hmac.compare_digest(supplied, token):
        return JSONResponse(status_code=401, content={"detail": "ML service authorization required"})
    return await call_next(request)

app.include_router(router)
