import { Link } from "react-router-dom";
import { BRAND, NAV_LINKS, ROUTES } from "../../utils/constants";

export default function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="border-t border-white/[0.06]">
			<div className="site-container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
				<div className="flex flex-col gap-5">
					<Link to={ROUTES.home} className="font-display text-sm font-semibold tracking-[0.28em] text-silver-50">
						{BRAND.name}
					</Link>
					<p className="label-tech">{BRAND.tagline}</p>
					<p className="max-w-sm text-sm leading-relaxed text-silver-400">Cryptographic identity, embedded watermarking, integrity verification and blockchain-backed provenance for digital artwork.</p>
				</div>
				<div>
					<p className="label-tech mb-6">Product</p>
					<ul className="space-y-3 text-sm text-silver-300">
						{NAV_LINKS.filter((link) => !link.placeholder).map((link) => (
							<li key={link.label}>
								<a href={link.href} className="transition-colors duration-300 hover:text-silver-50">
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="label-tech mb-6">Access</p>
					<ul className="space-y-3 text-sm text-silver-300">
						<li>
							<Link to={ROUTES.protect} className="transition-colors duration-300 hover:text-silver-50">
								Protect artwork
							</Link>
						</li>
						<li>
							<Link to={ROUTES.protect} className="transition-colors duration-300 hover:text-silver-50">
								Verify artwork
							</Link>
						</li>
						<li className="text-silver-500">Login · later release</li>
						<li className="text-silver-500">Pricing · later release</li>
					</ul>
				</div>
			</div>
			<div className="site-container flex flex-col gap-3 border-t border-white/[0.06] py-6 sm:flex-row sm:items-center sm:justify-between">
				<p className="label-tech">© {year} ArtShield</p>
				<p className="label-tech">Prototype release · local development chain</p>
			</div>
		</footer>
	);
}
