import React, { useRef, useState } from "react";
import { usePointerParallax } from "../../hooks/usePointerParallax";

export interface VerificationResultData {
	authentic: boolean;
	integrityVerified: boolean;
	tamperDetected: boolean;
	sha256Matched?: boolean;
	fingerprintMatched?: boolean;
	watermarkMatched?: boolean;
	confidence?: number;
	details?: string;
	referenceId?: string;
	timestamp?: string;
}

export interface VerificationSectionProps {
	artifactFile: File | null;
	artifactPreview: string | null;
	artifactHash: string;
	verificationResult: VerificationResultData | null;
	verificationError: string | null;
	busy: boolean;
	onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onVerify: () => void;
	reducedMotion?: boolean;
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({
	artifactFile,
	artifactPreview,
	artifactHash,
	verificationResult,
	verificationError,
	busy,
	onFileChange,
	onVerify,
	reducedMotion = false,
}) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const previewCardRef = useRef<HTMLDivElement | null>(null);
	usePointerParallax(previewCardRef, !reducedMotion && Boolean(artifactPreview));

	const [isDragOver, setIsDragOver] = useState(false);

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const fakeEvent = {
				target: {
					files: e.dataTransfer.files,
				},
			} as unknown as React.ChangeEvent<HTMLInputElement>;
			onFileChange(fakeEvent);
		}
	};

	return (
		<section className="pc-verify-section" aria-label="Cryptographic Verification Lab">
			<div className="pc-section-header">
				<div className="pc-tag pc-tag--cyan">
					<span className="pc-tag__dot" />
					<span>INTEGRITY VERIFICATION SUITE</span>
				</div>
				<h2 className="pc-section-header__title">Audit & Authenticate</h2>
				<p className="pc-section-header__subtitle">
					Validate physical and digital artwork integrity against immutable mathematical fingerprints.
				</p>
			</div>

			<div className="pc-verify-grid">
				{/* LEFT COLUMN: Input, Preview & Parity Hash */}
				<div className="pc-verify-col pc-verify-col--input">
					<div className="pc-panel-card">
						<div className="pc-panel-card__header">
							<span className="pc-panel-card__tag">SOURCE ARTIFACT</span>
							<h3 className="pc-panel-card__title">Inspect Candidate Asset</h3>
						</div>

						{/* Hidden input */}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={onFileChange}
							className="pc-hidden-input"
							id="verify-file-input"
						/>

						{/* Drag & Drop Target / Preview Area */}
						{!artifactFile ? (
							<div
								className={`pc-dropzone pc-dropzone--verify ${isDragOver ? "pc-dropzone--active" : ""}`}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragOver(true);
								}}
								onDragLeave={() => setIsDragOver(false)}
								onDrop={handleDrop}
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
											d="M9 3H5C3.89543 3 3 3.89543 3 5V9M15 3H19C20.1046 3 21 3.89543 21 5V9M9 21H5C3.89543 21 3 20.1046 3 19V15M15 21H19C20.1046 21 21 20.1046 21 19V15"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
										/>
										<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
									</svg>
								</div>
								<div className="pc-dropzone__copy">
									<span className="pc-dropzone__headline">Drop Asset For Verification</span>
									<span className="pc-dropzone__sub">PNG, JPEG, WEBP or AVIF up to 32MB</span>
								</div>
								<span className="pc-dropzone__cta">SELECT LOCAL FILE</span>
							</div>
						) : (
							<div className="pc-preview-box">
								<div
									ref={previewCardRef}
									className="pc-preview-card"
									data-parallax-target="true"
								>
									{artifactPreview && (
										<div className="pc-preview-card__media">
											<img
												src={artifactPreview}
												alt="Asset selected for verification"
												className="pc-preview-card__img"
											/>
											<div className="pc-preview-card__grid-overlay" />
										</div>
									)}

									<div className="pc-preview-card__meta">
										<div className="pc-preview-card__file-info">
											<span className="pc-preview-card__name">{artifactFile.name}</span>
											<span className="pc-preview-card__size">
												{(artifactFile.size / (1024 * 1024)).toFixed(2)} MB
											</span>
										</div>
										<button
											type="button"
											className="pc-preview-card__reselect"
											onClick={() => fileInputRef.current?.click()}
										>
											CHANGE ASSET
										</button>
									</div>
								</div>

								{/* Calculated SHA-256 for this candidate */}
								<div className="pc-hash-readout">
									<div className="pc-hash-readout__head">
										<span className="pc-hash-readout__label">CALCULATED CLIENT SHA-256</span>
										<span className="pc-hash-readout__status">
											{artifactHash ? "READY" : "HASHING..."}
										</span>
									</div>
									<div className="pc-hash-readout__body">
										<code>{artifactHash || "Computing cryptographic digest..."}</code>
									</div>
								</div>

								{/* Verify Execution Button */}
								<button
									type="button"
									onClick={onVerify}
									disabled={busy || !artifactHash}
									className={`pc-btn pc-btn--primary pc-btn--full ${busy ? "pc-btn--busy" : ""}`}
								>
									{busy ? (
										<>
											<span className="pc-spinner pc-spinner--sm" />
											<span>EXECUTING PARITY AUDIT...</span>
										</>
									) : (
										<>
											<svg
												className="pc-btn__icon"
												viewBox="0 0 16 16"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C11.0376 2.5 13.5 4.96243 13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8Z"
													stroke="currentColor"
													strokeWidth="1.4"
												/>
												<path
													d="M5.5 8L7.2 9.7L10.5 6.3"
													stroke="currentColor"
													strokeWidth="1.4"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
											<span>VERIFY ARTIFACT INTEGRITY</span>
										</>
									)}
								</button>
							</div>
						)}
					</div>
				</div>

				{/* RIGHT COLUMN: State Terminal & Verification Verdict */}
				<div className="pc-verify-col pc-verify-col--verdict">
					<div className="pc-panel-card pc-panel-card--verdict">
						<div className="pc-panel-card__header">
							<span className="pc-panel-card__tag">VERIFICATION TERMINAL</span>
							<h3 className="pc-panel-card__title">Integrity Assessment</h3>
						</div>

						{/* State 1: Awaiting Artifact */}
						{!verificationResult && !verificationError && (
							<div className="pc-awaiting-state">
								<div className="pc-awaiting-state__radar">
									<div className="pc-awaiting-state__ring pc-awaiting-state__ring--1" />
									<div className="pc-awaiting-state__ring pc-awaiting-state__ring--2" />
									<div className="pc-awaiting-state__ring pc-awaiting-state__ring--3" />
									<div className="pc-awaiting-state__scan-beam" />
									<div className="pc-awaiting-state__center-dot" />
								</div>
								<h4 className="pc-awaiting-state__title">AWAITING ARTIFACT</h4>
								<p className="pc-awaiting-state__desc">
									Select a shielded image to evaluate SHA-256 seal parity, latent-space watermark existence, and registry provenance.
								</p>
							</div>
						)}

						{/* State 2: Error Notification */}
						{verificationError && (
							<div className="pc-verdict pc-verdict--error" role="alert">
								<div className="pc-verdict__icon-badge">
									<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M12 9V14M12 17.5V18M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
										/>
									</svg>
								</div>
								<div className="pc-verdict__headline">VERIFICATION ANOMALY</div>
								<p className="pc-verdict__message">{verificationError}</p>
							</div>
						)}

						{/* State 3: Authentic Verification Verdict */}
						{verificationResult && verificationResult.authentic && (
							<div className="pc-verdict pc-verdict--success">
								<div className="pc-verdict__header">
									<div className="pc-verdict__badge-success">
										<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M3.5 8.5L6.5 11.5L12.5 4.5"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span>AUTHENTIC ARTIFACT</span>
									</div>
									{verificationResult.confidence !== undefined && (
										<span className="pc-verdict__confidence">
											{Math.round(verificationResult.confidence * 100)}% CONFIDENCE
										</span>
									)}
								</div>

								<div className="pc-verdict__title-block">
									<span className="pc-verdict__big-label">INTEGRITY VERIFIED</span>
									<p className="pc-verdict__lead">
										Cryptographic fingerprint and SHA-256 seal match original registration ledger with zero unauthorized modifications.
									</p>
								</div>

								{/* Audit Checklist */}
								<div className="pc-verdict__checklist">
									<div className="pc-check-item pc-check-item--pass">
										<span className="pc-check-item__indicator">✓</span>
										<div className="pc-check-item__content">
											<span className="pc-check-item__label">SHA-256 SEAL INTEGRITY</span>
											<span className="pc-check-item__status">MATCH CONFIRMED</span>
										</div>
									</div>

									<div className="pc-check-item pc-check-item--pass">
										<span className="pc-check-item__indicator">✓</span>
										<div className="pc-check-item__content">
											<span className="pc-check-item__label">LATENT WATERMARK KEY</span>
											<span className="pc-check-item__status">
												{verificationResult.watermarkMatched ? "RECOVERED & VERIFIED" : "REGISTERED"}
											</span>
										</div>
									</div>

									<div className="pc-check-item pc-check-item--pass">
										<span className="pc-check-item__indicator">✓</span>
										<div className="pc-check-item__content">
											<span className="pc-check-item__label">TAMPER RESISTANCE</span>
											<span className="pc-check-item__status">NO ANOMALIES DETECTED</span>
										</div>
									</div>
								</div>

								{verificationResult.referenceId && (
									<div className="pc-verdict__meta-footer">
										<span className="pc-verdict__meta-key">REGISTRY ID</span>
										<code className="pc-verdict__meta-val">{verificationResult.referenceId}</code>
									</div>
								)}
							</div>
						)}

						{/* State 4: Tampered / Failed Verification Verdict */}
						{verificationResult && !verificationResult.authentic && (
							<div className="pc-verdict pc-verdict--tampered">
								<div className="pc-verdict__header">
									<div className="pc-verdict__badge-tampered">
										<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M12 4L4 12M4 4L12 12"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
											/>
										</svg>
										<span>TAMPERING DETECTED</span>
									</div>
								</div>

								<div className="pc-verdict__title-block">
									<span className="pc-verdict__big-label pc-verdict__big-label--alert">
										INTEGRITY COMPROMISED
									</span>
									<p className="pc-verdict__lead">
										{verificationResult.details ||
											"The submitted asset failed cryptographic seal verification. One or more bytes or visual frequency bands have been modified."}
									</p>
								</div>

								<div className="pc-verdict__checklist">
									<div className="pc-check-item pc-check-item--fail">
										<span className="pc-check-item__indicator">✕</span>
										<div className="pc-check-item__content">
											<span className="pc-check-item__label">SHA-256 PARITY</span>
											<span className="pc-check-item__status">MISMATCH</span>
										</div>
									</div>

									<div className="pc-check-item pc-check-item--fail">
										<span className="pc-check-item__indicator">✕</span>
										<div className="pc-check-item__content">
											<span className="pc-check-item__label">WATERMARK RECOVERY</span>
											<span className="pc-check-item__status">DISTORTED OR UNRECOGNIZED</span>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

