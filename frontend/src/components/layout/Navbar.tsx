import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ButtonLink from "../ui/ButtonLink";
import { BRAND, NAV_LINKS, ROUTES } from "../../utils/constants";

const PLACEHOLDER_TITLE = "Available in a later release";

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [open]);

	const solid = scrolled || open;

	return (
		<header className="fixed inset-x-0 top-0 z-50">
			<div className={`transition-all duration-500 ease-premium ${solid ? "border-b border-white/[0.06] bg-ink-950/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
				<nav className="site-container flex h-16 items-center justify-between sm:h-20" aria-label="Primary">
					<Link to={ROUTES.home} className="font-display text-sm font-semibold tracking-[0.28em] text-silver-50" onClick={() => setOpen(false)}>
						{BRAND.name}
					</Link>

					<ul className="hidden items-center gap-9 lg:flex">
						{NAV_LINKS.map((link) => (
							<li key={link.label}>
								{link.placeholder ? (
									<span className="cursor-default font-mono text-[11px] uppercase tracking-techno text-silver-500" aria-disabled="true" title={PLACEHOLDER_TITLE}>
										{link.label}
									</span>
								) : (
									<a href={link.href} className="font-mono text-[11px] uppercase tracking-techno text-silver-300 transition-colors duration-300 hover:text-silver-50">
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>

					<div className="hidden items-center gap-7 lg:flex">
						<span className="cursor-default font-mono text-[11px] uppercase tracking-techno text-silver-500" aria-disabled="true" title={PLACEHOLDER_TITLE}>
							Login
						</span>
						<ButtonLink to={ROUTES.protect} size="sm">
							Protect artwork
						</ButtonLink>
					</div>

					<button
						type="button"
						className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-silver-100 lg:hidden"
						aria-expanded={open}
						aria-controls="mobile-menu"
						aria-label={open ? "Close menu" : "Open menu"}
						onClick={() => setOpen((value) => !value)}
					>
						<span className="relative block h-3 w-4">
							<span className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
							<span className={`absolute left-0 top-[6px] h-px w-4 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
							<span className={`absolute left-0 top-3 h-px w-4 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
						</span>
					</button>
				</nav>
			</div>

			<div
				id="mobile-menu"
				aria-hidden={!open}
				className={`fixed inset-x-0 bottom-0 top-16 bg-ink-950/95 backdrop-blur-2xl transition-opacity duration-300 sm:top-20 lg:hidden ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
			>
				<div className="site-container flex h-full flex-col justify-between py-10">
					<ul>
						{NAV_LINKS.map((link, index) => (
							<li
								key={link.label}
								className={`border-b border-white/[0.06] transition-all duration-500 ease-premium ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
								style={{ transitionDelay: `${open ? 80 + index * 50 : 0}ms` }}
							>
								{link.placeholder ? (
									<span className="block py-4 font-display text-2xl text-silver-500">{link.label}</span>
								) : (
									<a href={link.href} className="block py-4 font-display text-2xl text-silver-50" onClick={() => setOpen(false)}>
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>
					<div className="flex flex-col gap-4">
						<span className="label-tech">Login · available in a later release</span>
						<ButtonLink to={ROUTES.protect} className="w-full">
							Protect artwork
						</ButtonLink>
					</div>
				</div>
			</div>
		</header>
	);
}
