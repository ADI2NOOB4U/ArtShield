"""FastAPI routes for the Phase 1 ML service."""

from __future__ import annotations

import base64
import binascii
import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
HTTP_413 = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413)

from app.layers.layer01_fingerprint.fingerprint import create_fingerprint
from app.layers.layer02_steganography.steganography import WatermarkError, embed_watermark
from app.layers.layer03_adversarial.adversarial import apply_perturbation
from app.layers.layer05_forgery.forgery import assess_forgery
from app.schemas.response import ProtectionResponse, VerificationResponse
from app.utils.image_utils import InvalidImage, encode_png, open_image
from app.utils.crypto_utils import artifact_hash
from app.research.experiments import ExperimentConfig, run_experiment
from app.layers.layer13_model_inversion.model_inversion import PrivacyQueryGuard, suppress_confidence
from app.layers.layer14_prompt_vaccine.prompt_vaccine import analyze_prompt
from app.layers.layer15_polyglot.polyglot_detector import analyze_file
from app.schemas.phase4 import FileCheckRequest, InversionRequest, PromptRequest

router = APIRouter(prefix="/v1")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
privacy_query_guard = PrivacyQueryGuard()


def reset_privacy_query_guard_for_tests() -> None:
    global privacy_query_guard
    privacy_query_guard = PrivacyQueryGuard()


async def read_upload(upload: UploadFile) -> bytes:
    if not upload.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="image filename is required")
    data = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=HTTP_413, detail="image exceeds the 10 MiB limit")
    return data


def parse_metadata(metadata_json: str) -> dict:
    try:
        metadata = json.loads(metadata_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=HTTP_422, detail="metadata_json must be valid JSON") from exc
    if not isinstance(metadata, dict):
        raise HTTPException(status_code=HTTP_422, detail="metadata_json must contain an object")
    return metadata


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml-service", "phase": "1"}


@router.post("/security/model-inversion")
def model_inversion_defense(payload: InversionRequest) -> dict:
    decision = privacy_query_guard.check(payload.feature_vector)
    return {"status": "PROTECTED" if decision["allowed"] else "BLOCKED", "query": decision, "confidence_policy": suppress_confidence([0.0, 1.0])}


@router.post("/security/prompt-check")
def prompt_check(payload: PromptRequest) -> dict:
    result = analyze_prompt(payload.prompt, payload.policy)
    status_value = "SAFE" if not result.signals else ("BLOCKED" if result.policy == "BLOCK" else "SUSPICIOUS")
    return {"status": status_value, "decision": result.__dict__}


@router.post("/security/file-check")
def file_check(payload: FileCheckRequest) -> dict:
    try:
        data = base64.b64decode(payload.data_base64, validate=True)
        result = analyze_file(data, payload.filename, payload.declared_mime)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    return {"status": result.decision, "analysis": result.__dict__}


@router.post("/experiments/{experiment_kind}")
def run_research_experiment(experiment_kind: str, payload: dict) -> dict:
    allowed = {"poisoning", "backdoor", "features", "gradient", "signature"}
    if experiment_kind not in allowed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown research experiment")
    try:
        if experiment_kind == "signature":
            raise ValueError("signature endpoint requires controlled in-process arrays")
        config = ExperimentConfig(
            experiment_id=payload.get("experiment_id", ""),
            seed=payload.get("seed", 7),
            samples_per_class=payload.get("samples_per_class", 32),
            poisoning_ratio=payload.get("poisoning_ratio", 0.2),
            perturbation_budget=payload.get("perturbation_budget", 0.05),
        )
        return run_experiment(config)
    except FileExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc


@router.post("/protect", response_model=ProtectionResponse)
async def protect(
    image: UploadFile = File(...),
    watermark: str = Form(..., min_length=1, max_length=2048),
    metadata_json: str = Form(...),
) -> ProtectionResponse:
    raw = await read_upload(image)
    metadata = parse_metadata(metadata_json)
    try:
        source = open_image(raw)
        fingerprint = create_fingerprint(raw, metadata)
        perturbed = apply_perturbation(source, fingerprint, strength=1)
        protected = embed_watermark(perturbed, watermark)
        protected_bytes = encode_png(protected)
    except (InvalidImage, WatermarkError, ValueError) as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    return ProtectionResponse(
        fingerprint=fingerprint,
        watermark=watermark,
        protected_image_base64=base64.b64encode(protected_bytes).decode("ascii"),
        protected_artifact_hash=artifact_hash(protected_bytes),
    )


@router.post("/verify", response_model=VerificationResponse)
async def verify(
    image: UploadFile = File(...),
    expected_fingerprint: str = Form(..., min_length=64, max_length=64),
    metadata_json: str = Form(...),
    expected_watermark: str | None = Form(None, max_length=2048),
    expected_artifact_hash: str | None = Form(None, min_length=64, max_length=64),
) -> VerificationResponse:
    raw = await read_upload(image)
    metadata = parse_metadata(metadata_json)
    try:
        assessment = assess_forgery(raw, metadata, expected_fingerprint, expected_watermark, expected_artifact_hash)
    except InvalidImage as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    return VerificationResponse(
        authentic=assessment.authentic,
        fingerprint_match=assessment.fingerprint_match,
        watermark_match=assessment.watermark_match,
        artifact_hash_match=assessment.artifact_hash_match,
        verification_scope="protected-artifact" if expected_artifact_hash is not None else "source",
        reasons=list(assessment.reasons),
    )