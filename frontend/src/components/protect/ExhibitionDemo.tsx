import { useEffect, useMemo, useState } from "react";

const BETA_STEPS = ["UPLOAD", "IDENTITY", "WATERMARK", "AI SHIELD", "INTEGRITY", "PROVENANCE", "VERIFY"];

interface ExhibitionDemoProps {
	fileSelected: boolean;
	protecting: boolean;
	hasProtectedArtifact: boolean;
	artifactSelected: boolean;
	verificationComplete: boolean;
	onStart: () => void;
}

/** A guide for exhibition visitors. Progress comes only from real workspace state. */
export function ExhibitionDemo({
	fileSelected,
	protecting,
	hasProtectedArtifact,
	artifactSelected,
	verificationComplete,
	onStart,
}: ExhibitionDemoProps) {
	const [active, setActive] = useState(false);
	const current = useMemo(() => {
		if (verificationComplete) return 7;
		if (artifactSelected) return 6;
		if (hasProtectedArtifact) return 5;
		if (protecting) return 2;
		if (fileSelected) return 1;
		return 0;
	}, [artifactSelected, fileSelected, hasProtectedArtifact, protecting, verificationComplete]);

	useEffect(() => {
		if (fileSelected || protecting || hasProtectedArtifact || artifactSelected || verificationComplete) setActive(true);
	}, [artifactSelected, fileSelected, hasProtectedArtifact, protecting, verificationComplete]);

	if (!active) {
		return (
			<section className="pc-demo" aria-label="Guided beta experience">
			<div>
				<p className="pc-demo__eyebrow">GUIDED BETA EXPERIENCE</p>
				<h2>Experience the protection story.</h2>
				<p>A guided path using your real artwork, local verification reference, and live services.</p>
			</div>
			<button type="button" className="pc-btn pc-btn--secondary" onClick={() => { setActive(true); onStart(); }}>
				START GUIDED EXPERIENCE
			</button>
		</section>
		);
	}

	return (
		<section className="pc-demo pc-demo--active" aria-label="Guided beta experience progress">
			<div className="pc-demo__heading">
				<p className="pc-demo__eyebrow">ARTSHIELD BETA · REAL WORKSPACE</p>
				<p>{current === 7 ? "Verification recorded from the selected artifact." : "Progress updates only when the workspace receives real input or service results."}</p>
			</div>
			<div className="pc-demo__steps" role="list">
				{BETA_STEPS.map((step, index) => {
					const status = index < current ? "complete" : index === current ? "active" : "idle";
					return <span key={step} className={`pc-demo__step pc-demo__step--${status}`} role="listitem">{String(index + 1).padStart(2, "0")} {step}</span>;
				})}
			</div>
			<button type="button" className="pc-demo__exit" onClick={() => setActive(false)}>HIDE GUIDE</button>
		</section>
	);
}
