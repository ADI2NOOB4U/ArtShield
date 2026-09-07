import React from "react";

export interface PipelineStep {
	id: string;
	number: string;
	title: string;
	subtext: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
	{ id: "upload", number: "01", title: "UPLOAD ARTWORK", subtext: "Binary ingestion & header parsing" },
	{ id: "analyze", number: "02", title: "ANALYZE", subtext: "Perceptual frequency & structure check" },
	{ id: "identity", number: "03", title: "IDENTITY", subtext: "Generating cryptographic fingerprint" },
	{ id: "watermark", number: "04", title: "WATERMARK", subtext: "Imperceptible latent-space embedding" },
	{ id: "integrity", number: "05", title: "INTEGRITY", subtext: "Calculating SHA-256 seal" },
	{ id: "provenance", number: "06", title: "PROVENANCE", subtext: "Binding ownership & ledger state" },
	{ id: "protected", number: "07", title: "PROTECTED", subtext: "Shielded artifact ready" },
];

export type StepStatus = "idle" | "active" | "complete";

export interface ProtectionPipelineProps {
	phase: number;
	busy: boolean;
	hasResult: boolean;
	reducedMotion?: boolean;
}

export const ProtectionPipeline: React.FC<ProtectionPipelineProps> = ({
	phase,
	busy,
	hasResult,
	reducedMotion = false,
}) => {
	const getStepStatus = (index: number): StepStatus => {
		if (hasResult || phase >= 8) return "complete";
		if (phase === 0) return "idle";
		const currentActiveIndex = phase - 1;
		if (index < currentActiveIndex) return "complete";
		if (index === currentActiveIndex) return "active";
		return "idle";
	};

	return (
		<section className={`pc-pipeline ${reducedMotion ? "pc-pipeline--reduced" : ""}`} aria-label="Protection Pipeline">
			<div className="pc-pipeline__header">
				<div className="pc-tag">
					<span className="pc-tag__dot" />
					<span>CRYPTOGRAPHIC PIPELINE</span>
				</div>
				<h2 className="pc-pipeline__title">Zero-Loss Protection Sequence</h2>
				<p className="pc-pipeline__desc">
					Each asset undergoes strict non-destructive encoding, dual-layer watermarking, and SHA-256 seal generation.
				</p>
			</div>

			<div className="pc-pipeline__track" role="list">
				{PIPELINE_STEPS.map((step, idx) => {
					const status = getStepStatus(idx);
					const isConnectorFilled = idx < phase - 1 || hasResult || phase >= 8;

					return (
						<div
							key={step.id}
							className={`pc-step pc-step--${status} ${busy && status === "active" ? "pc-step--pulsing" : ""}`}
							role="listitem"
							aria-current={status === "active" ? "step" : undefined}
						>
							{/* Connector line between steps */}
							{idx > 0 && (
								<div
									className={`pc-step__connector ${isConnectorFilled ? "pc-step__connector--filled" : ""}`}
									aria-hidden="true"
								/>
							)}

							<div className="pc-step__node">
								<span className="pc-step__badge">
									{status === "complete" ? (
										<svg
											className="pc-step__icon pc-step__icon--check"
											viewBox="0 0 16 16"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M3.5 8.5L6.5 11.5L12.5 4.5"
												stroke="currentColor"
												strokeWidth="1.8"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									) : (
										<span className="pc-step__number">{step.number}</span>
									)}
								</span>

								<div className="pc-step__content">
									<div className="pc-step__title-wrap">
										<span className="pc-step__title">{step.title}</span>
										{status === "active" && <span className="pc-step__pulse-dot" />}
									</div>
									<span className="pc-step__subtext">{step.subtext}</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};
