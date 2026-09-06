"""Controlled, synthetic-only Phase 3 research experiments.

This module never loads model files or reads client-provided filesystem paths.
All data is generated in memory and result artifacts are written below the
repository's fixed data/experimental/results directory.
"""

from __future__ import annotations

import json
import math
import re
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

EXPERIMENT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$")
MAX_SAMPLES = 256
RESULTS_ROOT = Path(__file__).resolve().parents[3] / "data" / "experimental" / "results"


@dataclass(frozen=True)
class ExperimentConfig:
    experiment_id: str
    seed: int = 7
    samples_per_class: int = 32
    poisoning_ratio: float = 0.2
    perturbation_budget: float = 0.05

    def validate(self) -> None:
        if not EXPERIMENT_ID.fullmatch(self.experiment_id):
            raise ValueError("experiment_id must be 3-64 safe characters")
        if not 0 <= self.seed <= 2**32 - 1:
            raise ValueError("seed is out of range")
        if not 4 <= self.samples_per_class <= MAX_SAMPLES // 2:
            raise ValueError("samples_per_class must be between 4 and 128")
        if not 0 <= self.poisoning_ratio <= 0.5:
            raise ValueError("poisoning_ratio must be between 0 and 0.5")
        if not 0 <= self.perturbation_budget <= 0.25:
            raise ValueError("perturbation_budget must be between 0 and 0.25")


@dataclass(frozen=True)
class SyntheticDataset:
    images: np.ndarray
    labels: np.ndarray
    identifiers: tuple[str, ...]


def generate_dataset(seed: int, samples_per_class: int) -> SyntheticDataset:
    rng = np.random.default_rng(seed)
    size = 16
    images: list[np.ndarray] = []
    labels: list[int] = []
    identifiers: list[str] = []
    for label in (0, 1):
        for index in range(samples_per_class):
            image = rng.normal(0.0, 0.035, (size, size)).astype(np.float32)
            if label == 0:
                image += np.linspace(0.1, 0.9, size, dtype=np.float32)[None, :]
            else:
                image += np.linspace(0.1, 0.9, size, dtype=np.float32)[:, None]
            images.append(np.clip(image, 0, 1))
            labels.append(label)
            identifiers.append(f"synthetic-{label}-{index}")
    return SyntheticDataset(np.stack(images), np.asarray(labels), tuple(identifiers))


def _features(images: np.ndarray) -> np.ndarray:
    return images.reshape(len(images), -1).astype(np.float64)


def _metrics(model: LogisticRegression, features: np.ndarray, labels: np.ndarray) -> dict[str, Any]:
    predictions = model.predict(features)
    matrix = confusion_matrix(labels, predictions, labels=[0, 1]).tolist()
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "precision": float(precision_score(labels, predictions, zero_division=0)),
        "recall": float(recall_score(labels, predictions, zero_division=0)),
        "f1": float(f1_score(labels, predictions, zero_division=0)),
        "confusion_matrix": matrix,
    }


def _fit(features: np.ndarray, labels: np.ndarray, seed: int) -> LogisticRegression:
    model = LogisticRegression(random_state=seed, solver="liblinear", max_iter=250)
    model.fit(features, labels)
    return model


def _trigger(images: np.ndarray, value: float = 1.0) -> np.ndarray:
    result = images.copy()
    result[:, -2:, -2:] = value
    return result


def _split(dataset: SyntheticDataset, seed: int):
    indexes = np.arange(len(dataset.labels))
    train, test = train_test_split(indexes, test_size=0.25, random_state=seed, stratify=dataset.labels)
    return dataset.images[train], dataset.labels[train], dataset.images[test], dataset.labels[test], train, test


def _poison_training(images: np.ndarray, labels: np.ndarray, ratio: float, seed: int, budget: float) -> tuple[np.ndarray, np.ndarray, list[int]]:
    count = int(math.floor(len(labels) * ratio))
    if count == 0:
        return images.copy(), labels.copy(), []
    rng = np.random.default_rng(seed)
    selected = sorted(rng.choice(len(labels), count, replace=False).tolist())
    poisoned_images = images.copy()
    poisoned_labels = labels.copy()
    poisoned_images[selected] = np.clip(
        poisoned_images[selected] + rng.uniform(-budget, budget, poisoned_images[selected].shape),
        0,
        1,
    )
    poisoned_images[selected] = _trigger(poisoned_images[selected], 1.0)
    poisoned_labels[selected] = 1 - poisoned_labels[selected]
    return poisoned_images, poisoned_labels, selected


