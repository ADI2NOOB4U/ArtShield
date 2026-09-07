import { useEffect, useMemo, useState } from "react";

export type ArtifactEvent = { at: string; label: string; detail: string };
export type ProvenanceRecord = {
	owner?: string;
	creator?: string;
	certificateTokenId?: string;
	registeredAt?: string;
	registered?: boolean;
	entries?: string[];
};

interface ArtifactIntelligenceProps {
	file: File | null;
	preview: string | null;
	result: { fingerprint: string; watermark: string; protected_artifact_hash: string } | null;
	title: string;
	artist: string;
	certificate: { tokenId: string; transactionHash: string; contractAddress: string; chainId: string } | null;
	provenance: ProvenanceRecord | null;
	events: ArtifactEvent[];
	apiBase: string;
}

type ImageFacts = { width: number; height: number };
type ServiceState = "checking" | "online" | "offline" | "unavailable";

const DEFENSE_LAYERS = [
	{ id: "identity", label: "01 IDENTITY", desc: "SHA-256 Digest" },
	{ id: "watermark", label: "02 WATERMARK", desc: "Latent LSB Key" },
	{ id: "ai_shield", label: "03 AI SHIELD", desc: "Frequency Hardening" },
	{ id: "integrity", label: "04 INTEGRITY", desc: "Parity Checksum" },
	{ id: "provenance", label: "05 PROVENANCE", desc: "On-Chain Record" },
	{ id: "rights", label: "06 RIGHTS", desc: "Usage License" },
];

function short(value?: string) {
	return value ? `${value.slice(0, 10)}…${value.slice(-8)}` : "—";
}

function downloadJson(name: string, data: unknown) {
	const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
	const link = document.createElement("a");
	link.href = href;
	link.download = name;
	link.click();
	setTimeout(() => URL.revokeObjectURL(href), 0);
}

