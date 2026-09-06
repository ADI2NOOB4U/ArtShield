import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadVerificationReferences, saveVerificationReference, verificationReferenceStorageKey } from "../src/verificationReference.ts";
import type { VerificationReference } from "../src/verificationReference.ts";

function storage() {
	const values = new Map<string, string>();
	return {
		getItem(key: string) { return values.get(key) ?? null; },
		setItem(key: string, value: string) { values.set(key, value); },
	};
}

const reference: VerificationReference = {
	sourceFingerprint: "a".repeat(64),
	protectedArtifactHash: "b".repeat(64),
	watermark: "ArtShield",
	metadata: { title: "Study", artist: "A" },
	verificationScope: "protected-artifact",
};

	describe("exhibition verification reference persistence", () => {
	it("restores the saved protected-artifact reference after reload", () => {
		const savedStorage = storage();
		saveVerificationReference(reference, savedStorage);
		assert.deepEqual(loadVerificationReferences(savedStorage), { [reference.protectedArtifactHash]: reference });
	});

	it("keeps four independent references and selects them without overwriting", () => {
		const savedStorage = storage();
		const references = Array.from({ length: 4 }, (_, index) => ({
			...reference,
			sourceFingerprint: String(index + 1).repeat(64),
			protectedArtifactHash: String(index + 5).repeat(64),
		}));
		references.forEach((item) => saveVerificationReference(item, savedStorage));
		const restored = loadVerificationReferences(savedStorage);
		assert.equal(Object.keys(restored).length, 4);
		references.forEach((item) => assert.deepEqual(restored[item.protectedArtifactHash], item));
	});

	it("rejects incomplete references and migrates a legacy reference", () => {
		const savedStorage = storage();
		savedStorage.setItem(verificationReferenceStorageKey, JSON.stringify({ [reference.protectedArtifactHash]: { ...reference, watermark: "" } }));
		assert.deepEqual(loadVerificationReferences(savedStorage), {});
		const legacyStorage = storage();
		legacyStorage.setItem("artshield.exhibition.verification-reference.v1", JSON.stringify(reference));
		assert.deepEqual(loadVerificationReferences(legacyStorage), { [reference.protectedArtifactHash]: reference });
	});
});
