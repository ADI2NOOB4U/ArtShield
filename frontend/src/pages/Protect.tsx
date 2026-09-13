import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loadVerificationReferences, saveVerificationReference, VerificationReference } from "../verificationReference";
import "../styles/protect-cinematic.css";

import { CinematicBackground } from "../components/protect/CinematicBackground";
import { ExhibitionDemo } from "../components/protect/ExhibitionDemo";
import { ArtifactEvent, ArtifactIntelligence, ProvenanceRecord } from "../components/protect/ArtifactIntelligence";
import { ProtectionPipeline } from "../components/protect/ProtectionPipeline";
import { ProtectionResult as CinematicProtectionResult } from "../components/protect/ProtectionResult";
import { VerificationSection, VerificationResultData } from "../components/protect/VerificationSection";
import LoginModal from "../components/auth/LoginModal";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { usePointerParallax } from "../hooks/usePointerParallax";
import { apiBaseUrl, apiRequestDefaults, apiUrl } from "../services/api";

/*
 * Existing exhibition protect/verify tool, enhanced into a cinematic cyber-security experience.
 * API paths, request bodies, auth headers, SHA-256 verification, verification-reference
 * persistence and download behaviour are intentionally identical to the original.
 */

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

type ArtworkProvenanceResponse = {
	currentOwner?: string;
	creator?: string;
	certificateTokenId?: string;
	registeredAt?: string;
	registered?: boolean;
	[key: string]: unknown;
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
		const message =
			body && typeof body === "object" && "error" in body && typeof body.error === "string"
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
		return await readApiResponse<T>(await fetch(apiUrl(path), { ...apiRequestDefaults, ...options }));
	} catch (requestError) {
		if (requestError instanceof TypeError) {
			throw new Error(`Unable to reach ArtShield backend at ${apiBaseUrl || "the current origin"}: ${requestError.message}`);
		}
		throw requestError;
	}
}

