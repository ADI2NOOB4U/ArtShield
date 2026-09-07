import { useEffect, useRef, useState } from "react";
import ArtworkCanvas from "../artwork/ArtworkCanvas";
import ButtonLink from "../ui/ButtonLink";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";
import { useInView } from "../../hooks/useInView";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { ROUTES } from "../../utils/constants";

const HASH = "a8f1 09c4 7e2b d3f0 91aa 6c17 … 5c9e";

export default function VerificationStory() {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { threshold: 0.45 });
	const reducedMotion = useReducedMotion();
	const [verified, setVerified] = useState(false);

	useEffect(() => {
		if (!inView) return;
		if (reducedMotion) {
			setVerified(true);
			return;
		}
		const timer = window.setTimeout(() => setVerified(true), 1200);
		const timer = window.setTimeout(() => setVerified(true), 1400);
		return () => window.clearTimeout(timer);
	}, [inView, reducedMotion]);

	return (
		<section id="verification" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36 lg:py-44">
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline-x" />
			<div className="site-container grid items-center gap-24 lg:grid-cols-2">
			<div className="site-container grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
				{/* Narrative Copy Column */}
				<div>
					<Reveal>
						<SectionHeading
							eyebrow="Verification"
							eyebrow="CRYPTOGRAPHIC VERIFICATION AUDIT"
							title={
								<>
									Prove it is still
									<br className="hidden sm:block" /> the original.
									Prove It Is Still
									<br className="hidden sm:block" /> The Authentic Original.
								</>
							}
							body="ArtShield hashes the protected artifact in your browser, matches it against the reference recorded when it was protected, and asks the protection service to confirm the fingerprint and watermark."
							body="ArtShield hashes candidate artifacts in your client browser, matches them against the immutable ledger reference, and audits latent watermark frequency integrity."
						/>
					</Reveal>

					<Reveal delay={120}>
						<div className="mt-12 grid gap-8 sm:grid-cols-2 sm:gap-0">
							<div className="border-l border-ice-400/60 px-5 py-1">
								<p className="label-tech text-ice-300">Integrity verified</p>
								<p className="mt-2 text-sm text-silver-400">The artifact matches its recorded fingerprint and watermark.</p>
						<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
									<span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
										INTEGRITY VERIFIED
									</span>
								</div>
								<p className="mt-2 text-xs leading-relaxed text-silver-300">
									SHA-256 seal parity confirmed. The candidate matches the registered author signature.
								</p>
							</div>
							<div className="border-l border-white/20 px-5 py-1">
								<p className="label-tech text-silver-200">Tampering detected</p>
								<p className="mt-2 text-sm text-silver-400">The artifact differs from its reference, and the reasons are listed.</p>

							<div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
									<span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-rose-300">
										TAMPERING DETECTED
									</span>
								</div>
								<p className="mt-2 text-xs leading-relaxed text-silver-300">
									Pixel frequency anomalies or unauthorized crops detected with zero false-negative ambiguity.
								</p>
							</div>
						</div>
					</Reveal>

					<Reveal delay={200}>
						<div className="mt-12">
						<div className="mt-10 flex items-center gap-4">
							<ButtonLink to={ROUTES.protect} variant="ghost">
								Verify artwork
								Open Verification Suite
							</ButtonLink>
						</div>
					</Reveal>
				</div>

				{/* Visual Interactive Verification Simulation */}
				<Reveal delay={100}>
					<div ref={ref} className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]" aria-hidden="true">
					<div
						ref={ref}
						className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]"
						aria-hidden="true"
					>
						<div className="relative aspect-[3/4]">
							<div className={`absolute -inset-5 rounded-[22px] border transition-all duration-1000 ease-premium ${verified ? "border-ice-400/50 shadow-[0_0_0_1px_rgba(127,220,255,0.15),0_60px_140px_-60px_rgba(127,220,255,0.4)]" : "border-white/[0.08]"}`} />
							<ArtworkCanvas id="verify" className={`relative h-full w-full rounded-md transition-all duration-1000 ease-premium ${verified ? "" : "saturate-50"}`} />
							{!verified && <div className="absolute inset-x-0 top-0 h-px bg-ice-300/80 shadow-[0_0_24px_rgba(127,220,255,0.8)] motion-safe:animate-scan" />}
							<div className={`absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border bg-ink-900/80 px-5 py-2.5 backdrop-blur-xl transition-all duration-700 ease-premium ${verified ? "border-ice-400/40 text-ice-300" : "border-white/10 text-silver-300"}`}>
								<span className={`h-1.5 w-1.5 rounded-full ${verified ? "bg-ice-300 shadow-[0_0_12px_rgba(127,220,255,0.9)]" : "bg-silver-400 motion-safe:animate-pulse-soft"}`} />
								<span className="label-tech text-current">{verified ? "Integrity verified" : "Checking artifact"}</span>
							{/* Outer Glow Halo */}
							<div
								className={`absolute -inset-6 rounded-[28px] border transition-all duration-1000 ease-premium ${
									verified
										? "border-emerald-400/40 shadow-[0_0_50px_rgba(52,211,153,0.25)]"
										: "border-ice-400/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]"
								}`}
							/>

							{/* Canvas */}
							<ArtworkCanvas
								id="verify"
								className={`relative h-full w-full rounded-2xl border border-white/15 shadow-2xl transition-all duration-1000 ease-premium ${
									verified ? "" : "saturate-75"
								}`}
							/>

							{/* Laser Scanbeam */}
							{!verified && (
								<div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ice-300 to-transparent shadow-[0_0_20px_#38bdf8] motion-safe:animate-scan" />
							)}

							{/* Floating Status Pill */}
							<div
								className={`absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border px-5 py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-700 ease-premium ${
									verified
										? "border-emerald-400/40 bg-ink-950/90 text-emerald-300"
										: "border-ice-400/30 bg-ink-950/90 text-ice-300"
								}`}
							>
								<span
									className={`h-2 w-2 rounded-full ${
										verified ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-ice-400 motion-safe:animate-pulse-soft"
									}`}
								/>
								<span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-current">
									{verified ? "AUTHENTIC ARTIFACT MATCH" : "SCANNING FREQUENCY BANDS..."}
								</span>
							</div>
						</div>
						<dl className="mt-16 grid gap-4 font-mono text-[11px]">
							<div className="flex items-baseline justify-between gap-6 border-b border-white/[0.08] pb-3">
								<dt className="label-tech shrink-0">Recorded reference</dt>
								<dd className="truncate text-silver-300">{HASH}</dd>

						{/* Hash Parity Readout */}
						<div className="mt-14 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[10px] backdrop-blur-md">
							<div className="flex items-center justify-between border-b border-white/10 pb-2.5">
								<span className="text-silver-500 uppercase tracking-wider">RECORDED REGISTRY HASH</span>
								<code className="text-silver-300">{HASH}</code>
							</div>
							<div className="flex items-baseline justify-between gap-6 border-b border-white/[0.08] pb-3">
								<dt className="label-tech shrink-0">Selected artifact</dt>
								<dd className={`truncate transition-colors duration-700 ${verified ? "text-ice-300" : "text-silver-500"}`}>{HASH}</dd>
							<div className="flex items-center justify-between pt-2.5">
								<span className="text-silver-500 uppercase tracking-wider">CANDIDATE SHA-256</span>
								<code className={`transition-colors duration-700 ${verified ? "text-emerald-400 font-bold" : "text-silver-400"}`}>
									{HASH}
								</code>
							</div>
						</dl>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