export function ArtifactIntelligence({
	file,
	preview,
	result,
	title,
	artist,
	certificate,
	provenance,
	events,
	apiBase,
}: ArtifactIntelligenceProps) {
	const [facts, setFacts] = useState<ImageFacts | null>(null);
	const [passportOpen, setPassportOpen] = useState(false);
	const [selectedNode, setSelectedNode] = useState<string>("ARTWORK");
	const [services, setServices] = useState<Record<string, ServiceState>>({
		FRONTEND: "online",
		BACKEND: "checking",
		"ML ENGINE": "checking",
		BLOCKCHAIN: "checking",
	});

	useEffect(() => {
		if (!file) {
			setFacts(null);
			return;
		}
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			setFacts({ width: image.naturalWidth, height: image.naturalHeight });
			URL.revokeObjectURL(url);
		};
		image.onerror = () => {
			setFacts(null);
			URL.revokeObjectURL(url);
		};
		image.src = url;
	}, [file]);

	useEffect(() => {
		let cancelled = false;
		fetch(`${apiBase}/api/system-status`)
			.then(async (response) => {
				if (!response.ok) throw new Error();
				return response.json() as Promise<{ backend: boolean; ml: boolean; blockchain: boolean }>;
			})
			.then((value) => {
				if (!cancelled) {
					setServices({
						FRONTEND: "online",
						BACKEND: value.backend ? "online" : "offline",
						"ML ENGINE": value.ml ? "online" : "offline",
						BLOCKCHAIN: value.blockchain ? "online" : "offline",
					});
				}
			})
			.catch(() => {
				if (!cancelled) {
					setServices({
						FRONTEND: "online",
						BACKEND: "offline",
						"ML ENGINE": "unavailable",
						BLOCKCHAIN: "unavailable",
					});
				}
			});
		return () => {
			cancelled = true;
		};
	}, [apiBase]);

	const passport = useMemo(
		() => ({
			artifactId: result?.fingerprint || "PENDING_PROTECTION",
			title: title || "Untitled Masterwork",
			artist: artist || "Anonymous Principal",
			sha256Seal: result?.protected_artifact_hash || "NOT_GENERATED",
			fingerprint: result?.fingerprint || "NOT_GENERATED",
			watermarkStatus: result ? "Embedded Latent Frequency" : "Pending",
			aiShieldStatus: result ? "Active Perturbation Hardening" : "Pending",
			integrityStatus: result ? "Client Verification Reference Active" : "Pending",
			certificate: certificate
				? {
						tokenId: certificate.tokenId,
						transactionHash: certificate.transactionHash,
						chainId: certificate.chainId,
						contractAddress: certificate.contractAddress,
				  }
				: undefined,
			provenance: provenance?.registered ? provenance : undefined,
		}),
		[certificate, provenance, result, title, artist],
	);

	const graphNodes: [string, string][] = useMemo(() => {
		const list: [string, string][] = [
			["ARTWORK", file ? file.name : "Awaiting selection"],
			["IDENTITY", result?.fingerprint ? short(result.fingerprint) : "Pending protection"],
			["WATERMARK", result?.watermark ? `Embedded: ${result.watermark}` : "Pending protection"],
			["INTEGRITY", result?.protected_artifact_hash ? short(result.protected_artifact_hash) : "Pending protection"],
		];
		if (certificate) {
			list.push(["CERTIFICATE", `Token #${certificate.tokenId} (${short(certificate.transactionHash)})`]);
		}
		if (provenance?.owner) {
			list.push(["OWNER", short(provenance.owner)]);
		}
		if (provenance?.registered) {
			list.push(["PROVENANCE", `${provenance.entries?.length ?? 0} on-chain entry/entries`]);
		}
		return list;
	}, [file, result, certificate, provenance]);

	return (
		<>
			{/* Artifact Sentinel Main Showcase */}
			<section className="pc-intelligence" aria-label="Artifact Intelligence & Sentinel">
				<div className="pc-section-header">
					<div className="pc-tag pc-tag--cyan">
						<span className="pc-tag__dot" />
						<span>SECURITY TELEMETRY</span>
					</div>
					<h2 className="pc-section-header__title">Artifact Sentinel</h2>
					<p className="pc-section-header__subtitle">
						Real-time cryptographic posture and deep forensic inspection derived from workspace operations.
					</p>
				</div>

				<div className="pc-intelligence__grid">
					{/* Left: Sentinel Radar & Multi-layer Status */}
					<div className={`pc-sentinel ${result ? "pc-sentinel--secured" : ""}`}>
						<div className="pc-sentinel__radar" aria-hidden="true">
							<div className="pc-sentinel__orbit pc-sentinel__orbit--one" />
							<div className="pc-sentinel__orbit pc-sentinel__orbit--two" />
							<div className="pc-sentinel__orbit pc-sentinel__orbit--three" />
						</div>

						{/* Center Preview Frame */}
						<div className="pc-sentinel__center">
							{preview ? (
								<img className="pc-sentinel__art" src={preview} alt="Artifact Sentinel preview" />
							) : (
								<div className="pc-sentinel__empty">
									<svg className="pc-sentinel__empty-icon" viewBox="0 0 24 24" fill="none">
										<path
											d="M12 2L3 7V12C3 17.5228 6.94165 22.5027 12 23.9443C17.0583 22.5027 21 17.5228 21 12V7L12 2Z"
											stroke="currentColor"
											strokeWidth="1.5"
										/>
									</svg>
									<span>AWAITING ARTIFACT</span>
								</div>
							)}
						</div>

						{/* 6 Defense Layer Chips */}
						<div className="pc-sentinel__layers" role="list">
							{DEFENSE_LAYERS.map((layer) => {
								const isSecured = Boolean(result);
								return (
									<div
										key={layer.id}
										className={`pc-sentinel__chip ${isSecured ? "pc-sentinel__chip--secured" : ""}`}
										role="listitem"
									>
										<span className="pc-sentinel__chip-dot" />
										<div className="pc-sentinel__chip-info">
											<span className="pc-sentinel__chip-label">{layer.label}</span>
											<span className="pc-sentinel__chip-desc">{layer.desc}</span>
										</div>
									</div>
								);
							})}
						</div>

						{/* Status Bar */}
						<div className="pc-sentinel__status-bar">
							<span className={`pc-sentinel__status-dot ${result ? "pc-sentinel__status-dot--green" : ""}`} />
							<span className="pc-sentinel__status-text">
								{result ? "ARTIFACT DEFENSE ACTIVE · SHA-256 SEALED" : "STANDBY · AWAITING ARTIFACT INGESTION"}
							</span>
						</div>
					</div>

					{/* Right: Artifact Passport Action Card */}
					<div className="pc-intelligence__passport-card">
						<div className="pc-passport-card__head">
							<span className="pc-tag pc-tag--accent">IDENTITY RECORD</span>
							<h3 className="pc-passport-card__title">Artifact Passport</h3>
							<p className="pc-passport-card__desc">
								Portable, verifiable cryptographic identity certificate. Encapsulates fingerprint, watermark
								signature, and blockchain references into a tamper-evident dossier.
							</p>
						</div>

						<div className="pc-passport-card__preview-data">
							<div className="pc-meta-row">
								<span className="pc-meta-row__label">CANONICAL ID</span>
								<code className="pc-meta-row__val pc-meta-row__val--mono">
									{result ? short(result.fingerprint) : "Pending protection"}
								</code>
							</div>
							<div className="pc-meta-row">
								<span className="pc-meta-row__label">ARTIFACT SEAL</span>
								<code className="pc-meta-row__val pc-meta-row__val--mono">
									{result ? short(result.protected_artifact_hash) : "Pending protection"}
								</code>
							</div>
							<div className="pc-meta-row">
								<span className="pc-meta-row__label">SECURITY POSTURE</span>
								<span className="pc-meta-row__val pc-meta-row__val--accent">
									{result ? "PROTECTED & REGISTERED" : "UNPROTECTED CANDIDATE"}
								</span>
							</div>
						</div>

						<div className="pc-passport-card__actions">
							<button
								type="button"
								className="pc-btn pc-btn--primary pc-btn--full"
								disabled={!result}
								onClick={() => setPassportOpen(true)}
							>
								VIEW ARTIFACT PASSPORT
							</button>
							<button
								type="button"
								className="pc-btn pc-btn--secondary pc-btn--full"
								disabled={!result}
								onClick={() => downloadJson("artshield-artifact-passport.json", passport)}
							>
								EXPORT PASSPORT JSON
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* 4-Card Forensic & Chain-of-Custody Grid */}
			<section className="pc-platform-grid" aria-label="Forensics, timeline, graph, and event logs">
				{/* 1. Live Artifact Forensics */}
				<article className="pc-platform-card">
					<div className="pc-platform-card__header">
						<span className="pc-platform-card__eyebrow">LIVE ARTIFACT FORENSICS</span>
						<h3 className="pc-platform-card__title">Binary & Visual Examination</h3>
					</div>
					{file ? (
						<dl className="pc-facts">
							<div className="pc-facts__row">
								<dt>FILE NAME</dt>
								<dd className="truncate" title={file.name}>
									{file.name}
								</dd>
							</div>
							<div className="pc-facts__row">
								<dt>MIME TYPE</dt>
								<dd>{file.type || "image/png (inferred)"}</dd>
							</div>
							<div className="pc-facts__row">
								<dt>BYTE SIZE</dt>
								<dd>{file.size.toLocaleString()} bytes</dd>
							</div>
							<div className="pc-facts__row">
								<dt>DIMENSIONS</dt>
								<dd>{facts ? `${facts.width} × ${facts.height} px` : "Analyzing matrix…"}</dd>
							</div>
							<div className="pc-facts__row">
								<dt>TOTAL PIXELS</dt>
								<dd>{facts ? (facts.width * facts.height).toLocaleString() : "—"}</dd>
							</div>
							<div className="pc-facts__row">
								<dt>SHA-256 SEAL</dt>
								<dd className="pc-facts__hash">
									{result?.protected_artifact_hash ? short(result.protected_artifact_hash) : "Available after protection"}
								</dd>
							</div>
						</dl>
					) : (
						<div className="pc-platform-card__empty">
							<p className="pc-muted">Select an image to inspect real local file characteristics and dimensions.</p>
						</div>
					)}
				</article>

				{/* 2. Chain of Custody Timeline */}
				<article className="pc-platform-card">
					<div className="pc-platform-card__header">
						<span className="pc-platform-card__eyebrow">CHAIN OF CUSTODY</span>
						<h3 className="pc-platform-card__title">Integrity Lifecycle Log</h3>
					</div>
					<ol className="pc-timeline">
						<li className={`pc-timeline__item ${file ? "pc-timeline__item--active" : ""}`}>
							<span className="pc-timeline__marker" />
							<div className="pc-timeline__content">
								<b>01 INGESTED</b>
								<span>{file ? `Local asset: ${file.name}` : "Awaiting candidate file"}</span>
							</div>
						</li>
						<li className={`pc-timeline__item ${result ? "pc-timeline__item--active" : ""}`}>
							<span className="pc-timeline__marker" />
							<div className="pc-timeline__content">
								<b>02 IDENTIFIED & WATERMARKED</b>
								<span>{result ? "Dual-layer cryptographic watermark embedded" : "Pending pipeline run"}</span>
							</div>
						</li>
						<li className={`pc-timeline__item ${certificate ? "pc-timeline__item--active" : ""}`}>
							<span className="pc-timeline__marker" />
							<div className="pc-timeline__content">
								<b>03 ON-CHAIN CERTIFICATE</b>
								<span>{certificate ? `Token #${certificate.tokenId} issued` : "Optional blockchain issuance"}</span>
							</div>
						</li>
						<li className={`pc-timeline__item ${provenance?.registered ? "pc-timeline__item--active" : ""}`}>
							<span className="pc-timeline__marker" />
							<div className="pc-timeline__content">
								<b>04 REGISTRY PROVENANCE</b>
								<span>
									{provenance?.registered ? `${provenance.entries?.length ?? 1} history entry recorded` : "Registry unlinked"}
								</span>
							</div>
						</li>
					</ol>
				</article>

				{/* 3. Provenance Graph Record Investigation */}
				<article className="pc-platform-card">
					<div className="pc-platform-card__header">
						<span className="pc-platform-card__eyebrow">PROVENANCE GRAPH</span>
						<h3 className="pc-platform-card__title">Record Investigation</h3>
					</div>
					<div className="pc-graph">
						<div className="pc-graph__nodes">
							{graphNodes.map(([label]) => (
								<button
									key={label}
									type="button"
									onClick={() => setSelectedNode(label)}
									className={`pc-graph__btn ${selectedNode === label ? "pc-graph__btn--active" : ""}`}
								>
									{label}
								</button>
							))}
						</div>
						<div className="pc-graph__callout">
							<span className="pc-graph__callout-title">{selectedNode} DATA PAYLOAD</span>
							<p className="pc-graph__callout-val">
								{graphNodes.find(([lbl]) => lbl === selectedNode)?.[1] || "No record populated."}
							</p>
						</div>
					</div>
				</article>

				{/* 4. Security Event Stream */}
				<article className="pc-platform-card">
					<div className="pc-platform-card__header">
						<span className="pc-platform-card__eyebrow">SECURITY EVENT STREAM</span>
						<h3 className="pc-platform-card__title">Cryptographic Operations Log</h3>
					</div>
					<div className="pc-event-stream">
						{events.length > 0 ? (
							events
								.slice()
								.reverse()
								.map((evt, idx) => (
									<div key={`${evt.at}-${idx}`} className="pc-event-item">
										<time className="pc-event-item__time">{new Date(evt.at).toLocaleTimeString()}</time>
										<span className="pc-event-item__tag">{evt.label}</span>
										<span className="pc-event-item__detail">{evt.detail}</span>
									</div>
								))
						) : (
							<div className="pc-platform-card__empty">
								<p className="pc-muted">Events record automatically when workspace operations execute.</p>
							</div>
						)}
					</div>
				</article>
			</section>

			{/* System Status Exhibition Monitor */}
			<section className="pc-system-status" aria-label="System status monitor">
				<div className="pc-system-status__header">
					<span className="pc-platform-card__eyebrow">SYSTEM STATUS</span>
					<h4 className="pc-system-status__title">Exhibition Node Monitor</h4>
				</div>
				<div className="pc-system-status__grid">
					{Object.entries(services).map(([name, state]) => (
						<div key={name} className={`pc-status-pill pc-status-pill--${state}`}>
							<span className="pc-status-pill__indicator" />
							<span className="pc-status-pill__name">{name}</span>
							<span className="pc-status-pill__badge">{state.toUpperCase()}</span>
						</div>
					))}
				</div>
			</section>

			{/* Artifact Passport Modal */}
			{passportOpen && (
				<div className="pc-passport-backdrop" role="dialog" aria-modal="true" aria-label="Artifact Passport">
					<div className="pc-passport-modal">
						<button
							type="button"
							className="pc-passport-modal__close"
							onClick={() => setPassportOpen(false)}
							aria-label="Close passport dialog"
						>
							✕
						</button>

						<div className="pc-passport-modal__head">
							<span className="pc-tag pc-tag--accent">OFFICIAL PASSPORT</span>
							<h3 className="pc-passport-modal__title">{title || "Untitled Masterwork"}</h3>
							<p className="pc-passport-modal__sub">Creator: {artist || "Anonymous Principal"}</p>
						</div>

						{preview && (
							<div className="pc-passport-modal__media">
								<img src={preview} alt="Passport artifact" className="pc-passport-modal__img" />
							</div>
						)}

						<dl className="pc-passport-modal__facts">
							{Object.entries(passport)
								.filter(([, val]) => val !== undefined)
								.map(([key, val]) => (
									<div key={key} className="pc-passport-modal__row">
										<dt>{key.replace(/([A-Z])/g, " $1").toUpperCase()}</dt>
										<dd>
											<code>{typeof val === "object" ? JSON.stringify(val) : String(val)}</code>
										</dd>
									</div>
								))}
						</dl>

						<div className="pc-passport-modal__actions">
							<button type="button" className="pc-btn pc-btn--secondary" onClick={() => window.print()}>
								PRINT PASSPORT
							</button>
							<button
								type="button"
								className="pc-btn pc-btn--primary"
								onClick={() => downloadJson("artshield-artifact-passport.json", passport)}
							>
								DOWNLOAD JSON
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
