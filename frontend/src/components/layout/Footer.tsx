import { Link } from "react-router-dom";
import { BRAND, NAV_LINKS, ROUTES } from "../../utils/constants";

export default function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="border-t border-white/[0.06]">
		<footer className="border-t border-white/[0.08] bg-ink-950/60 backdrop-blur-xl relative z-20">
			<div className="site-container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
				<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-4">
					<Link to={ROUTES.home} className="font-display text-sm font-semibold tracking-[0.28em] text-silver-50">
						{BRAND.name}
					</Link>
					<p className="label-tech">{BRAND.tagline}</p>
					<p className="max-w-sm text-sm leading-relaxed text-silver-400">Cryptographic identity, embedded watermarking, integrity verification and blockchain-backed provenance for digital artwork.</p>
					<p className="label-tech text-ice-400">{BRAND.tagline}</p>
					<p className="max-w-sm text-xs leading-relaxed text-silver-400">
						Cryptographic identity, steganographic watermarking, integrity verification, and blockchain-backed provenance for digital artwork and intellectual property.
					</p>
				</div>
				<div>
					<p className="label-tech mb-6">Product</p>
					<ul className="space-y-3 text-sm text-silver-300">
						{NAV_LINKS.filter((link) => !link.placeholder).map((link) => (
					<p className="label-tech mb-5 text-silver-200">Navigation</p>
					<ul className="space-y-3 text-xs text-silver-400">
						{NAV_LINKS.map((link) => (
							<li key={link.label}>
								<a href={link.href} className="transition-colors duration-300 hover:text-silver-50">
									{link.label}
								</a>
								{link.isRoute ? (
									<Link to={link.href} className="transition-colors duration-200 hover:text-ice-300">
										{link.label}
									</Link>
								) : (
									<a href={link.href} className="transition-colors duration-200 hover:text-ice-300">
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="label-tech mb-6">Access</p>
					<ul className="space-y-3 text-sm text-silver-300">
					<p className="label-tech mb-5 text-silver-200">Protection Infrastructure</p>
					<ul className="space-y-3 text-xs text-silver-400">
						<li>
							<Link to={ROUTES.protect} className="transition-colors duration-300 hover:text-silver-50">
								Protect artwork
							<Link to={ROUTES.protect} className="transition-colors duration-200 hover:text-ice-300">
								Protect Artwork Suite
							</Link>
						</li>
						<li>
							<Link to={ROUTES.protect} className="transition-colors duration-300 hover:text-silver-50">
								Verify artwork
							<Link to={ROUTES.protect} className="transition-colors duration-200 hover:text-ice-300">
								Verify Artifact Integrity
							</Link>
						</li>
						<li className="text-silver-500">Login · later release</li>
						<li className="text-silver-500">Pricing · later release</li>
						<li>
							<Link to={ROUTES.pricing} className="transition-colors duration-200 hover:text-ice-300">
								Institutional & Studio Licensing
							</Link>
						</li>
					</ul>
				</div>
			</div>
			<div className="site-container flex flex-col gap-3 border-t border-white/[0.06] py-6 sm:flex-row sm:items-center sm:justify-between">
				<p className="label-tech">© {year} ArtShield</p>
				<p className="label-tech">Prototype release · local development chain</p>
				<p className="label-tech text-silver-500">© {year} ArtShield System Architecture</p>
				<p className="label-tech text-silver-500">Exhibition Prototype Release · SHA-256 Ledger Verified</p>
			</div>
		</footer>
	);
}
