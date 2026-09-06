"""Reproducible local research evaluation for Layer 3.

This evaluates the existing seeded perturbation against the repository's small
synthetic logistic-regression model. It is not evidence of robustness against
external or adaptive models.
"""

from __future__ import annotations

import hashlib
import io
import time
from typing import Any

import numpy as np
from PIL import Image

from app.layers.layer03_adversarial.adversarial import apply_perturbation
from app.research.experiments import _features, _fit, _split, generate_dataset
from app.utils.image_utils import encode_png

MODEL_IDENTIFIER = "sklearn-logistic-regression-liblinear"
DATASET_IDENTIFIER = "artshield-synthetic-patterns-v1"
MAX_EVALUATION_EPSILON = 2 / 255


def _loss(model: Any, image: np.ndarray, label: int) -> float:
    probability = float(model.predict_proba(_features(image[None, ...]))[0, label])
    return float(-np.log(np.clip(probability, 1e-12, 1.0)))


def _prediction(model: Any, image: np.ndarray) -> int:
    return int(model.predict(_features(image[None, ...]))[0])


def _png_bytes(image: np.ndarray) -> bytes:
    pixels = np.clip(np.rint(image * 255), 0, 255).astype(np.uint8)
    output = io.BytesIO()
    mode = "RGB" if pixels.ndim == 3 else "L"
    Image.fromarray(pixels, mode=mode).save(output, format="PNG", optimize=True)
    return output.getvalue()


def _rgba_image(image: np.ndarray) -> Image.Image:
    pixels = np.clip(np.rint(image * 255), 0, 255).astype(np.uint8)
    return Image.fromarray(pixels, mode="L").convert("RGBA")


def _rgb_channels(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0


def _metrics(original: np.ndarray, changed: np.ndarray) -> dict[str, float]:
    original_pixels = np.rint(original * 255).astype(np.int16)
    changed_pixels = np.rint(changed * 255).astype(np.int16)
    delta = (changed_pixels - original_pixels).astype(np.float64) / 255.0
    return {
        "linf": float(np.max(np.abs(delta))),
        "l2": float(np.linalg.norm(delta)),
        "mean_absolute_change": float(np.mean(np.abs(delta))),
    }


def _gradient_adversarial(model: Any, image: np.ndarray, label: int, epsilon: float) -> np.ndarray:
    features = _features(image[None, ...])[0]
    probability = float(model.predict_proba(features[None, :])[0, 1])
    coefficient = np.asarray(model.coef_[0], dtype=np.float64)
    gradient = (probability - label) * coefficient
    return np.clip(features + epsilon * np.sign(gradient), 0.0, 1.0).reshape(image.shape).astype(np.float32)


def evaluate_layer3(
    *,
    seed: int = 7,
    samples_per_class: int = 32,
    sample_index: int = 0,
    strength: int = 1,
    epsilon: float | None = None,
) -> dict[str, Any]:
    started = time.perf_counter()
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= 2**32 - 1:
        raise ValueError("seed is out of range")
    if isinstance(samples_per_class, bool) or not isinstance(samples_per_class, int) or not 4 <= samples_per_class <= 128:
        raise ValueError("samples_per_class must be between 4 and 128")
    if isinstance(strength, bool) or not isinstance(strength, int) or strength not in (1, 2):
        raise ValueError("strength must be 1 or 2")
    if isinstance(sample_index, bool) or not isinstance(sample_index, int):
        raise ValueError("sample_index must be an integer")
    gradient_epsilon = strength / 255 if epsilon is None else float(epsilon)
    if not 0 < gradient_epsilon <= MAX_EVALUATION_EPSILON:
        raise ValueError("epsilon must be greater than 0 and at most 2/255")

    dataset = generate_dataset(seed, samples_per_class)
    train_images, train_labels, test_images, test_labels, _, _ = _split(dataset, seed)
    if not 0 <= sample_index < len(test_labels):
        raise ValueError(f"sample_index must be between 0 and {len(test_labels) - 1}")
    original = test_images[sample_index].astype(np.float32)
    label = int(test_labels[sample_index])
    model = _fit(_features(train_images), train_labels, seed)

    # This is the existing Layer 3 mechanism: bounded, seeded, non-gradient noise.
    protected_rgba = apply_perturbation(_rgba_image(original), f"layer3-{seed}-{sample_index}", strength=strength)
    protected = _rgb_channels(protected_rgba)
    quantized_original = np.rint(original * 255).astype(np.uint8).astype(np.float32) / 255.0
    original_rgb = np.repeat(quantized_original[:, :, None], 3, axis=2)
    gradient_image = _gradient_adversarial(model, original, label, gradient_epsilon)
    repeated_rgba = apply_perturbation(_rgba_image(original), f"layer3-{seed}-{sample_index}", strength=strength)
    reproducible = list(protected_rgba.get_flattened_data()) == list(repeated_rgba.get_flattened_data())

    baseline_loss = _loss(model, original, label)
    protected_loss = _loss(model, protected[:, :, 0], label)
    adversarial_loss = _loss(model, gradient_image, label)
    protected_prediction = _prediction(model, protected[:, :, 0])
    adversarial_prediction = _prediction(model, gradient_image)
    protected_metrics = _metrics(original_rgb, protected)
    adversarial_metrics = _metrics(original, gradient_image)
    original_bytes = _png_bytes(original)
    protected_bytes = _png_bytes(protected)

    return {
        "layer": 3,
        "method": "bounded-seeded-pixel-perturbation",
        "model": MODEL_IDENTIFIER,
        "dataset": DATASET_IDENTIFIER,
        "seed": seed,
        "sample_index": sample_index,
        "label": label,
        "epsilon": gradient_epsilon,
        "strength": strength,
        "baseline_prediction": _prediction(model, original),
        "baseline_loss": baseline_loss,
        "protected_prediction": protected_prediction,
        "protected_loss": protected_loss,
        "adversarial_prediction": adversarial_prediction,
        "adversarial_loss": adversarial_loss,
        "gradient_method": "logistic-regression-input-gradient-fgsm",
        "gradient_attack_success": adversarial_prediction != label,
        "protected_metrics": protected_metrics,
        "adversarial_metrics": adversarial_metrics,
        "linf": protected_metrics["linf"],
        "l2": protected_metrics["l2"],
        "mean_absolute_change": protected_metrics["mean_absolute_change"],
        "reproducible": reproducible,
        "original_sha256": hashlib.sha256(original_bytes).hexdigest(),
        "protected_sha256": hashlib.sha256(protected_bytes).hexdigest(),
        "image_shape": [int(value) for value in original.shape],
        "objective": "measure model loss and prediction changes; no production-defense claim",
        "runtime_ms": (time.perf_counter() - started) * 1000,
        "limitations": [
            "synthetic local dataset only",
            "single scikit-learn logistic-regression model",
            "bounded seeded perturbation is not gradient-based",
            "not evidence against external, generative, or adaptive models",
        ],
    }
