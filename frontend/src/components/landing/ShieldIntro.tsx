import { Fragment } from "react";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const PIPELINE = ["Original", "Identity", "Watermark", "AI shield", "Provenance", "Verified"];

const OUTPUTS = [
	"A protected artifact, returned as a PNG you can download.",
	"A SHA-256 fingerprint, protected-artifact hash and watermark record.",
	"A verification reference kept in your browser for later integrity checks.",
];

export default function ShieldIntro() {
	return (
		<section id="protection" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36 lg:py-44">
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline-x" />
			<div className="site-container">
				<Reveal>
					<SectionHeading
						align="center"
						eyebrow="The Art Shield"
						title={
							<>
								One artwork. One identity.
								<br className="hidden sm:block" /> A pipeline of protection.
							</>
						}
						body="ArtShield runs the source image through a protection pipeline and returns a protected artifact together with the evidence needed to verify it later."
					/>
				</Reveal>

				<Reveal delay={150} className="mt-20 lg:mt-28">
					<ol className="flex flex-col items-start lg:flex-row lg:items-center">
						{PIPELINE.map((step, index) => {
							const last = index === PIPELINE.length - 1;
							const first = index === 0;
							return (
								<Fragment key={step}>
									<li className="flex items-center gap-4 lg:flex-col lg:gap-5">
										<span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${last ? "border-ice-400/60 bg-ice-400/10" : first ? "border-white/20" : "border-white/[0.12] bg-white/[0.03]"}`}>
											<span className={`h-1.5 w-1.5 rounded-full ${last ? "bg-ice-300" : "bg-silver-200"}`} />
											{last && <span className="absolute inset-0 rounded-full border border-ice-400/40 motion-safe:animate-pulse-soft" />}
										</span>
										<span className={`label-tech ${last ? "text-ice-300" : "text-silver-200"}`}>{step}</span>
									</li>
									{!last && <li aria-hidden="true" className="ml-5 h-10 w-px bg-white/10 lg:mx-3 lg:h-px lg:w-auto lg:flex-1 lg:bg-hairline-x" />}
								</Fragment>
							);
						})}
					</ol>
				</Reveal>

				<div className="mx-auto mt-20 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-0 lg:mt-28">
					{OUTPUTS.map((output, index) => (
						<Reveal key={output} delay={index * 100}>
							<div className="h-full border-l border-white/[0.08] px-6 py-1">
								<p className="label-tech">Output {String(index + 1).padStart(2, "0")}</p>
								<p className="mt-4 text-sm leading-relaxed text-silver-300">{output}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
