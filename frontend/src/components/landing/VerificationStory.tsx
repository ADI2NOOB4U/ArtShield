import { useEffect, useRef, useState } from "react";
import ArtworkCanvas from "../artwork/ArtworkCanvas";
import ButtonLink from "../ui/ButtonLink";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";
import { useInView } from "../../hooks/useInView";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { ROUTES } from "../../utils/constants";

const HASH = "Example value";

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
		const timer = window.setTimeout(() => setVerified(true), 1400);
		return () => window.clearTimeout(timer);
	}, [inView, reducedMotion]);

	return (
		<section id="verification" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36 lg:py-44">
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline-x" />
			<div className="site-container grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
				<div>
					<Reveal>
						<SectionHeading
							eyebrow="DETERMINISTIC ARTIFACT VERIFICATION"
							title={<>Check It Against<br className="hidden sm:block" /> The Registered Artifact.</>}
							body="ArtShield compares a candidate file with its saved reference using its fingerprint and watermark checks. A mismatch means the file differs from the registered artifact."
						/>
					</Reveal>
					<Reveal delay={120}>
						<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-300">MATCHES REGISTERED ARTIFACT</span></div>
								<p className="mt-2 text-xs leading-relaxed text-silver-300">The candidate matches its saved SHA-256 fingerprint and watermark reference.</p>
							</div>
							<div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 backdrop-blur-md">
								<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-300">MODIFICATION DETECTED</span></div>
								<p className="mt-2 text-xs leading-relaxed text-silver-300">The candidate differs from the registered artifact. The check does not determine who changed it or why.</p>
							</div>
						</div>
					</Reveal>
					<Reveal delay={200}><div className="mt-10 flex items-center gap-4"><ButtonLink to={ROUTES.protect} variant="ghost">Open Verification Suite</ButtonLink></div></Reveal>
				</div>
				<Reveal delay={100}>
					<div ref={ref} className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]" aria-hidden="true">
						<div className="relative aspect-[3/4]">
							<div className={`absolute -inset-6 rounded-[28px] border transition-all duration-1000 ease-premium ${verified ? "border-emerald-400/40 shadow-[0_0_50px_rgba(52,211,153,0.25)]" : "border-ice-400/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]"}`} />
							<ArtworkCanvas id="verify" className={`relative h-full w-full rounded-2xl border border-white/15 shadow-2xl transition-all duration-1000 ease-premium ${verified ? "" : "saturate-75"}`} />
							{!verified && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ice-300 to-transparent shadow-[0_0_20px_#38bdf8] motion-safe:animate-scan" />}
							<div className={`absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border px-5 py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-700 ease-premium ${verified ? "border-emerald-400/40 bg-ink-950/90 text-emerald-300" : "border-ice-400/30 bg-ink-950/90 text-ice-300"}`}><span className={`h-2 w-2 rounded-full ${verified ? "bg-emerald-400" : "bg-ice-400 motion-safe:animate-pulse-soft"}`} /><span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-current">{verified ? "REGISTERED ARTIFACT MATCH" : "READY FOR VERIFICATION"}</span></div>
						</div>
						<div className="mt-14 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[10px] backdrop-blur-md">
							<p className="mb-3 text-[9px] tracking-wider text-amber-300">ILLUSTRATION / EXAMPLE RECORD</p>
							<div className="flex items-center justify-between border-b border-white/10 pb-2.5"><span className="text-silver-400 uppercase tracking-wider">EXAMPLE REGISTERED SHA-256</span><code className="text-silver-300">{HASH}</code></div>
							<div className="flex items-center justify-between pt-2.5"><span className="text-silver-400 uppercase tracking-wider">EXAMPLE CANDIDATE SHA-256</span><code className={`transition-colors duration-700 ${verified ? "font-bold text-emerald-400" : "text-silver-300"}`}>{HASH}</code></div>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
