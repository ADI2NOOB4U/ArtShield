import React, { useRef, useState } from "react";
import { usePointerParallax } from "../../hooks/usePointerParallax";

export interface ProtectionResultProps {
	imageDataUrl: string;
	sha256: string;
	fingerprintHex: string;
	watermark: string;
	title: string;
	artist: string;
	timestamp: string;
	tamperResistant: boolean;
	verifiedAuthentic?: boolean;
	onDownload: () => void;
	reducedMotion?: boolean;
}

export const ProtectionResult: React.FC<ProtectionResultProps> = ({
	imageDataUrl,
	sha256,
	fingerprintHex,
	watermark,
	title,
	artist,
	timestamp,
	tamperResistant,
	verifiedAuthentic,
	onDownload,
	reducedMotion = false,
}) => {
	const cardRef = useRef<HTMLDivElement | null>(null);
	usePointerParallax(cardRef, !reducedMotion);

	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const copyToClipboard = (text: string, key: string) => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			void navigator.clipboard.writeText(text);
			setCopiedKey(key);
			setTimeout(() => {
				setCopiedKey((curr) => (curr === key ? null : curr));
			}, 2000);
		}
	};

	return (
		<section className="pc-result-section" aria-label="Protected Artwork Showcase">
			<div className="pc-result-layout">
				{/* 3D Floating Hero Showcase */}
				<div className="pc-hero-frame-wrapper">
					<div
						ref={cardRef}
						className="pc-hero-frame"
						data-parallax-target="true"
					>
						{/* Ambient Glow behind image */}
						<div className="pc-hero-frame__glow" />

						{/* Artwork Canvas Container */}
						<div className="pc-hero-frame__inner">
							<div className="pc-hero-frame__status-badge">
								<span className="pc-hero-frame__status-dot" />
								<span>SECURED & WATERMARKED</span>
							</div>

							<div className="pc-hero-frame__image-box">
								<img
									src={imageDataUrl}
									alt={title ? `Protected artwork: ${title}` : "Protected artwork asset"}
									className="pc-hero-frame__image"
								/>
								{/* Surface scan reflection overlay */}
								<div className="pc-hero-frame__scanline" />
							</div>

							{/* Optical Floor Reflection */}
							<div className="pc-hero-frame__reflection" aria-hidden="true">
								<img src={imageDataUrl} alt="" className="pc-hero-frame__reflection-img" />
							</div>
						</div>
					</div>
				</div>

				{/* Security Certificate Panel */}
				<div className="pc-cert-panel">
					<div className="pc-cert-panel__header">
						<div className="pc-tag pc-tag--accent">
							<svg
								className="pc-tag__shield-icon"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8 1.5L2.5 3.83333V7.33333C2.5 10.745 4.84667 13.9183 8 14.6667C11.1533 13.9183 13.5 10.745 13.5 7.33333V3.83333L8 1.5Z"
									stroke="currentColor"
									strokeWidth="1.4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M6 8L7.33333 9.33333L10.3333 6.33333"
									stroke="currentColor"
									strokeWidth="1.4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>CRYPTOGRAPHIC CERTIFICATE</span>
						</div>
						<h3 className="pc-cert-panel__title">Shield Artifact Verified</h3>
						<p className="pc-cert-panel__subtitle">
							Immutable provenance record generated and ready for cryptographic deployment.
						</p>
					</div>

					{/* Metadata Grid */}
					<div className="pc-cert-panel__meta-grid">
						<div className="pc-meta-row">
							<span className="pc-meta-row__label">ARTWORK TITLE</span>
							<span className="pc-meta-row__val pc-meta-row__val--strong">{title || "Untitled Masterwork"}</span>
						</div>

						<div className="pc-meta-row">
							<span className="pc-meta-row__label">CREATOR / ARTIST</span>
							<span className="pc-meta-row__val">{artist || "Anonymous Principal"}</span>
						</div>

						<div className="pc-meta-row">
							<span className="pc-meta-row__label">TIMESTAMP (UTC)</span>
							<span className="pc-meta-row__val pc-meta-row__val--mono">
								{timestamp ? new Date(timestamp).toUTCString() : "Just now"}
							</span>
						</div>

						<div className="pc-meta-row">
							<span className="pc-meta-row__label">TAMPER RESISTANCE</span>
							<span className="pc-meta-row__val pc-meta-row__val--badge">
								{tamperResistant ? "ACTIVE (HIGH FIDELITY)" : "STANDARD"}
							</span>
						</div>

						{verifiedAuthentic !== undefined && (
							<div className="pc-meta-row">
								<span className="pc-meta-row__label">SOURCE VERIFICATION</span>
								<span className="pc-meta-row__val pc-meta-row__val--accent">
									{verifiedAuthentic ? "GENUINE ARTIFACT MATCH" : "UNVERIFIED"}
								</span>
							</div>
						)}
					</div>

					{/* Cryptographic Hashes */}
					<div className="pc-cert-panel__hashes">
						<div className="pc-hash-box">
							<div className="pc-hash-box__head">
								<span className="pc-hash-box__label">SHA-256 ARTIFACT SEAL</span>
								<button
									type="button"
									className="pc-hash-box__copy-btn"
									onClick={() => copyToClipboard(sha256, "sha256")}
									title="Copy full SHA-256 hash"
								>
									{copiedKey === "sha256" ? "COPIED" : "COPY HASH"}
								</button>
							</div>
							<div className="pc-hash-box__value">
								<code>{sha256}</code>
							</div>
						</div>

						<div className="pc-hash-box">
							<div className="pc-hash-box__head">
								<span className="pc-hash-box__label">LATENT FINGERPRINT</span>
								<button
									type="button"
									className="pc-hash-box__copy-btn"
									onClick={() => copyToClipboard(fingerprintHex, "fingerprint")}
									title="Copy fingerprint"
								>
									{copiedKey === "fingerprint" ? "COPIED" : "COPY HASH"}
								</button>
							</div>
							<div className="pc-hash-box__value">
								<code>{fingerprintHex}</code>
							</div>
						</div>

						<div className="pc-hash-box">
							<div className="pc-hash-box__head">
								<span className="pc-hash-box__label">EMBEDDED WATERMARK KEY</span>
							</div>
							<div className="pc-hash-box__value">
								<code>{watermark}</code>
							</div>
						</div>
					</div>

					{/* Download Action */}
					<div className="pc-cert-panel__actions">
						<button
							type="button"
							onClick={onDownload}
							className="pc-btn pc-btn--primary pc-btn--download"
						>
							<svg
								className="pc-btn__icon"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M10 3.33333V13.3333M10 13.3333L5.83333 9.16667M10 13.3333L14.1667 9.16667M3.33333 16.6667H16.6667"
									stroke="currentColor"
									strokeWidth="1.7"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>DOWNLOAD PROTECTED ARTIFACT</span>
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

