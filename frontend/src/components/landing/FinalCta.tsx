import { Link } from "react-router-dom";
import ButtonLink from "../ui/ButtonLink";
import Reveal from "./Reveal";
import { ROUTES } from "../../utils/constants";

export default function FinalCta() {
	return (
		<section id="cta" className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute left-1/2 top-1/2 h-[60vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(127,220,255,0.08),transparent_70%)] blur-3xl" />
				<div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-gradient from-ice-400/10 via-blue-600/5 to-transparent blur-3xl" />
				<div className="absolute inset-x-0 top-0 h-px bg-hairline-x" />
			</div>
			<div className="site-container relative z-10 text-center">
				<Reveal><p className="label-tech">ArtShield</p><div className="inline-flex items-center gap-2 rounded-full border border-ice-400/20 bg-ice-400/10 px-4 py-1.5 backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-ice-400 shadow-[0_0_8px_#38bdf8]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ice-300">DEPLOY ART PROTECTION</span></div></Reveal>
				<Reveal delay={120}><h2 className="mt-8 font-display text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tightest text-white">Protect the art.<br /><span className="text-silver-400">CONTROL.</span>{" "}<span className="bg-gradient-to-r from-silver-100 via-silver-300 to-ice-300 bg-clip-text text-transparent">Prove the original.</span></h2></Reveal>
				<Reveal delay={240}><p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-silver-300 sm:text-base lg:text-lg">Generate cryptographic certificates, latent watermarks, and verification proofs for your digital masterworks.</p></Reveal>
				<Reveal delay={360}><div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"><ButtonLink to={ROUTES.protect} size="md">Protect your artwork</ButtonLink><Link to={ROUTES.pricing} className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/[0.04] px-7 py-4 font-mono text-[12px] uppercase tracking-techno text-silver-100 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/[0.08]"><span>Explore Licensing & Tiers</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></Link></div></Reveal>
			</div>
		</section>
	);
}
