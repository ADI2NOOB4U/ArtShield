export const verificationReferenceStorageKey = "artshield.exhibition.verification-references.v2";
const legacyVerificationReferenceStorageKey = "artshield.exhibition.verification-reference.v1";

export type VerificationReference = {
	sourceFingerprint: string;
	protectedArtifactHash: string;
	watermark: string;
	metadata: Record<string, unknown>;
	verificationScope: "protected-artifact";
};

export type VerificationReferences = Record<string, VerificationReference>;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function isVerificationReference(value: unknown): value is VerificationReference {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
	const reference = value as Partial<VerificationReference>;
	return typeof reference.sourceFingerprint === "string" && /^[a-f0-9]{64}$/i.test(reference.sourceFingerprint)
		&& typeof reference.protectedArtifactHash === "string" && /^[a-f0-9]{64}$/i.test(reference.protectedArtifactHash)
		&& typeof reference.watermark === "string" && reference.watermark.length >= 1 && reference.watermark.length <= 2048
		&& reference.metadata !== null && typeof reference.metadata === "object" && !Array.isArray(reference.metadata)
		&& reference.verificationScope === "protected-artifact";
}

export function loadVerificationReferences(storage: StorageLike = localStorage): VerificationReferences {
	try {
		const stored = storage.getItem(verificationReferenceStorageKey);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
				return Object.fromEntries(Object.entries(parsed).filter(([hash, reference]) => /^[a-f0-9]{64}$/i.test(hash) && isVerificationReference(reference)));
			}
		}
		const legacyStored = storage.getItem(legacyVerificationReferenceStorageKey);
		if (!legacyStored) return {};
		const legacy: unknown = JSON.parse(legacyStored);
		if (!isVerificationReference(legacy)) return {};
		const migrated = { [legacy.protectedArtifactHash]: legacy };
		storage.setItem(verificationReferenceStorageKey, JSON.stringify(migrated));
		return migrated;
	} catch {
		return {};
	}
}

export function saveVerificationReference(reference: VerificationReference, storage: StorageLike = localStorage): void {
	const references = loadVerificationReferences(storage);
	references[reference.protectedArtifactHash] = reference;
	storage.setItem(verificationReferenceStorageKey, JSON.stringify(references));
}
