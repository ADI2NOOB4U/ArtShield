from __future__ import annotations

import json
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.research.experiments import ExperimentConfig, RESULTS_ROOT, generate_dataset, inspect_signature, run_experiment


class PhaseThreeExperimentTests(unittest.TestCase):
    def tearDown(self):
        for artifact in RESULTS_ROOT.glob("phase3-test-*.json"):
            artifact.unlink()

    def test_reproducible_controlled_experiment_and_artifact(self):
        config = ExperimentConfig("phase3-test-repeat", seed=11, samples_per_class=12, poisoning_ratio=0.25, perturbation_budget=0.04)
        first = run_experiment(config)
        artifact = RESULTS_ROOT / "phase3-test-repeat.json"
        self.assertTrue(artifact.exists())
        saved = json.loads(artifact.read_text(encoding="utf-8"))
        second = run_experiment(ExperimentConfig("phase3-test-repeat-2", seed=11, samples_per_class=12, poisoning_ratio=0.25, perturbation_budget=0.04))
        self.assertEqual(first["baseline_metrics"], second["baseline_metrics"])
        self.assertEqual(first["poisoned_metrics"], second["poisoned_metrics"])
        self.assertEqual(saved["dataset"]["classes"], [0, 1])
        self.assertGreaterEqual(first["feature_space"]["mean_displacement"], 0)
        self.assertGreaterEqual(first["gradient_research"]["gradient_shift"], 0)

    def test_invalid_configuration_and_duplicate_artifact_are_rejected(self):
        with self.assertRaises(ValueError):
            run_experiment(ExperimentConfig("bad/path", poisoning_ratio=0.9))
        with self.assertRaises(ValueError):
            run_experiment(ExperimentConfig("phase3-test-invalid", perturbation_budget=-1))
        run_experiment(ExperimentConfig("phase3-test-duplicate", samples_per_class=8))
        with self.assertRaises(FileExistsError):
            run_experiment(ExperimentConfig("phase3-test-duplicate", samples_per_class=8))

    def test_signature_rejects_malformed_shapes_and_labels_displacement(self):
        dataset = generate_dataset(3, 8)
        clean = inspect_signature(dataset.images, dataset.images)
        self.assertEqual(clean["label"], "CLEAN")
        manipulated = dataset.images.copy()
        manipulated[:, :2, :2] = 1
        suspicious = inspect_signature(manipulated, dataset.images)
        self.assertIn(suspicious["label"], {"SUSPICIOUS", "POISON-LIKELY"})
        with self.assertRaises(ValueError):
            inspect_signature(dataset.images, dataset.images[:, :-1])

    def test_api_rejects_paths_and_invalid_ratios(self):
        client = TestClient(app)
        path_attempt = client.post("/v1/experiments/poisoning", json={"experiment_id": "../escape", "poisoning_ratio": 0.1})
        self.assertEqual(path_attempt.status_code, 422)
        invalid_ratio = client.post("/v1/experiments/backdoor", json={"experiment_id": "phase3-test-api", "poisoning_ratio": 2})
        self.assertEqual(invalid_ratio.status_code, 422)
        unknown = client.post("/v1/experiments/unknown", json={"experiment_id": "phase3-test-api"})
        self.assertEqual(unknown.status_code, 404)


if __name__ == "__main__":
    unittest.main()