def run_experiment(config: ExperimentConfig) -> dict[str, Any]:
    config.validate()
    RESULTS_ROOT.mkdir(parents=True, exist_ok=True)
    artifact = RESULTS_ROOT / f"{config.experiment_id}.json"
    if artifact.exists():
        raise FileExistsError("experiment_id already has a result artifact")

    dataset = generate_dataset(config.seed, config.samples_per_class)
    train_images, train_labels, test_images, test_labels, train_indexes, test_indexes = _split(dataset, config.seed)
    clean_model = _fit(_features(train_images), train_labels, config.seed)
    clean_metrics = _metrics(clean_model, _features(test_images), test_labels)
    poisoned_images, poisoned_labels, poisoned_indexes = _poison_training(train_images, train_labels, config.poisoning_ratio, config.seed, config.perturbation_budget)
    poisoned_model = _fit(_features(poisoned_images), poisoned_labels, config.seed)
    poisoned_metrics = _metrics(poisoned_model, _features(test_images), test_labels)

    triggered_test = _trigger(test_images)
    triggered_predictions = poisoned_model.predict(_features(triggered_test))
    target_one_rate = float(np.mean(triggered_predictions == 1))
    clean_activation_rate = float(np.mean(poisoned_model.predict(_features(test_images)) == 1))

    clean_embeddings = _features(train_images)[:, ::8]
    manipulated_embeddings = _features(poisoned_images)[:, ::8]
    displacement = float(np.mean(np.linalg.norm(manipulated_embeddings - clean_embeddings, axis=1)))
    centroid_displacement = float(np.linalg.norm(manipulated_embeddings.mean(axis=0) - clean_embeddings.mean(axis=0)))

    gradient_features = _features(train_images)
    probabilities = clean_model.predict_proba(gradient_features)[:, 1]
    gradient = ((probabilities - train_labels)[:, None] * gradient_features).mean(axis=0)
    contaminated_gradient_features = _features(poisoned_images)
    contaminated_probabilities = clean_model.predict_proba(contaminated_gradient_features)[:, 1]
    contaminated_gradient = ((contaminated_probabilities - poisoned_labels)[:, None] * contaminated_gradient_features).mean(axis=0)
    gradient_shift = float(np.linalg.norm(contaminated_gradient - gradient))

    signature_scores = np.linalg.norm(manipulated_embeddings - clean_embeddings, axis=1)
    threshold = float(np.quantile(signature_scores, 0.9))
    suspicious_count = int(np.sum(signature_scores >= threshold)) if poisoned_indexes else 0
    signature_label = "CLEAN" if not poisoned_indexes else ("POISON-LIKELY" if suspicious_count > 0 else "SUSPICIOUS")

    result = {
        "experiment_id": config.experiment_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "seed": config.seed,
        "dataset_identifier": "artshield-synthetic-patterns-v1",
        "model_identifier": "sklearn-logistic-regression-liblinear",
        "configuration": asdict(config),
        "dataset": {"total": len(dataset.labels), "train": len(train_indexes), "test": len(test_indexes), "classes": [0, 1], "clean_dataset_preserved": True},
        "poisoning": {"selected_training_samples": len(poisoned_indexes), "ratio_observed": len(poisoned_indexes) / len(train_labels), "indices": poisoned_indexes},
        "baseline_metrics": clean_metrics,
        "poisoned_metrics": poisoned_metrics,
        "backdoor_research": {"target_class": 1, "trigger": "2x2 bottom-right research marker", "triggered_target_rate": target_one_rate, "clean_activation_rate": clean_activation_rate},
        "feature_space": {"embedding_dimensions": int(clean_embeddings.shape[1]), "mean_displacement": displacement, "centroid_displacement": centroid_displacement},
        "gradient_research": {"clean_gradient_norm": float(np.linalg.norm(gradient)), "contaminated_gradient_norm": float(np.linalg.norm(contaminated_gradient)), "gradient_shift": gradient_shift, "budget": config.perturbation_budget},
        "signature": {"label": signature_label, "score_threshold": threshold, "suspicious_count": suspicious_count, "signals": ["embedding_displacement", "controlled_trigger_and_label_flip"] if poisoned_indexes else []},
        "artifact_references": [str(artifact.relative_to(RESULTS_ROOT.parent.parent))],
        "provenance": "controlled synthetic local experiment; not evidence about external models or datasets",
    }
    artifact.write_text(json.dumps(result, indent=2, sort_keys=True), encoding="utf-8")
    return result


def inspect_signature(images: np.ndarray, reference_images: np.ndarray) -> dict[str, Any]:
    if images.ndim != 3 or reference_images.ndim != 3 or images.shape[1:] != reference_images.shape[1:]:
        raise ValueError("images must be matching 3D arrays")
    distances = np.linalg.norm(_features(images)[:, ::8] - _features(reference_images)[: len(images), ::8], axis=1)
    score = float(np.mean(distances))
    label = "CLEAN" if score < 0.5 else ("SUSPICIOUS" if score < 2.0 else "POISON-LIKELY")
    return {"label": label, "score": score, "reasons": ["embedding displacement"] if score >= 0.5 else []}