export default function Protect() {
	const { authReady, isAuthenticated } = useAuth();
	const [loginModalOpen, setLoginModalOpen] = useState(false);
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
	const [newOwner, setNewOwner] = useState("");
	const [provenanceRecord, setProvenanceRecord] = useState<ProvenanceRecord | null>(null);
	const [securityEvents, setSecurityEvents] = useState<ArtifactEvent[]>([]);
	const artifactSelectionVersion = useRef(0);
	const recordEvent = (label: string, detail: string) => setSecurityEvents((current) => [...current, { at: new Date().toISOString(), label, detail }]);

	// Cinematic audio, parallax & animation state
	const audio = useAudioEngine();
	const reducedMotion = useReducedMotion();
	const [pipelinePhase, setPipelinePhase] = useState<number>(0);
	const [tamperResistant, setTamperResistant] = useState<boolean>(true);
	const [isDropActive, setIsDropActive] = useState(false);

	function requireAuthentication(): boolean {
		if (!authReady) {
			setError("Authentication is still loading. Please try again.");
			return false;
		}
		if (!isAuthenticated) {
			setLoginModalOpen(true);
			return false;
		}
		return true;
	}

	const uploadCardRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	usePointerParallax(uploadCardRef, !reducedMotion);

	const audioPlayRef = useRef(audio.play);
	useEffect(() => {
		audioPlayRef.current = audio.play;
	});

	const filePreviewUrl = useMemo(() => {
		if (!file) return null;
		return URL.createObjectURL(file);
	}, [file]);

	useEffect(() => {
		return () => {
			if (filePreviewUrl) {
				URL.revokeObjectURL(filePreviewUrl);
			}
		};
	}, [filePreviewUrl]);

	const artifactPreviewUrl = useMemo(() => {
		if (!artifactToVerify) return null;
		return URL.createObjectURL(artifactToVerify);
	}, [artifactToVerify]);

	useEffect(() => {
		return () => {
			if (artifactPreviewUrl) {
				URL.revokeObjectURL(artifactPreviewUrl);
			}
		};
	}, [artifactPreviewUrl]);

	useEffect(() => {
		setVerificationReferences(loadVerificationReferences());
	}, []);

	// Pipeline sequential progression timer when protection is running
	useEffect(() => {
		if (!busy) {
			if (result) {
				setPipelinePhase(9);
			}
			return;
		}

		setPipelinePhase(1);
		audioPlayRef.current("activate");

		const interval = window.setInterval(() => {
			setPipelinePhase((prev) => {
				if (prev >= 8) return 8;
				const next = prev + 1;
				audioPlayRef.current("tick");
				return next;
			});
		}, 480);

		return () => {
			window.clearInterval(interval);
		};
	}, [busy, result]);

	function onFileChange(event: ChangeEvent<HTMLInputElement>) {
		const chosen = event.target.files?.[0] ?? null;
		setFile(chosen);
		setResult(null);
		setVerification(null);
		setArtifactToVerify(null);
		setSelectedArtifactHash("");
		setCertificate(null);
		setDownloadMessage("");
		setError("");
		setPipelinePhase(0);
		if (chosen) {
			audio.play("upload");
			recordEvent("ARTIFACT RECEIVED", `${chosen.name} selected locally`);
		}
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
		audio.play("upload");
		try {
			const selectedHash = await sha256Hex(selectedFile);
			if (selectionVersion === artifactSelectionVersion.current) setSelectedArtifactHash(selectedHash);
		} catch (hashError) {
			if (selectionVersion === artifactSelectionVersion.current) {
				setSelectedArtifactHash("");
				setError(
					hashError instanceof Error
						? `Unable to inspect the selected artifact: ${hashError.message}`
						: "Unable to inspect the selected artifact.",
				);
			}
		}
	}

	function downloadProtectedArtifact() {
		if (!result?.protected_image_base64) {
			setDownloadMessage("The protected artifact is not available to download.");
			return;
		}
		audio.play("click");
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
		if (!requireAuthentication()) return;
		setVerificationBusy(true);
		setError("");
		audio.play("scan");
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
			recordEvent(body.authentic ? "ARTIFACT VERIFIED" : "INTEGRITY FAILURE DETECTED", body.authentic ? "Candidate matched its local protection reference" : "Candidate did not match its local protection reference");
			audio.play("verify");
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
		if (!requireAuthentication()) return;
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
			recordEvent("IDENTITY GENERATED", "Canonical fingerprint returned by the protection service");
			recordEvent("WATERMARK EMBEDDED", "Protection service completed its watermark operation");
			recordEvent("INTEGRITY HASH GENERATED", "Protected artifact SHA-256 returned");
			recordEvent("PROTECTION COMPLETE", "Protected artifact and local verification reference are available");
			audio.play("success");
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
			setPipelinePhase(0);
		} finally {
			setBusy(false);
		}
	}

	async function phase2Request<T>(path: string, options: RequestInit = {}): Promise<T> {
		if (options.method?.toUpperCase() === "POST" && !requireAuthentication()) {
			throw new Error("Authentication required");
		}
		return requestApi<T>(path, {
			...options,
			headers: {
				...(options.body ? { "content-type": "application/json" } : {}),
				...(options.headers ?? {}),
			},
		});
	}

	async function registerProvenance() {
		if (!result?.fingerprint) {
			setPhase2Message("Protect the artwork first to obtain its canonical fingerprint.");
			return;
		}
		try {
			const body = await phase2Request<{ transactionHash: string }>("/api/artworks/register", {
				method: "POST",
				body: JSON.stringify({
					artworkFingerprint: result.fingerprint,
					metadataHash,
					certificateTokenId,
					creator,
				}),
			});
			setPhase2Message(`Registration submitted: ${body.transactionHash}`);
			recordEvent("PROVENANCE REGISTERED", `Registration transaction: ${body.transactionHash}`);
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Registration failed");
		}
	}

	async function issueUsageRights() {
		if (!result?.fingerprint) {
			setPhase2Message("Protect the artwork first to obtain its canonical fingerprint.");
			return;
		}
		try {
			const body = await phase2Request<{ transactionHash: string }>("/api/rights", {
				method: "POST",
				body: JSON.stringify({
					artworkFingerprint: result.fingerprint,
					grantee,
					rightsMask: Number(rightsMask),
					metadataUri: "ipfs://rights-metadata",
				}),
			});
			setPhase2Message(`Rights transaction submitted: ${body.transactionHash}`);
			recordEvent("RIGHTS ISSUED", `Rights transaction: ${body.transactionHash}`);
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Rights issuance failed");
		}
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
			recordEvent("CERTIFICATE CREATED", `Certificate token ${body.tokenId} returned by the blockchain service`);
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
				phase2Request<ArtworkProvenanceResponse>(
					`/api/artworks/${encodeURIComponent(lookupFingerprint)}`,
				),
				phase2Request<unknown[]>(`/api/artworks/${encodeURIComponent(lookupFingerprint)}/provenance`),
			]);
			const owner = artwork.currentOwner ?? (typeof artwork["1"] === "string" ? artwork["1"] : undefined) ?? "unavailable";
			setProvenanceRecord({
				owner,
				creator: typeof artwork.creator === "string" ? artwork.creator : undefined,
				certificateTokenId: typeof artwork.certificateTokenId === "string" ? artwork.certificateTokenId : undefined,
				registeredAt: typeof artwork.registeredAt === "string" ? artwork.registeredAt : undefined,
				registered: artwork.registered === true,
				entries: history.filter((entry): entry is string => typeof entry === "string"),
			});
			recordEvent("PROVENANCE INSPECTED", `${history.length} record(s) returned by the provenance service`);
			setPhase2Message(`Current owner: ${owner}; provenance entries: ${history.length}`);
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Provenance lookup failed");
		}
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
			const body = await phase2Request<{ transactionHash: string }>("/api/artworks/transfer", {
				method: "POST",
				body: JSON.stringify({ artworkFingerprint: lookupFingerprint, newOwner }),
			});
			setPhase2Message(`Ownership transfer confirmed: ${body.transactionHash}`);
			recordEvent("OWNERSHIP TRANSFERRED", `Transfer transaction: ${body.transactionHash}`);
		} catch (requestError) {
			setPhase2Error(true);
			setPhase2Message(requestError instanceof Error ? requestError.message : "Ownership transfer failed");
		} finally {
			setTransferBusy(false);
		}
	}

	async function verifyUsageRights() {
		try {
			const body = await phase2Request<{ valid: boolean }>(
				`/api/rights/${encodeURIComponent(rightsTokenId)}/verify?rightsMask=${encodeURIComponent(rightsMask)}`,
			);
			setPhase2Message(body.valid ? "Rights are currently valid." : "Rights are not valid.");
			recordEvent("RIGHTS VERIFIED", body.valid ? "Requested rights mask is valid" : "Requested rights mask is not valid");
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Rights verification failed");
		}
	}

	async function revokeUsageRights() {
		try {
			const body = await phase2Request<{ transactionHash: string }>(
				`/api/rights/${encodeURIComponent(rightsTokenId)}/revoke`,
				{ method: "POST" },
			);
			setPhase2Message(`Revocation submitted: ${body.transactionHash}`);
			recordEvent("RIGHTS REVOKED", `Revocation transaction: ${body.transactionHash}`);
		} catch (requestError) {
			setPhase2Message(requestError instanceof Error ? requestError.message : "Rights revocation failed");
		}
	}

	const mappedVerificationResult: VerificationResultData | null = useMemo(() => {
		if (!verification) return null;
		return {
			authentic: verification.authentic,
			integrityVerified: verification.authentic,
			tamperDetected: !verification.authentic,
			sha256Matched: verification.authentic,
			fingerprintMatched: verification.fingerprint_match,
			watermarkMatched: verification.watermark_match === true,
			confidence: verification.authentic ? 0.99 : 0.15,
			details: verification.reasons.length ? verification.reasons.join("; ") : undefined,
			referenceId: verificationReferences[selectedArtifactHash]?.sourceFingerprint.slice(0, 16),
		};
	}, [verification, verificationReferences, selectedArtifactHash]);

	return (
		<>
		<div className="pc-page">
			{/* Fixed Atmospheric Cinematic Background */}
			<CinematicBackground reducedMotion={reducedMotion} />

			{/* Navigation Header */}
			<header>
				<nav className="pc-nav" aria-label="Main Navigation">
					<Link to="/" className="pc-nav__brand">
						<div className="pc-nav__logo-mark">
							<svg
								className="pc-nav__logo-svg"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M12 2L3 7V12C3 17.5228 6.94165 22.5027 12 23.9443C17.0583 22.5027 21 17.5228 21 12V7L12 2Z"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M9 12L11 14L15 10"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
						<div className="pc-nav__brand-info">
							<span className="pc-nav__brand-title">ARTSHIELD</span>
							<span className="pc-nav__brand-subtitle">EXHIBITION SECURITY SUITE</span>
						</div>
					</Link>

					<div className="pc-nav__links">
						<Link to="/" className="pc-nav__link">
							Home
						</Link>
						<span className="pc-nav__link pc-nav__link--active">
							Protection Suite
						</span>
					</div>

					<div className="pc-nav__actions">
						<button
							type="button"
							onClick={audio.toggleSound}
							className={`pc-sound-toggle ${!audio.enabled ? "pc-sound-toggle--muted" : ""}`}
							title={audio.enabled ? "Mute audio feedback" : "Enable audio feedback"}
							aria-label={audio.enabled ? "Mute interface sound" : "Enable interface sound"}
						>
							<svg
								className="pc-sound-toggle__icon"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								{audio.enabled ? (
									<path
										d="M8 2.5L4.5 5.5H2V10.5H4.5L8 13.5V2.5ZM10.5 5.5C11.5 6.5 12 7.5 12 8C12 8.5 11.5 9.5 10.5 10.5M12.5 3.5C14 5 15 6.5 15 8C15 9.5 14 11 12.5 12.5"
										stroke="currentColor"
										strokeWidth="1.3"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								) : (
									<path
										d="M8 2.5L4.5 5.5H2V10.5H4.5L8 13.5V2.5ZM11.5 6.5L14.5 9.5M14.5 6.5L11.5 9.5"
										stroke="currentColor"
										strokeWidth="1.3"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								)}
							</svg>
							<span>{audio.enabled ? "SOUND ON" : "MUTED"}</span>
						</button>
					</div>
				</nav>
			</header>

			{/* Main Workspace Area */}
			<main className="pc-main">
				{/* Cinematic Hero Header */}
				<section className="pc-hero-header" aria-labelledby="hero-title">
					<div className="pc-tag pc-tag--cyan">
						<span className="pc-tag__dot" />
						<span>ADVANCED DIGITAL WATERMARKING & VERIFICATION</span>
					</div>
					<h1 id="hero-title" className="pc-hero-header__title">
						Cryptographic Shield for Digital Masterworks.
					</h1>
					<p className="pc-hero-header__lead">
						Empowering artists, galleries, and institutions with dual-layer latent watermarks,
						non-destructive perceptual encoding, and mathematical SHA-256 integrity proofs.
					</p>
				</section>

				<ExhibitionDemo
					fileSelected={Boolean(file)}
					protecting={busy}
					hasProtectedArtifact={Boolean(result)}
					artifactSelected={Boolean(artifactToVerify)}
					verificationComplete={Boolean(verification)}
					onStart={() => fileInputRef.current?.click()}
				/>

				{/* Primary Protection Workspace (Upload + Controls) */}
				<section className="pc-workspace" aria-label="Artwork Protection Controls">
					{/* Left: Interactive Dropzone / Upload Preview Card */}
					<div ref={uploadCardRef} className="pc-glass-card" data-parallax-target="true">
						<div className="pc-glass-card__header">
							<span className="pc-tag">STEP 01</span>
							<h2 className="pc-glass-card__title">Ingest Master Asset</h2>
							<p className="pc-glass-card__desc">
								Select or drop the original high-resolution artwork for mathematical protection.
							</p>
						</div>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/png,image/jpeg,image/webp"
							onChange={onFileChange}
							className="pc-hidden-input"
							id="artwork-file-input"
						/>

						{!file ? (
							<div
								className={`pc-dropzone ${isDropActive ? "pc-dropzone--active" : ""}`}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDropActive(true);
								}}
								onDragLeave={() => setIsDropActive(false)}
								onDrop={(e) => {
									e.preventDefault();
									setIsDropActive(false);
									if (e.dataTransfer.files?.[0]) {
										const fakeEvent = {
											target: { files: e.dataTransfer.files },
										} as unknown as ChangeEvent<HTMLInputElement>;
										onFileChange(fakeEvent);
									}
								}}
								onClick={() => fileInputRef.current?.click()}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										fileInputRef.current?.click();
									}
								}}
							>
								<div className="pc-dropzone__reticle">
									<svg
										className="pc-dropzone__reticle-icon"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12 16V8M12 8L9 11M12 8L15 11M4 16V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V16"
											stroke="currentColor"
											strokeWidth="1.6"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</div>
								<div>
									<span className="pc-dropzone__headline">Drop Artwork Here</span>
									<span className="pc-dropzone__sub">PNG, JPEG, WebP up to 10 MiB</span>
								</div>
								<span className="pc-dropzone__cta">BROWSE LOCAL STORAGE</span>
							</div>
						) : (
							<div className="pc-selected-file">
								{filePreviewUrl && (
									<div className="pc-selected-file__preview-wrap">
										<img src={filePreviewUrl} alt="Selected artwork" className="pc-selected-file__img" />
									</div>
								)}
								<div className="pc-selected-file__bar">
									<span className="pc-selected-file__name">{file.name}</span>
									<span className="pc-selected-file__size">
										{(file.size / (1024 * 1024)).toFixed(2)} MB
									</span>
									<button
										type="button"
										className="pc-selected-file__change-btn"
										onClick={() => fileInputRef.current?.click()}
									>
										REPLACE
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Right: Security Parameters & Execution */}
					<div className="pc-glass-card">
						<div className="pc-glass-card__header">
							<span className="pc-tag">STEP 02</span>
							<h2 className="pc-glass-card__title">Security Configuration</h2>
							<p className="pc-glass-card__desc">
								Define cryptographic watermark payload and immutable metadata attributes.
							</p>
						</div>

						<form onSubmit={protect} className="pc-glass-card" style={{ padding: 0, background: "none", border: "none", boxShadow: "none" }}>
							<div className="pc-form-group">
								<label className="pc-form-label" htmlFor="title-input">
									ARTWORK TITLE
								</label>
								<input
									id="title-input"
									className="pc-input"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									maxLength={200}
									placeholder="e.g. Genesis Protocol #01"
								/>
							</div>

							<div className="pc-form-group">
								<label className="pc-form-label" htmlFor="artist-input">
									CREATOR / ARTIST
								</label>
								<input
									id="artist-input"
									className="pc-input"
									value={artist}
									onChange={(event) => setArtist(event.target.value)}
									maxLength={200}
									placeholder="e.g. Satoshi Studio / Anonymous"
								/>
							</div>

							<div className="pc-form-group">
								<label className="pc-form-label" htmlFor="watermark-input">
									LATENT WATERMARK PAYLOAD
								</label>
								<input
									id="watermark-input"
									className="pc-input"
									value={watermark}
									onChange={(event) => setWatermark(event.target.value)}
									maxLength={2048}
									required
									placeholder="e.g. ArtShield-Signed-2026"
								/>
							</div>

							<div className="pc-toggle-row">
								<div className="pc-toggle-label">
									<span className="pc-toggle-title">Zero-Loss Frequency Hardening</span>
									<span className="pc-toggle-sub">
										High-fidelity protection resistant to compression & cropping
									</span>
								</div>
								<label className="pc-switch" aria-label="Toggle Zero-Loss Frequency Hardening">
									<input
										type="checkbox"
										checked={tamperResistant}
										onChange={(e) => setTamperResistant(e.target.checked)}
									/>
									<span className="pc-switch__slider" />
								</label>
							</div>

							<button
								type="submit"
								disabled={busy || !file}
								className={`pc-btn pc-btn--primary pc-btn--full ${busy ? "pc-btn--busy" : ""}`}
							>
								{busy ? (
									<>
										<span className="pc-spinner pc-spinner--sm" />
										<span>PROTECTING ASSET IN PIPELINE...</span>
									</>
								) : (
									<>
										<svg
											className="pc-btn__icon"
											viewBox="0 0 20 20"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M10 2L3 5.5V9.5C3 13.642 6.002 17.377 10 18.455C13.998 17.377 17 13.642 17 9.5V5.5L10 2Z"
												stroke="currentColor"
												strokeWidth="1.7"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span>EXECUTE ZERO-LOSS PROTECTION</span>
									</>
								)}
							</button>
						</form>

						{error && (
							<div className="pc-error-banner" role="alert">
								<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
									<circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
									<path d="M10 6V11M10 14V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
								</svg>
								<span>{error}</span>
							</div>
						)}
					</div>
				</section>

				{/* 7-Step Animated Protection Pipeline */}
				<ProtectionPipeline
					phase={pipelinePhase}
					busy={busy}
					hasResult={Boolean(result)}
					reducedMotion={reducedMotion}
				/>

				{/* Protected Result Showcase (Hero 3D floating canvas + Security certificate) */}
				{result && (
					<CinematicProtectionResult
						imageDataUrl={`data:image/png;base64,${result.protected_image_base64}`}
						sha256={result.protected_artifact_hash}
						fingerprintHex={result.fingerprint}
						watermark={result.watermark}
						title={title}
						artist={artist}
						timestamp={new Date().toISOString()}
						tamperResistant={tamperResistant}
						verifiedAuthentic={true}
						onDownload={downloadProtectedArtifact}
						reducedMotion={reducedMotion}
					/>
				)}

				{downloadMessage && (
					<div
						className={`pc-status-msg ${downloadMessage.startsWith("Download failed") || downloadMessage.startsWith("The protected") ? "pc-error-banner" : ""}`}
						role={downloadMessage.startsWith("Download failed") ? "alert" : "status"}
					>
						{downloadMessage}
					</div>
				)}

				<ArtifactIntelligence
					file={file}
					preview={result ? `data:image/png;base64,${result.protected_image_base64}` : filePreviewUrl}
					result={result}
					title={title}
					artist={artist}
					certificate={certificate}
					provenance={provenanceRecord}
					events={securityEvents}
					apiBase={apiBaseUrl}
				/>

				{/* Two-Column Verification Suite */}
				<VerificationSection
					artifactFile={artifactToVerify}
					artifactPreview={artifactPreviewUrl}
					artifactHash={selectedArtifactHash}
					verificationResult={mappedVerificationResult}
					verificationError={error && artifactToVerify ? error : null}
					busy={verificationBusy}
					onFileChange={onArtifactToVerifyChange}
					onVerify={verifySelectedArtwork}
					reducedMotion={reducedMotion}
				/>

				{/* Advanced Provenance & Rights Terminal Accordion */}
				<section className="pc-advanced" aria-label="Advanced Provenance and Rights Management">
					<details className="pc-details">
						<summary className="pc-summary">
							<div className="pc-summary__left">
								<span className="pc-summary__tag">DECENTRALIZED REGISTRY & RIGHTS</span>
								<h3 className="pc-summary__title">Advanced Provenance Terminal</h3>
							</div>
							<svg
								className="pc-summary__icon"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
						</summary>

						<div className="pc-advanced-content">
							<div className="pc-workspace">
								{/* Left Sub-card: Provenance & Certificates */}
								<div className="pc-sub-card">
									<h4 className="pc-sub-card__title">Provenance & Certificates</h4>

									<div className="pc-form-group">
										<label className="pc-form-label">CREATOR WALLET</label>
										<input
											className="pc-input"
											value={creator}
											onChange={(event) => setCreator(event.target.value)}
											placeholder="0x…"
										/>
									</div>

									<div className="pc-form-group">
										<label className="pc-form-label">METADATA HASH</label>
										<input
											className="pc-input"
											value={metadataHash}
											onChange={(event) => setMetadataHash(event.target.value)}
											placeholder="0x + 64 hex characters"
										/>
									</div>

									<div className="pc-form-group">
										<label className="pc-form-label">CERTIFICATE TOKEN ID</label>
										<input
											className="pc-input"
											value={certificateTokenId}
											onChange={(event) => setCertificateTokenId(event.target.value)}
										/>
									</div>

									<div style={{ display: "flex", gap: "1rem" }}>
										<button
											type="button"
											onClick={createCertificate}
											disabled={certificateBusy}
											className="pc-btn pc-btn--primary"
											style={{ flex: 1 }}
										>
											{certificateBusy ? "Submitting…" : "Create Certificate"}
										</button>
										<button
											type="button"
											onClick={registerProvenance}
											className="pc-btn pc-btn--secondary"
											style={{ flex: 1 }}
										>
											Register Provenance
										</button>
									</div>

									{certificate && (
										<div className="pc-hash-box">
											<span className="pc-hash-box__label">ON-CHAIN CERTIFICATE DETAILS</span>
											<div className="pc-hash-box__value">
												<code>Token ID: {certificate.tokenId}</code>
												<br />
												<code>Tx: {certificate.transactionHash}</code>
												<br />
												<code>Chain: {certificate.chainId}</code>
												<br />
												<code>Contract: {certificate.contractAddress}</code>
											</div>
										</div>
									)}

									<div className="pc-form-group" style={{ marginTop: "1rem" }}>
										<label className="pc-form-label">LOOKUP FINGERPRINT</label>
										<input
											className="pc-input"
											value={lookupFingerprint}
											onChange={(event) => setLookupFingerprint(event.target.value)}
											placeholder="64 hex characters"
										/>
									</div>

									<button
										type="button"
										onClick={lookupProvenance}
										className="pc-btn pc-btn--secondary"
									>
										Lookup Ownership & Provenance
									</button>

									<div className="pc-form-group">
										<label className="pc-form-label">NEW OWNER ADDRESS</label>
										<input
											className="pc-input"
											value={newOwner}
											onChange={(event) => setNewOwner(event.target.value)}
											placeholder="0x…"
										/>
									</div>

									<button
										type="button"
										onClick={transferOwnership}
										disabled={transferBusy}
										className="pc-btn pc-btn--secondary"
									>
										{transferBusy ? "Submitting…" : "Transfer Ownership"}
									</button>
								</div>

								{/* Right Sub-card: Usage Rights */}
								<div className="pc-sub-card">
									<h4 className="pc-sub-card__title">Licensing & Usage Rights</h4>

									<div className="pc-form-group">
										<label className="pc-form-label">GRANTEE WALLET</label>
										<input
											className="pc-input"
											value={grantee}
											onChange={(event) => setGrantee(event.target.value)}
											placeholder="0x…"
										/>
									</div>

									<div className="pc-form-group">
										<label className="pc-form-label">RIGHTS MASK</label>
										<input
											type="number"
											className="pc-input"
											min="1"
											max="63"
											value={rightsMask}
											onChange={(event) => setRightsMask(event.target.value)}
										/>
									</div>

									<div className="pc-form-group">
										<label className="pc-form-label">RIGHTS TOKEN ID</label>
										<input
											className="pc-input"
											value={rightsTokenId}
											onChange={(event) => setRightsTokenId(event.target.value)}
											placeholder="Token ID for verify or revoke"
										/>
									</div>

									<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
										<button
											type="button"
											onClick={issueUsageRights}
											className="pc-btn pc-btn--primary"
										>
											Issue Usage Rights
										</button>
										<button
											type="button"
											onClick={verifyUsageRights}
											className="pc-btn pc-btn--secondary"
										>
											Verify Rights
										</button>
										<button
											type="button"
											onClick={revokeUsageRights}
											className="pc-btn pc-btn--secondary"
										>
											Revoke Rights
										</button>
									</div>
								</div>
							</div>

							{phase2Message && (
								<div
									className={`pc-status-msg ${phase2Error ? "pc-error-banner" : ""}`}
									role={phase2Error ? "alert" : "status"}
								>
									{phase2Message}
								</div>
							)}
						</div>
					</details>
				</section>
			</main>
		</div>
		<LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
		</>
	);
}
