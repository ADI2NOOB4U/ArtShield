import ButtonLink from "../ui/ButtonLink";
import HeroArtwork from "./HeroArtwork";
import Reveal from "./Reveal";
import { CAPABILITIES, ROUTES } from "../../utils/constants";

export default function Hero() {
	const handleScrollToProblem = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		const problemEl = document.getElementById("problem");
		if (problemEl) {
			problemEl.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<section id="hero" data-cinematic-hero className="relative isolate pb-24 pt-32 sm:pt-40 lg:pb-32 lg:pt-48">
		<section id="hero" data-cinematic-hero className="relative isolate min-h-[92vh] flex flex-col justify-center pb-20 pt-32 sm:pt-40 lg:pb-28 lg:pt-44">
			{/* Precision technical background grid & spotlight */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
				<div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_65%)]" />
				<div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
			</div>

			{/* Preserved 240-frame scroll-scrubbed canvas background */}
			<HeroArtwork />

			<div className="site-container relative z-10">
				<div className="max-w-2xl">
			<div className="site-container relative z-10 w-full">
				<div className="max-w-3xl">
					{/* Brand Badge */}
					<Reveal>
						<p className="label-tech">Digital art protection infrastructure</p>
						<div className="inline-flex items-center gap-2.5 rounded-full border border-ice-400/25 bg-ice-400/10 px-4 py-1.5 backdrop-blur-md">
							<span className="h-2 w-2 rounded-full bg-ice-400 shadow-[0_0_10px_#38bdf8]" />
							<span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ice-300">
								ARTSHIELD CIPHER ARCHITECTURE
							</span>
						</div>
					</Reveal>

					{/* Main Headline */}
					<Reveal delay={120}>
						<h1 className="mt-8 font-display text-[clamp(2.9rem,8.5vw,7.25rem)] font-medium leading-[0.92] tracking-tightest text-silver-50">
							YOUR ART.
						<h1 className="mt-8 font-display text-[clamp(2.8rem,7.5vw,6.5rem)] font-bold leading-[0.95] tracking-tightest text-white">
							Protect the art.
							<br />
							YOUR IDENTITY.
							<br />
							<span className="text-silver-400">PROTECTED.</span>
							<span className="bg-gradient-to-r from-silver-100 via-silver-300 to-ice-300 bg-clip-text text-transparent">
								Prove the original.
							</span>
						</h1>
					</Reveal>

					{/* Supporting Statement */}
					<Reveal delay={240}>
						<p className="mt-10 max-w-md text-base leading-relaxed text-silver-300 sm:text-lg">
							Protect digital artwork with cryptographic identity, embedded watermarking, integrity verification, and blockchain-backed provenance.
						<p className="mt-8 max-w-xl text-base leading-relaxed text-silver-300 sm:text-lg lg:text-xl font-normal text-shadow-sm">
							Empowering creators, galleries, and collectors with dual-layer latent watermarking,
							deterministic frequency hardening, and mathematical SHA-256 blockchain provenance.
						</p>
					</Reveal>

					{/* CTAs */}
					<Reveal delay={360}>
						<div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
							<ButtonLink to={ROUTES.protect}>Protect your art</ButtonLink>
							<ButtonLink to={ROUTES.protect} variant="ghost">
								Verify artwork
						<div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
							<ButtonLink to={ROUTES.protect} size="md">
								Protect your artwork
							</ButtonLink>
							<a
								href="#problem"
								onClick={handleScrollToProblem}
								className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-7 py-4 font-mono text-[12px] uppercase tracking-techno text-silver-100 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/[0.08]"
							>
								<span>Explore how it works</span>
								<svg
									className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
									viewBox="0 0 16 16"
									fill="none"
								>
									<path d="M8 3V13M8 13L3.5 8.5M8 13L12.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</a>
						</div>
					</Reveal>
				</div>

				<Reveal delay={600} className="relative mt-24 hidden md:block lg:mt-32">
				<div className="hairline" />
				<ul className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-6">
					{CAPABILITIES.map((item) => (
						<li key={item} className="label-tech">
							{item}
						</li>
					))}
				</ul>
			</Reveal>
				{/* Capabilities Bottom Bar */}
				<Reveal delay={500} className="relative mt-20 hidden md:block lg:mt-28">
					<div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
					<div className="flex flex-wrap items-center justify-between gap-6 pt-6">
						<span className="font-mono text-[11px] uppercase tracking-widest text-silver-500">
							SYSTEM CAPABILITIES
						</span>
						<ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
							{CAPABILITIES.map((item) => (
								<li key={item} className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-silver-300">
									<span className="h-1 w-1 rounded-full bg-ice-400/80" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
				</Reveal>
			</div>
		</section>
	);
}