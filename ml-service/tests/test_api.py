from __future__ import annotations

import base64
import io
import json
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        image = Image.new("RGBA", (64, 64), (40, 80, 120, 255))
        output = io.BytesIO()
        image.save(output, format="PNG")
        cls.image = output.getvalue()
        cls.metadata = {"title": "Study", "artist": "A"}

    def test_health_and_protection(self):
        self.assertEqual(self.client.get("/v1/health").status_code, 200)
        response = self.client.post(
            "/v1/protect",
            files={"image": ("art.png", self.image, "image/png")},
            data={"watermark": "ArtShield", "metadata_json": json.dumps(self.metadata)},
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(len(body["fingerprint"]), 64)
        self.assertTrue(body["protected_image_base64"])

    def test_configured_ml_service_token_blocks_direct_access(self):
        with patch.dict("os.environ", {"ML_SERVICE_TOKEN": "test-internal-token"}):
            denied = self.client.post("/v1/security/prompt-check", json={"prompt": "hello", "policy": "WARN"})
            self.assertEqual(denied.status_code, 401)
            allowed = self.client.post(
                "/v1/security/prompt-check",
                headers={"x-artshield-ml-token": "test-internal-token"},
                json={"prompt": "hello", "policy": "WARN"},
            )
            self.assertEqual(allowed.status_code, 200, allowed.text)

    def test_layer3_evaluation_endpoint_returns_structured_research_measurements(self):
        response = self.client.post("/v1/research/layer3/evaluate", json={"seed": 11, "samples_per_class": 16, "sample_index": 0, "strength": 1})
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["layer"], 3)
        self.assertEqual(body["model"], "sklearn-logistic-regression-liblinear")
        self.assertTrue(body["reproducible"])
        self.assertLessEqual(body["linf"], 1 / 255)
        self.assertIn("baseline_loss", body)
        self.assertIn("protected_loss", body)
        self.assertIn("adversarial_loss", body)
        invalid = self.client.post("/v1/research/layer3/evaluate", json={"epsilon": 3 / 255})
        self.assertEqual(invalid.status_code, 422)

    def test_malformed_metadata_and_file_are_rejected(self):
        malformed = self.client.post(
            "/v1/protect",
            files={"image": ("art.png", self.image, "image/png")},
            data={"watermark": "x", "metadata_json": "not-json"},
        )
        self.assertEqual(malformed.status_code, 422)
        invalid = self.client.post(
            "/v1/protect",
            files={"image": ("art.txt", b"not an image", "text/plain")},
            data={"watermark": "x", "metadata_json": "{}"},
        )
        self.assertEqual(invalid.status_code, 422)
        self.assertNotIn("Traceback", invalid.text)

    def test_oversized_upload_is_rejected(self):
        response = self.client.post(
            "/v1/protect",
            files={"image": ("large.bin", b"x" * (10 * 1024 * 1024 + 1), "application/octet-stream")},
            data={"watermark": "x", "metadata_json": "{}"},
        )
        self.assertEqual(response.status_code, 413)

    def test_protected_artifact_verifies_and_tampering_fails(self):
        protected = self.client.post(
            "/v1/protect",
            files={"image": ("art.png", self.image, "image/png")},
            data={"watermark": "ArtShield", "metadata_json": json.dumps(self.metadata)},
        ).json()
        protected_bytes = __import__("base64").b64decode(protected["protected_image_base64"])
        verified = self.client.post(
            "/v1/verify",
            files={"image": ("protected.png", protected_bytes, "image/png")},
            data={
                "expected_fingerprint": protected["fingerprint"],
                "expected_watermark": protected["watermark"],
                "expected_artifact_hash": protected["protected_artifact_hash"],
                "metadata_json": json.dumps(self.metadata),
            },
        )
        self.assertEqual(verified.status_code, 200, verified.text)
        self.assertTrue(verified.json()["authentic"])
        self.assertEqual(verified.json()["verification_scope"], "protected-artifact")
        tampered = bytearray(protected_bytes)
        tampered[-1] ^= 1
        rejected = self.client.post(
            "/v1/verify",
            files={"image": ("tampered.png", bytes(tampered), "image/png")},
            data={
                "expected_fingerprint": protected["fingerprint"],
                "expected_watermark": protected["watermark"],
                "expected_artifact_hash": protected["protected_artifact_hash"],
                "metadata_json": json.dumps(self.metadata),
            },
        )
        self.assertEqual(rejected.status_code, 200)
        self.assertFalse(rejected.json()["authentic"])

    def test_verification_reference_and_watermark_mismatches_fail(self):
        protected = self.client.post(
            "/v1/protect",
            files={"image": ("art.png", self.image, "image/png")},
            data={"watermark": "ArtShield", "metadata_json": json.dumps(self.metadata)},
        ).json()
        protected_bytes = base64.b64decode(protected["protected_image_base64"])
        original = self.client.post(
            "/v1/verify",
            files={"image": ("original.png", self.image, "image/png")},
            data={
                "expected_fingerprint": protected["fingerprint"],
                "expected_watermark": protected["watermark"],
                "expected_artifact_hash": protected["protected_artifact_hash"],
                "metadata_json": json.dumps(self.metadata),
            },
        )
        self.assertFalse(original.json()["authentic"])
        wrong_watermark = self.client.post(
            "/v1/verify",
            files={"image": ("protected.png", protected_bytes, "image/png")},
            data={
                "expected_fingerprint": protected["fingerprint"],
                "expected_watermark": "Wrong watermark",
                "expected_artifact_hash": protected["protected_artifact_hash"],
                "metadata_json": json.dumps(self.metadata),
            },
        )
        self.assertFalse(wrong_watermark.json()["authentic"])

    def test_verification_rejects_non_hex_digests_and_empty_watermarks(self):
        protected = self.client.post(
            "/v1/protect",
            files={"image": ("art.png", self.image, "image/png")},
            data={"watermark": "ArtShield", "metadata_json": json.dumps(self.metadata)},
        ).json()
        protected_bytes = base64.b64decode(protected["protected_image_base64"])
        base_data = {
            "expected_fingerprint": protected["fingerprint"],
            "expected_watermark": "ArtShield",
            "expected_artifact_hash": protected["protected_artifact_hash"],
            "metadata_json": json.dumps(self.metadata),
        }
        for field in ("expected_fingerprint", "expected_artifact_hash"):
            data = {**base_data, field: "z" * 64}
            response = self.client.post(
                "/v1/verify",
                files={"image": ("protected.png", protected_bytes, "image/png")},
                data=data,
            )
            self.assertEqual(response.status_code, 422, response.text)
            self.assertIn(field, response.text)

        response = self.client.post(
            "/v1/verify",
            files={"image": ("protected.png", protected_bytes, "image/png")},
            data={**base_data, "expected_watermark": ""},
        )
        self.assertEqual(response.status_code, 422, response.text)

    def test_four_independent_artifacts_keep_separate_references(self):
        protected_artifacts = []
        for index in range(4):
            image = Image.new("RGBA", (64, 64), (40 + index, 80 + index, 120 + index, 255))
            output = io.BytesIO()
            image.save(output, format="PNG")
            metadata = {"title": f"Artifact {index}", "artist": "A"}
            response = self.client.post(
                "/v1/protect",
                files={"image": (f"artifact-{index}.png", output.getvalue(), "image/png")},
                data={"watermark": f"ArtShield-{index}", "metadata_json": json.dumps(metadata)},
            )
            self.assertEqual(response.status_code, 200, response.text)
            body = response.json()
            artifact = base64.b64decode(body["protected_image_base64"])
            self.assertEqual(body["protected_artifact_hash"], __import__("hashlib").sha256(artifact).hexdigest())
            protected_artifacts.append((body, artifact, metadata))

        for body, artifact, metadata in protected_artifacts:
            response = self.client.post(
                "/v1/verify",
                files={"image": ("protected.png", artifact, "image/png")},
                data={
                    "expected_fingerprint": body["fingerprint"],
                    "expected_watermark": body["watermark"],
                    "expected_artifact_hash": body["protected_artifact_hash"],
                    "metadata_json": json.dumps(metadata),
                },
            )
            self.assertTrue(response.json()["authentic"], response.text)

        first, first_artifact, first_metadata = protected_artifacts[0]
        second, second_artifact, second_metadata = protected_artifacts[1]
        cross_reference = self.client.post(
            "/v1/verify",
            files={"image": ("artifact-a.png", first_artifact, "image/png")},
            data={
                "expected_fingerprint": second["fingerprint"],
                "expected_watermark": second["watermark"],
                "expected_artifact_hash": second["protected_artifact_hash"],
                "metadata_json": json.dumps(second_metadata),
            },
        )
        self.assertFalse(cross_reference.json()["authentic"])
        self.assertIn("protected artifact hash mismatch", cross_reference.json()["reasons"])

        for body, artifact, metadata in protected_artifacts:
            tampered = bytearray(artifact)
            tampered[-1] ^= 1
            response = self.client.post(
                "/v1/verify",
                files={"image": ("tampered.png", bytes(tampered), "image/png")},
                data={
                    "expected_fingerprint": body["fingerprint"],
                    "expected_watermark": body["watermark"],
                    "expected_artifact_hash": body["protected_artifact_hash"],
                    "metadata_json": json.dumps(metadata),
                },
            )
            self.assertFalse(response.json()["authentic"], response.text)
            self.assertFalse(response.json()["artifact_hash_match"])


if __name__ == "__main__":
    unittest.main()
