import ButtonLink from "../ui/ButtonLink";
import HeroArtwork from "./HeroArtwork";
import Reveal from "./Reveal";
import { CAPABILITIES, ROUTES } from "../../utils/constants";

export default function Hero() {
	return (
		<section id="hero" data-cinematic-hero className="relative isolate pb-24 pt-32 sm:pt-40 lg:pb-32 lg:pt-48">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
				<div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]" />
			</div>

			<HeroArtwork />

			<div className="site-container relative z-10">
				<div className="max-w-2xl">
					<Reveal>
						<p className="label-tech">Digital art protection infrastructure</p>
					</Reveal>
					<Reveal delay={120}>
						<h1 className="mt-8 font-display text-[clamp(2.9rem,8.5vw,7.25rem)] font-medium leading-[0.92] tracking-tightest text-silver-50">
							YOUR ART.
							<br />
							YOUR IDENTITY.
							<br />
							<span className="text-silver-400">PROTECTED.</span>
						</h1>
					</Reveal>
					<Reveal delay={240}>
						<p className="mt-10 max-w-md text-base leading-relaxed text-silver-300 sm:text-lg">
							Protect digital artwork with cryptographic identity, embedded watermarking, integrity verification, and blockchain-backed provenance.
						</p>
					</Reveal>
					<Reveal delay={360}>
						<div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
							<ButtonLink to={ROUTES.protect}>Protect your art</ButtonLink>
							<ButtonLink to={ROUTES.protect} variant="ghost">
								Verify artwork
							</ButtonLink>
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
			</div>
		</section>
	);
}