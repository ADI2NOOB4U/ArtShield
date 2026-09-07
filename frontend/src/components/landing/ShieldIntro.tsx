import { Fragment } from "react";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const PIPELINE = ["Original", "Identity", "Watermark", "AI shield", "Provenance", "Verified"];
const PIPELINE = [
	{ id: "01", name: "Original Asset", tech: "Raw Ingestion" },
	{ id: "02", name: "Identity Hash", tech: "SHA-256 Digest" },
	{ id: "03", name: "Watermark", tech: "Latent LSB Key" },
	{ id: "04", name: "AI Shield", tech: "Frequency Hardening" },
	{ id: "05", name: "Provenance", tech: "On-Chain Ledger" },
	{ id: "06", name: "Shielded Artifact", tech: "Cryptographic Seal" },
];

const OUTPUTS = [
	"A protected artifact, returned as a PNG you can download.",
	"A SHA-256 fingerprint, protected-artifact hash and watermark record.",
	"A verification reference kept in your browser for later integrity checks.",
	{
		title: "Protected Digital Artifact",
		tag: "OUTPUT 01",
		desc: "A hardened, high-resolution PNG file containing imperceptible latent watermarks and adversarial AI resistance.",
	},
	{
		title: "Cryptographic Evidence Seal",
		tag: "OUTPUT 02",
		desc: "An immutable SHA-256 hash digest, source fingerprint, and embedded watermark reference binding authorship.",
	},
	{
		title: "Client-Side Audit Reference",
		tag: "OUTPUT 03",
		desc: "A cryptographic reference stored in your local browser registry for instant one-click tamper detection.",
	},
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
						eyebrow="ZERO-LOSS PROTECTION PIPELINE"
						title={
							<>
								One artwork. One identity.
								<br className="hidden sm:block" /> A pipeline of protection.
								One Masterwork. One Identity.
								<br className="hidden sm:block" /> A Complete Defense Sequence.
							</>
						}
						body="ArtShield runs the source image through a protection pipeline and returns a protected artifact together with the evidence needed to verify it later."
						body="ArtShield transforms raw creative assets into hardened digital artifacts through non-destructive frequency modulation and cryptographic registration."
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
				{/* Interconnected Horizontal Pipeline Track */}
				<Reveal delay={150} className="mt-20 lg:mt-24">
					<div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
						<ol className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
							{PIPELINE.map((step, index) => {
								const isLast = index === PIPELINE.length - 1;
								const isFirst = index === 0;
								return (
									<Fragment key={step.name}>
										<li className="flex items-center gap-4 lg:flex-col lg:items-center lg:text-center lg:gap-3 flex-1">
											<span
												className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
													isLast
														? "border-ice-400 bg-ice-400/20 text-ice-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
														: isFirst
														? "border-white/20 bg-white/5 text-silver-100"
														: "border-white/10 bg-white/[0.02] text-silver-400"
												}`}
											>
												<span className="font-mono text-xs font-bold">{step.id}</span>
												{isLast && (
													<span className="absolute inset-0 rounded-xl border border-ice-400/50 animate-pulse" />
												)}
											</span>
											<div className="flex flex-col lg:items-center">
												<span className={`font-display text-sm font-semibold ${isLast ? "text-ice-300" : "text-silver-100"}`}>
													{step.name}
												</span>
												<span className="font-mono text-[10px] text-silver-500">{step.tech}</span>
											</div>
										</li>
										{!isLast && (
											<li
												aria-hidden="true"
												className="ml-5 h-6 w-px bg-white/15 lg:ml-0 lg:h-px lg:w-8 lg:bg-gradient-to-r lg:from-white/20 lg:to-white/5"
											/>
										)}
									</Fragment>
								);
							})}
						</ol>
					</div>
				</Reveal>

				<div className="mx-auto mt-20 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-0 lg:mt-28">
				{/* 3 Output Pillars */}
				<div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3 lg:mt-20">
					{OUTPUTS.map((output, index) => (
						<Reveal key={output} delay={index * 100}>
							<div className="h-full border-l border-white/[0.08] px-6 py-1">
								<p className="label-tech">Output {String(index + 1).padStart(2, "0")}</p>
								<p className="mt-4 text-sm leading-relaxed text-silver-300">{output}</p>
						<Reveal key={output.title} delay={index * 100}>
							<div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:border-ice-400/30 hover:bg-white/[0.04]">
								<div>
									<span className="font-mono text-[10px] font-semibold tracking-wider text-ice-400">
										{output.tag}
									</span>
									<h3 className="mt-3 font-display text-base font-semibold text-silver-50">
										{output.title}
									</h3>
									<p className="mt-2 text-xs leading-relaxed text-silver-400">
										{output.desc}
									</p>
								</div>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
