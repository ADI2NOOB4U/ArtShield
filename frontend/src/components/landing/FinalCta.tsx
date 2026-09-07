import ButtonLink from "../ui/ButtonLink";
import Reveal from "./Reveal";
import { ROUTES } from "../../utils/constants";

export default function FinalCta() {
	return (
		<section id="cta" className="relative overflow-hidden py-32 sm:py-40 lg:py-48">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute left-1/2 top-1/2 h-[60vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(127,220,255,0.08),transparent_70%)] blur-3xl" />
				<div className="absolute inset-x-0 top-0 h-px bg-hairline-x" />
			</div>
			<div className="site-container text-center">
				<Reveal>
					<p className="label-tech">ArtShield</p>
				</Reveal>
				<Reveal delay={100}>
					<h2 className="mt-8 font-display text-[clamp(2.5rem,8vw,6.5rem)] font-medium leading-[0.95] tracking-tightest text-silver-50">
						PROTECT. PROVE.
						<br />
						<span className="text-silver-400">CONTROL.</span>
					</h2>
				</Reveal>
				<Reveal delay={200}>
					<p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-silver-300 sm:text-lg">Protect your artwork. Upload a source image, receive a protected artifact, and keep the evidence to prove it is yours.</p>
				</Reveal>
				<Reveal delay={300}>
					<div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<ButtonLink to={ROUTES.protect}>Protect your art</ButtonLink>
						<ButtonLink to={ROUTES.protect} variant="ghost">
							Verify artwork
						</ButtonLink>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
