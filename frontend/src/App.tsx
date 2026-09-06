import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { loadVerificationReferences, saveVerificationReference, VerificationReference } from "./verificationReference";

const configuredApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const apiUrl = configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");

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

function base64AsBlob(value: string): Blob {
	const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
	return new Blob([bytes], { type: "image/png" });
}

async function readApiResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	let body: unknown = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = null;
	}
	if (!response.ok) {
		const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
			? body.error
			: text || response.statusText || "Request failed";
		throw new Error(`${response.status} ${message}`);
	}
	return body as T;
}

async function sha256Hex(file: File): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
	try {
		return await readApiResponse<T>(await fetch(`${apiUrl}${path}`, options));
	} catch (requestError) {
		if (requestError instanceof TypeError) {
			throw new Error(`Unable to reach ArtShield backend at ${apiUrl}: ${requestError.message}`);
		}
		throw requestError;
	}
}

export default function App() {
	const [file, setFile] = useState<File | null>(null);
	const [watermark, setWatermark] = useState("ArtShield");
	const [title, setTitle] = useState("");
	const [artist, setArtist] = useState("");
	const [result, setResult] = useState<ProtectionResult | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [verificationBusy, setVerificationBusy] = useState(false);
	const [creator, setCreator] = useState("");
	const [metadataHash, setMetadataHash] = useState("");
	const [certificateTokenId, setCertificateTokenId] = useState("0");
	const [grantee, setGrantee] = useState("");
	const [rightsMask, setRightsMask] = useState("4");
	const [rightsTokenId, setRightsTokenId] = useState("");
	const [phase2Message, setPhase2Message] = useState("");
	const [phase2Error, setPhase2Error] = useState(false);
	const [transferBusy, setTransferBusy] = useState(false);
	const [lookupFingerprint, setLookupFingerprint] = useState("");
	const [verification, setVerification] = useState<VerificationResult | null>(null);
	const [artifactToVerify, setArtifactToVerify] = useState<File | null>(null);
	const [verificationReferences, setVerificationReferences] = useState<Record<string, VerificationReference>>({});
	const [selectedArtifactHash, setSelectedArtifactHash] = useState("");
	const [certificate, setCertificate] = useState<CertificateResult | null>(null);
	const [certificateBusy, setCertificateBusy] = useState(false);
	const [downloadMessage, setDownloadMessage] = useState("");
	const [mutationToken, setMutationToken] = useState("");
	const [newOwner, setNewOwner] = useState("");
	const artifactSelectionVersion = useRef(0);

	useEffect(() => {
		setVerificationReferences(loadVerificationReferences());
	}, []);

	function onFileChange(event: ChangeEvent<HTMLInputElement>) {
		setFile(event.target.files?.[0] ?? null);
		setResult(null);
		setVerification(null);
		setArtifactToVerify(null);
		setSelectedArtifactHash("");
		setCertificate(null);
		setDownloadMessage("");
		setError("");
	}

	async function onArtifactToVerifyChange(event: ChangeEvent<HTMLInputElement>) {
		const selectionVersion = ++artifactSelectionVersion.current;
		const selectedFile = event.target.files?.[0] ?? null;
		setArtifactToVerify(selectedFile);
		setSelectedArtifactHash("");
		setVerification(null);
		setError("");
		if (!selectedFile) {
			setSelectedArtifactHash("");
			return;
		}
		try {
			const selectedHash = await sha256Hex(selectedFile);
			if (selectionVersion === artifactSelectionVersion.current) setSelectedArtifactHash(selectedHash);
		} catch (hashError) {
			if (selectionVersion === artifactSelectionVersion.current) {
				setSelectedArtifactHash("");
				setError(hashError instanceof Error ? `Unable to inspect the selected artifact: ${hashError.message}` : "Unable to inspect the selected artifact.");
			}
		}
	}

	function downloadProtectedArtifact() {
		if (!result?.protected_image_base64) {
			setDownloadMessage("The protected artifact is not available to download.");
			return;
		}
		try {
			const objectUrl = URL.createObjectURL(base64AsBlob(result.protected_image_base64));
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = "artshield-protected.png";
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
			setDownloadMessage(`Protected artifact downloaded as artshield-protected.png. SHA-256: ${result.protected_artifact_hash}`);
		} catch (downloadError) {
			setDownloadMessage(downloadError instanceof Error ? `Download failed: ${downloadError.message}` : "Download failed.");
		}
	}

	async function verifySelectedArtwork() {
		if (!artifactToVerify) {
			setError("Select a protected artifact to verify.");
			return;
		}
		const verificationReference = verificationReferences[selectedArtifactHash];
		if (!verificationReference) {
			setError("No verification reference available. Protect this artwork first or load its saved reference.");
			return;
		}
		setVerificationBusy(true);
		setError("");
		try {
			const body = await requestApi<VerificationResult>("/api/verification", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					imageBase64: await fileAsBase64(artifactToVerify),
					watermark: verificationReference.watermark,
					expectedFingerprint: verificationReference.sourceFingerprint,
					expectedWatermark: verificationReference.watermark,
					expectedArtifactHash: verificationReference.protectedArtifactHash,
					metadata: verificationReference.metadata,
				}),
			});
			setVerification(body);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Verification request failed");
		} finally {
			setVerificationBusy(false);
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
			const body = await requestApi<ProtectionResult>("/api/protection", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					imageBase64: await fileAsBase64(file),
					watermark,
					metadata: { title, artist },
				}),
			});
			setResult(body);
			const reference: VerificationReference = {
				sourceFingerprint: body.fingerprint,
				protectedArtifactHash: body.protected_artifact_hash,
				watermark: body.watermark,
				metadata: { title, artist },
				verificationScope: "protected-artifact",
			};
			setVerificationReferences((current) => ({ ...current, [reference.protectedArtifactHash]: reference }));
			try {
				saveVerificationReference(reference);
			} catch {
				setError("Protection succeeded, but the verification reference could not be saved in this browser.");
			}
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Protection request failed");
		} finally {
			setBusy(false);
		}
	}

	async function phase2Request<T>(path: string, options: RequestInit = {}): Promise<T> {
		return requestApi<T>(path, { ...options, headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(mutationToken ? { authorization: `Bearer ${mutationToken}`, "x-artshield-role": "operator" } : {}), ...(options.headers ?? {}) } });
	}

	async function registerProvenance() {
		if (!result?.fingerprint) { setPhase2Message("Protect the artwork first to obtain its canonical fingerprint."); return; }
		try {
			const body = await phase2Request<{ transactionHash: string }>("/api/artworks/register", { method: "POST", body: JSON.stringify({ artworkFingerprint: result.fingerprint, metadataHash, certificateTokenId, creator }) });
			setPhase2Message(`Registration submitted: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Registration failed"); }
	}

	async function issueUsageRights() {
		if (!result?.fingerprint) { setPhase2Message("Protect the artwork first to obtain its canonical fingerprint."); return; }
		try {
			const body = await phase2Request<{ transactionHash: string }>("/api/rights", { method: "POST", body: JSON.stringify({ artworkFingerprint: result.fingerprint, grantee, rightsMask: Number(rightsMask), metadataUri: "ipfs://rights-metadata" }) });
			setPhase2Message(`Rights transaction submitted: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Rights issuance failed"); }
	}

	async function createCertificate() {
		if (!result?.fingerprint) {
			setPhase2Message("Protect the artwork first to obtain its canonical fingerprint.");
			return;
		}
		if (certificateBusy) return;
		setCertificateBusy(true);
		setCertificate(null);
		setPhase2Error(false);
		try {
			const body = await phase2Request<CertificateResult>("/api/certificates", {
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
			setPhase2Error(true);
			setPhase2Message(requestError instanceof Error ? requestError.message : "Certificate issuance failed");
		} finally {
			setCertificateBusy(false);
		}
	}

	async function lookupProvenance() {
		try {
			const [artwork, history] = await Promise.all([
				phase2Request<{ currentOwner?: string; [key: number]: unknown }>(`/api/artworks/${encodeURIComponent(lookupFingerprint)}`),
				phase2Request<unknown[]>(`/api/artworks/${encodeURIComponent(lookupFingerprint)}/provenance`),
			]);
			const owner = artwork.currentOwner ?? (typeof artwork[1] === "string" ? artwork[1] : undefined) ?? "unavailable";
			setPhase2Message(`Current owner: ${owner}; provenance entries: ${history.length}`);
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Provenance lookup failed"); }
	}

	async function transferOwnership() {
		if (!/^[a-f0-9]{64}$/i.test(lookupFingerprint)) {
			setPhase2Message("Enter a 64-character artwork fingerprint before transferring ownership.");
			setPhase2Error(true);
			return;
		}
		if (!/^0x[a-f0-9]{40}$/i.test(newOwner) || /^0x0{40}$/i.test(newOwner)) {
			setPhase2Message("Enter a valid non-zero Ethereum owner address.");
			setPhase2Error(true);
			return;
		}
		setTransferBusy(true);
		setPhase2Error(false);
		try {
			const body = await phase2Request<{ transactionHash: string }>("/api/artworks/transfer", { method: "POST", body: JSON.stringify({ artworkFingerprint: lookupFingerprint, newOwner }) });
			setPhase2Message(`Ownership transfer confirmed: ${body.transactionHash}`);
		} catch (requestError) { setPhase2Error(true); setPhase2Message(requestError instanceof Error ? requestError.message : "Ownership transfer failed"); }
		finally { setTransferBusy(false); }
	}

	async function verifyUsageRights() {
		try {
			const body = await phase2Request<{ valid: boolean }>(`/api/rights/${encodeURIComponent(rightsTokenId)}/verify?rightsMask=${encodeURIComponent(rightsMask)}`);
			setPhase2Message(body.valid ? "Rights are currently valid." : "Rights are not valid.");
		} catch (requestError) { setPhase2Message(requestError instanceof Error ? requestError.message : "Rights verification failed"); }
	}

	async function revokeUsageRights() {
		try {
			const body = await phase2Request<{ transactionHash: string }>(`/api/rights/${encodeURIComponent(rightsTokenId)}/revoke`, { method: "POST" });
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
					<label>Artifact to verify<input type="file" accept="image/png" onChange={onArtifactToVerifyChange} /></label>
					<button className="secondary" type="button" onClick={verifySelectedArtwork} disabled={verificationBusy || !artifactToVerify || !verificationReferences[selectedArtifactHash]}>{verificationBusy ? "Working..." : "Verify protected artifact"}</button>
					{artifactToVerify && !verificationReferences[selectedArtifactHash] && <p className="muted" role="status">No verification reference available for this artifact. Protect it first or load its saved reference.</p>}
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
							<button type="button" onClick={downloadProtectedArtifact}>Download protected artifact</button>
							{downloadMessage && <p className={downloadMessage.startsWith("Download failed") || downloadMessage.startsWith("The protected") ? "error" : "download-success"} role={downloadMessage.startsWith("Download failed") || downloadMessage.startsWith("The protected") ? "alert" : "status"}>{downloadMessage}</p>}
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
					<p className="eyebrow">PHASE 2 / PROVENANCE / DEMO-LOCAL AUTH</p>
										<label>Demo mutation token<input type="password" value={mutationToken} onChange={(event) => setMutationToken(event.target.value)} placeholder="Provided by the local backend operator" /></label>
					<label>Creator wallet<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="0x..." /></label>
					<label>Metadata hash<input value={metadataHash} onChange={(event) => setMetadataHash(event.target.value)} placeholder="0x + 64 hex characters" /></label>
					<label>Certificate token ID<input value={certificateTokenId} onChange={(event) => setCertificateTokenId(event.target.value)} /></label>
										<button type="button" onClick={createCertificate} disabled={certificateBusy}>{certificateBusy ? "Submitting..." : "Create certificate"}</button>
					<button type="button" onClick={registerProvenance}>Register provenance</button>
										{certificate && <dl><dt>Certificate token</dt><dd>{certificate.tokenId}</dd><dt>Transaction</dt><dd>{certificate.transactionHash}</dd><dt>Network</dt><dd>Chain {certificate.chainId}</dd><dt>Contract</dt><dd>{certificate.contractAddress}</dd></dl>}
					<label>Lookup fingerprint<input value={lookupFingerprint} onChange={(event) => setLookupFingerprint(event.target.value)} placeholder="64 hex characters" /></label>
					<button type="button" onClick={lookupProvenance}>Lookup ownership and provenance</button>
					<label>New owner address<input value={newOwner} onChange={(event) => setNewOwner(event.target.value)} placeholder="0x..." /></label>
					<button type="button" onClick={transferOwnership} disabled={transferBusy}>{transferBusy ? "Submitting..." : "Transfer ownership"}</button>
					<p className="muted">The backend submits the transaction only when blockchain configuration and signer authorization are available.</p>
				</section>
				<section className="panel">
					<p className="eyebrow">PHASE 2 / USAGE RIGHTS</p>
					<label>Grantee wallet<input value={grantee} onChange={(event) => setGrantee(event.target.value)} placeholder="0x..." /></label>
					<label>Rights mask<input type="number" min="1" max="63" value={rightsMask} onChange={(event) => setRightsMask(event.target.value)} /></label>
					<label>Rights token ID<input value={rightsTokenId} onChange={(event) => setRightsTokenId(event.target.value)} placeholder="Token ID for verify/revoke" /></label>
					<div className="button-row"><button type="button" onClick={issueUsageRights}>Issue rights</button><button type="button" onClick={verifyUsageRights}>Verify rights</button><button type="button" onClick={revokeUsageRights}>Revoke rights</button></div>
					{phase2Message && <p className={phase2Error ? "error" : "muted"} role={phase2Error ? "alert" : "status"}>{phase2Message}</p>}
				</section>
			</section>
		</main>
	);
}
