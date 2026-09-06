from __future__ import annotations

import io
import unittest

from PIL import Image

from app.layers.layer01_fingerprint.fingerprint import create_fingerprint
from app.layers.layer02_steganography.steganography import WatermarkError, embed_watermark, extract_watermark
from app.layers.layer03_adversarial.adversarial import apply_perturbation
from app.layers.layer05_forgery.forgery import assess_forgery
from app.utils.image_utils import InvalidImage, encode_png, open_image


class PhaseOneLayerTests(unittest.TestCase):
    def make_image(self, size=(64, 64)) -> bytes:
        image = Image.new("RGBA", size, (40, 80, 120, 255))
        output = io.BytesIO()
        image.save(output, format="PNG")
        return output.getvalue()

    def test_fingerprint_binds_metadata(self):
        image = self.make_image()
        fingerprint = create_fingerprint(image, {"title": "Study", "artist": "A"})
        self.assertNotEqual(fingerprint, create_fingerprint(image, {"title": "Study", "artist": "B"}))

    def test_watermark_round_trip_and_tamper_detection(self):
        image = open_image(self.make_image())
        watermarked = embed_watermark(image, "artshield:test")
        self.assertEqual(extract_watermark(watermarked), "artshield:test")
        pixels = list(watermarked.get_flattened_data())
        payload_pixel = 110
        pixels[payload_pixel] = (pixels[payload_pixel][0] ^ 1, *pixels[payload_pixel][1:])
        tampered = Image.new("RGBA", watermarked.size)
        tampered.putdata(pixels)
        with self.assertRaises(WatermarkError):
            extract_watermark(tampered)

    def test_perturbation_is_bounded_and_deterministic(self):
        image = open_image(self.make_image())
        first = apply_perturbation(image, "fingerprint", strength=1)
        second = apply_perturbation(image, "fingerprint", strength=1)
        self.assertEqual(list(first.get_flattened_data()), list(second.get_flattened_data()))
        self.assertTrue(all(abs(a - b) <= 1 for left, right in zip(image.get_flattened_data(), first.get_flattened_data()) for a, b in zip(left[:3], right[:3])))

    def test_forgery_assessment_detects_tampered_metadata(self):
        image = self.make_image()
        metadata = {"title": "Study", "artist": "A"}
        fingerprint = create_fingerprint(image, metadata)
        assessment = assess_forgery(image, metadata, fingerprint)
        self.assertTrue(assessment.authentic)
        tampered = assess_forgery(image, {"title": "Tampered", "artist": "A"}, fingerprint)
        self.assertFalse(tampered.authentic)
        self.assertIn("metadata-bound fingerprint mismatch", tampered.reasons)

    def test_invalid_and_oversized_inputs_fail(self):
        with self.assertRaises(InvalidImage):
            open_image(b"not-an-image")
        with self.assertRaises(WatermarkError):
            embed_watermark(open_image(self.make_image((8, 8))), "x" * 2048)

    def test_png_encoding_produces_valid_image(self):
        encoded = encode_png(open_image(self.make_image()))
        self.assertTrue(encoded.startswith(b"\x89PNG\r\n\x1a\n"))


if __name__ == "__main__":
    unittest.main()
