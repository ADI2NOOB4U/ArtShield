from __future__ import annotations

import io
import json
import unittest

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
            data={"watermark": "artshield:test", "metadata_json": json.dumps(self.metadata)},
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(len(body["fingerprint"]), 64)
        self.assertTrue(body["protected_image_base64"])

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
            data={"watermark": "artshield:test", "metadata_json": json.dumps(self.metadata)},
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


if __name__ == "__main__":
    unittest.main()
