import React from "react";

export interface PipelineStep {
	id: string;
	number: string;
	title: string;
	subtext: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
	{ id: "identity", number: "01", title: "IDENTITY", subtext: "SHA-256 artwork fingerprint" },
	{ id: "watermark", number: "02", title: "WATERMARK", subtext: "LSB steganographic watermark" },
	{ id: "ai-shield", number: "03", title: "AI SHIELD", subtext: "AI Shield · Deterministic frequency perturbation" },
	{ id: "integrity", number: "04", title: "INTEGRITY", subtext: "Cryptographic parity and hash verification" },
	{ id: "provenance", number: "05", title: "PROVENANCE", subtext: "Registry-backed artifact record" },
	{ id: "rights", number: "06", title: "RIGHTS", subtext: "Usage-rights declaration · enforcement in development" },
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
		if (hasResult || phase >= 9) return "complete";
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
				<h2 className="pc-pipeline__title">Protection Sequence</h2>
				<p className="pc-pipeline__desc">
					The protection request produces the protected artifact; these steps show the six protection layers represented in the beta workspace.
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
