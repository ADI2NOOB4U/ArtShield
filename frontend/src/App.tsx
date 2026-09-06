import { ChangeEvent, FormEvent, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ProtectionResult = {
	fingerprint: string;
	watermark: string;
	protected_image_base64: string;
	protected_artifact_hash: string;
};

type VerificationResult = {
	authentic: boolean;
	fingerprint_match: boolean;
	watermark_match: boolean | null;
	reasons: string[];
};

type CertificateResult = {
	tokenId: string;
	transactionHash: string;
	contractAddress: string;
	chainId: string;
	metadataUri: string;
};

function fileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Unable to read the selected file"));
		reader.onload = () => {
			const value = String(reader.result);
			const separator = value.indexOf(",");
			resolve(separator >= 0 ? value.slice(separator + 1) : value);
		};
		reader.readAsDataURL(file);
	});
}

function base64AsFile(value: string, name: string): File {
	const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
	return new File([bytes], name, { type: "image/png" });
}

export default function App() {
	const [file, setFile] = useState<File | null>(null);
	const [watermark, setWatermark] = useState("ArtShield");
	const [title, setTitle] = useState("");
	const [artist, setArtist] = useState("");
	const [result, setResult] = useState<ProtectionResult | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [creator, setCreator] = useState("");
	const [metadataHash, setMetadataHash] = useState("");
	const [certificateTokenId, setCertificateTokenId] = useState("0");
	const [grantee, setGrantee] = useState("");
	const [rightsMask, setRightsMask] = useState("4");
	const [rightsTokenId, setRightsTokenId] = useState("");
	const [phase2Message, setPhase2Message] = useState("");
	const [lookupFingerprint, setLookupFingerprint] = useState("");
	const [verification, setVerification] = useState<VerificationResult | null>(null);
	const [artifactToVerify, setArtifactToVerify] = useState<File | null>(null);
	const [certificate, setCertificate] = useState<CertificateResult | null>(null);

	function onFileChange(event: ChangeEvent<HTMLInputElement>) {
		setFile(event.target.files?.[0] ?? null);
		setResult(null);
		setVerification(null);
		setArtifactToVerify(null);
		setCertificate(null);
		setError("");
	}

	async function verifySelectedArtwork() {
		if (!result?.fingerprint) {
			setError("Protect an artwork first, then verify the protected artifact.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			const response = await fetch(`${apiUrl}/api/verification`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					imageBase64: await fileAsBase64(artifactToVerify ?? base64AsFile(result.protected_image_base64, "protected.png")),
					expectedFingerprint: result.fingerprint,
					expectedWatermark: result.watermark,
					expectedArtifactHash: result.protected_artifact_hash,
					metadata: { title, artist },
				}),
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.error ?? "Verification request failed");
			setVerification(body as VerificationResult);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Verification request failed");
		} finally {
			setBusy(false);
		}
	}

	async function protect(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!file) {
			setError("Choose a PNG, JPEG, or WebP image first.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			const response = await fetch(`${apiUrl}/api/protection`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					imageBase64: await fileAsBase64(file),
					watermark,
					metadata: { title, artist },
				}),
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.error ?? "Protection request failed");
			setResult(body as ProtectionResult);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Protection request failed");
		} finally {
			setBusy(false);
		}
	}

	async function phase2Request(path: string, options: RequestInit = {}) {
		const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
		const body = await response.json();
		if (!response.ok) throw new Error(body.error ?? "Blockchain operation failed");
		return body;
	}

	async function registerProvenance() {
		if (!result?.fingerprint) { setPhase2Message("Protect the artwork first to obtain its canonical fingerprint."); return; }
		try {
			const body = await phase2Request("/api/artworks/register", { method: "POST", body: JSON.stringify({ artworkFingerprint: result.fingerprint, metadataHash, certificateTokenId, creator }) });
			setPhase2Message(`Registration submitted: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Registration failed"); }
	}

	async function issueUsageRights() {
		if (!result?.fingerprint) { setPhase2Message("Protect the artwork first to obtain its canonical fingerprint."); return; }
		try {
			const body = await phase2Request("/api/rights", { method: "POST", body: JSON.stringify({ artworkFingerprint: result.fingerprint, grantee, rightsMask: Number(rightsMask), metadataUri: "ipfs://rights-metadata" }) });
			setPhase2Message(`Rights transaction submitted: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Rights issuance failed"); }
	}

	async function createCertificate() {
		if (!result?.fingerprint) {
			setPhase2Message("Protect the artwork first to obtain its canonical fingerprint.");
			return;
		}
		try {
			const body = await phase2Request("/api/certificates", {
				method: "POST",
				body: JSON.stringify({
					recipient: creator,
					artworkFingerprint: result.fingerprint,
					metadata: { title, artist, protectedArtifactHash: result.protected_artifact_hash },
					metadataUri: "local://artshield-protected-artifact",
				}),
			});
			setCertificate(body as CertificateResult);
			setPhase2Message(`Certificate confirmed on chain: token ${body.tokenId}`);
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Certificate issuance failed");
		}
	}

	async function lookupProvenance() {
		try {
			const [artwork, history] = await Promise.all([
				phase2Request(`/api/artworks/${encodeURIComponent(lookupFingerprint)}`),
				phase2Request(`/api/artworks/${encodeURIComponent(lookupFingerprint)}/provenance`),
			]);
			setPhase2Message(`Current owner: ${artwork.currentOwner ?? artwork[1] ?? "unavailable"}; provenance entries: ${history.length}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Provenance lookup failed"); }
	}

	async function verifyUsageRights() {
		try {
			const body = await phase2Request(`/api/rights/${encodeURIComponent(rightsTokenId)}/verify?rightsMask=${encodeURIComponent(rightsMask)}`);
			setPhase2Message(body.valid ? "Rights are currently valid." : "Rights are not valid.");
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Rights verification failed"); }
	}

	async function revokeUsageRights() {
		try {
			const body = await phase2Request(`/api/rights/${encodeURIComponent(rightsTokenId)}/revoke`, { method: "POST" });
			setPhase2Message(`Revocation submitted: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Rights revocation failed"); }
	}

	return (
		<main className="shell">
			<section className="intro">
				<p className="eyebrow">ARTSHIELD / EXHIBITION MODE</p>
				<h1>Protect an artwork with verifiable evidence.</h1>
				<p className="lede">Upload a source, run the real protection service, and verify the protected artifact against its recorded integrity reference.</p>
			</section>
			<section className="workspace" aria-label="Artwork protection">
				<form className="panel" onSubmit={protect}>
					<label className="dropzone">
						<span>Artwork file</span>
						<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} />
						<strong>{file?.name ?? "Choose an image"}</strong>
						<small>PNG, JPEG, or WebP. Maximum 10 MiB.</small>
					</label>
					<label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} /></label>
					<label>Artist<input value={artist} onChange={(event) => setArtist(event.target.value)} maxLength={200} /></label>
					<label>Watermark<input value={watermark} onChange={(event) => setWatermark(event.target.value)} maxLength={2048} required /></label>
					<button type="submit" disabled={busy}>{busy ? "Working..." : "Protect artwork"}</button>
					<label>Artifact to verify<input type="file" accept="image/png" onChange={(event) => { setArtifactToVerify(event.target.files?.[0] ?? null); setVerification(null); }} /></label>
					<button className="secondary" type="button" onClick={verifySelectedArtwork} disabled={busy || !result}>{busy ? "Working..." : "Verify protected artifact"}</button>
					{error && <p className="error" role="alert">{error}</p>}
				</form>
				<aside className="panel result" aria-live="polite">
					<p className="eyebrow">RESULT</p>
					{result ? (
						<>
							<img src={`data:image/png;base64,${result.protected_image_base64}`} alt="Protected artwork" />
							<dl>
										<dt>Source SHA-256 fingerprint</dt>
								<dd>{result.fingerprint}</dd>
										<dt>Protected artifact hash</dt>
										<dd>{result.protected_artifact_hash}</dd>
								<dt>Embedded watermark</dt>
								<dd>{result.watermark}</dd>
							</dl>
						</>
					) : <p className="muted">Your protected artifact and evidence will appear here.</p>}
					{verification && <div className={`verification ${verification.authentic ? "verified" : "tampered"}`}><strong>{verification.authentic ? "INTEGRITY VERIFIED" : "TAMPERING DETECTED"}</strong><span>{verification.reasons.length ? verification.reasons.join("; ") : "Selected artwork matches the submitted fingerprint."}</span></div>}
				</aside>
			</section>
			<section className="status-band" aria-label="Implementation status">
				<div><strong>CORE PROTECTION</strong><span>Layers 1–5 active in the ML workflow</span></div>
				<div><strong>OWNERSHIP & RIGHTS</strong><span>Layers 6–7 available through configured blockchain APIs</span></div>
				<div><strong>AI SECURITY RESEARCH</strong><span>Layers 8–12 controlled research endpoints</span></div>
				<div><strong>ADVANCED ANALYSIS</strong><span>Layers 13–15 defensive endpoints; not part of upload protection</span></div>
			</section>
			<section className="workspace" aria-label="Ownership and usage rights">
				<section className="panel">
					<p className="eyebrow">PHASE 2 / PROVENANCE</p>
					<label>Creator wallet<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="0x..." /></label>
					<label>Metadata hash<input value={metadataHash} onChange={(event) => setMetadataHash(event.target.value)} placeholder="0x + 64 hex characters" /></label>
					<label>Certificate token ID<input value={certificateTokenId} onChange={(event) => setCertificateTokenId(event.target.value)} /></label>
										<button type="button" onClick={createCertificate}>Create certificate</button>
					<button type="button" onClick={registerProvenance}>Register provenance</button>
										{certificate && <dl><dt>Certificate token</dt><dd>{certificate.tokenId}</dd><dt>Transaction</dt><dd>{certificate.transactionHash}</dd><dt>Network</dt><dd>Chain {certificate.chainId}</dd><dt>Contract</dt><dd>{certificate.contractAddress}</dd></dl>}
					<label>Lookup fingerprint<input value={lookupFingerprint} onChange={(event) => setLookupFingerprint(event.target.value)} placeholder="64 hex characters" /></label>
					<button type="button" onClick={lookupProvenance}>Lookup ownership and provenance</button>
					<p className="muted">The backend submits the transaction only when blockchain configuration and signer authorization are available.</p>
				</section>
				<section className="panel">
					<p className="eyebrow">PHASE 2 / USAGE RIGHTS</p>
					<label>Grantee wallet<input value={grantee} onChange={(event) => setGrantee(event.target.value)} placeholder="0x..." /></label>
					<label>Rights mask<input type="number" min="1" max="63" value={rightsMask} onChange={(event) => setRightsMask(event.target.value)} /></label>
					<label>Rights token ID<input value={rightsTokenId} onChange={(event) => setRightsTokenId(event.target.value)} placeholder="Token ID for verify/revoke" /></label>
					<div className="button-row"><button type="button" onClick={issueUsageRights}>Issue rights</button><button type="button" onClick={verifyUsageRights}>Verify rights</button><button type="button" onClick={revokeUsageRights}>Revoke rights</button></div>
					{phase2Message && <p className="error" role="status">{phase2Message}</p>}
				</section>
			</section>
		</main>
	);
}
