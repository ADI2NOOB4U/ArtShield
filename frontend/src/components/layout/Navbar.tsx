import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import ButtonLink from "../ui/ButtonLink";
import LoginModal from "../auth/LoginModal";
import { useAuth } from "../../hooks/useAuth";
import { BRAND, NAV_LINKS, ROUTES } from "../../utils/constants";

const PLACEHOLDER_TITLE = "Available in a later release";

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const [loginModalOpen, setLoginModalOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	const { user, isAuthenticated, logout } = useAuth();
	const location = useLocation();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		const onClickOutside = (e: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
		};
		window.addEventListener("mousedown", onClickOutside);
		return () => window.removeEventListener("mousedown", onClickOutside);
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

	const handleNavClick = (href: string) => {
		setOpen(false);
		if (href.startsWith("/#") && location.pathname === "/") {
			const targetId = href.replace("/#", "");
			const element = document.getElementById(targetId);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	return (
		<header className="fixed inset-x-0 top-0 z-50">
			<div className={`transition-all duration-500 ease-premium ${solid ? "border-b border-white/[0.06] bg-ink-950/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
				<nav className="site-container flex h-16 items-center justify-between sm:h-20" aria-label="Primary">
					<Link to={ROUTES.home} className="font-display text-sm font-semibold tracking-[0.28em] text-silver-50" onClick={() => setOpen(false)}>
						{BRAND.name}
					</Link>
		<>
			<header className="fixed inset-x-0 top-0 z-50">
				<div
					className={`transition-all duration-500 ease-premium ${
						solid
							? "border-b border-white/[0.08] bg-ink-950/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
							: "border-b border-transparent bg-transparent"
					}`}
				>
					<nav className="site-container flex h-16 items-center justify-between sm:h-20" aria-label="Primary">
						{/* Brand Logo & Name */}
						<Link
							to={ROUTES.home}
							className="group flex items-center gap-3 font-display text-sm font-semibold tracking-[0.24em] text-silver-50"
							onClick={() => setOpen(false)}
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-ice-400/30 bg-ice-400/10 text-ice-400 transition-transform group-hover:scale-105">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M12 2L3 7V12C3 17.5228 6.94165 22.5027 12 23.9443C17.0583 22.5027 21 17.5228 21 12V7L12 2Z"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M9 12L11 14L15 10"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<span>{BRAND.name}</span>
						</Link>

					<ul className="hidden items-center gap-9 lg:flex">
						{NAV_LINKS.map((link) => (
							<li key={link.label}>
								{link.placeholder ? (
									<span className="cursor-default font-mono text-[11px] font-medium uppercase tracking-techno text-silver-300" aria-disabled="true" title={PLACEHOLDER_TITLE}>
										{link.label}
									</span>
								) : (
									<a href={link.href} className="font-mono text-[11px] font-medium uppercase tracking-techno text-silver-200 transition-colors duration-300 hover:text-silver-50">
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>
						{/* Desktop Navigation Links */}
						<ul className="hidden items-center gap-8 lg:flex">
							{NAV_LINKS.map((link) => (
								<li key={link.label}>
									{link.isRoute ? (
										<Link
											to={link.href}
											className={`font-mono text-[11px] font-medium uppercase tracking-techno transition-colors duration-300 ${
												location.pathname === link.href ? "text-ice-400" : "text-silver-300 hover:text-silver-50"
											}`}
										>
											{link.label}
										</Link>
									) : (
										<a
											href={link.href}
											onClick={() => handleNavClick(link.href)}
											className="font-mono text-[11px] font-medium uppercase tracking-techno text-silver-300 transition-colors duration-300 hover:text-silver-50"
										>
											{link.label}
										</a>
									)}
								</li>
							))}
						</ul>

					<div className="hidden items-center gap-7 lg:flex">
						<span className="cursor-default font-mono text-[11px] font-medium uppercase tracking-techno text-silver-300" aria-disabled="true" title={PLACEHOLDER_TITLE}>
							Login
						</span>
						<ButtonLink to={ROUTES.protect} size="sm">
							Protect artwork
						</ButtonLink>
					</div>
						{/* Right Actions: Auth & Protect CTA */}
						<div className="hidden items-center gap-6 lg:flex">
							{isAuthenticated && user ? (
								<div className="relative" ref={userMenuRef}>
									<button
										type="button"
										onClick={() => setUserMenuOpen((prev) => !prev)}
										className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 transition-all hover:border-ice-400/40 hover:bg-white/[0.08]"
									>
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-ice-400/20 font-mono text-[10px] font-bold text-ice-300">
											{user.name.charAt(0).toUpperCase()}
										</span>
										<span className="font-mono text-[11px] text-silver-200">{user.name}</span>
										<span className="rounded bg-ice-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ice-300">
											{user.role}
										</span>
									</button>

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
									{/* User Profile Dropdown */}
									{userMenuOpen && (
										<div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-2xl">
											<div className="border-b border-white/10 pb-3">
												<p className="font-display text-xs font-semibold text-silver-50">{user.name}</p>
												<p className="font-mono text-[10px] text-silver-400">{user.email}</p>
												<p className="mt-1 font-mono text-[9px] text-ice-400 uppercase tracking-wider">{user.roleTitle}</p>
												{user.walletAddress && (
													<p className="mt-1 font-mono text-[9px] text-silver-500 truncate">
														Wallet: {user.walletAddress}
													</p>
												)}
											</div>
											<div className="pt-2">
												<button
													type="button"
													onClick={() => {
														logout();
														setUserMenuOpen(false);
													}}
													className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-mono text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
												>
													<span>SIGN OUT</span>
													<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
														<path d="M6 3H3C2.44772 3 2 3.44772 2 4V12C2 12.5523 2.44772 13 3 13H6M10 5L13 8M13 8L10 11M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												</button>
											</div>
										</div>
									)}
								</div>
							) : (
								<button
									type="button"
									onClick={() => setLoginModalOpen(true)}
									className="font-mono text-[11px] font-medium uppercase tracking-techno text-silver-300 transition-colors duration-300 hover:text-silver-50"
								>
									Login
								</button>
							)}

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
							<ButtonLink to={ROUTES.protect} size="sm">
								Protect artwork
							</ButtonLink>
						</div>

						{/* Mobile Hamburger Button */}
						<button
							type="button"
							className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-silver-100 lg:hidden hover:border-white/25 transition-colors"
							aria-expanded={open}
							aria-controls="mobile-menu"
							aria-label={open ? "Close menu" : "Open menu"}
							onClick={() => setOpen((value) => !value)}
						>
							<span className="relative block h-3 w-4">
								<span
									className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform duration-300 ${
										open ? "translate-y-[6px] rotate-45" : ""
									}`}
								/>
								<span
									className={`absolute left-0 top-[6px] h-px w-4 bg-current transition-opacity duration-300 ${
										open ? "opacity-0" : ""
									}`}
								/>
								<span
									className={`absolute left-0 top-3 h-px w-4 bg-current transition-transform duration-300 ${
										open ? "-translate-y-[6px] -rotate-45" : ""
									}`}
								/>
							</span>
						</button>
					</nav>
				</div>

				{/* Mobile Drawer Menu */}
				<div
					id="mobile-menu"
					aria-hidden={!open}
					className={`fixed inset-x-0 bottom-0 top-16 bg-ink-950/98 backdrop-blur-2xl transition-opacity duration-300 sm:top-20 lg:hidden ${
						open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
					}`}
				>
					<div className="site-container flex h-full flex-col justify-between py-8">
						<ul>
							{NAV_LINKS.map((link, index) => (
								<li
									key={link.label}
									className={`border-b border-white/[0.08] transition-all duration-500 ease-premium ${
										open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
									}`}
									style={{ transitionDelay: `${open ? 60 + index * 40 : 0}ms` }}
								>
									{link.isRoute ? (
										<Link
											to={link.href}
											className="block py-4 font-display text-xl text-silver-100 hover:text-ice-400"
											onClick={() => setOpen(false)}
										>
											{link.label}
										</Link>
									) : (
										<a
											href={link.href}
											className="block py-4 font-display text-xl text-silver-100 hover:text-ice-400"
											onClick={() => handleNavClick(link.href)}
										>
											{link.label}
										</a>
									)}
								</li>
							))}
						</ul>

						{/* Mobile Auth & CTA Footer */}
						<div className="flex flex-col gap-4 border-t border-white/10 pt-6">
							{isAuthenticated && user ? (
								<div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
									<div className="flex flex-col">
										<span className="font-display text-sm font-medium text-silver-50">{user.name}</span>
										<span className="font-mono text-[10px] text-silver-400">{user.email}</span>
									</div>
									<button
										type="button"
										onClick={() => {
											logout();
											setOpen(false);
										}}
										className="font-mono text-xs text-red-400 uppercase"
									>
										Sign Out
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => {
										setOpen(false);
										setLoginModalOpen(true);
									}}
									className="flex w-full items-center justify-center rounded-full border border-white/20 py-3 font-mono text-xs uppercase tracking-wider text-silver-100 hover:bg-white/5"
								>
									Login / Demo Account
								</button>
							)}

							<ButtonLink to={ROUTES.protect} className="w-full">
								Protect artwork
							</ButtonLink>
						</div>
					</div>
				</div>
			</div>
		</header>
			</header>

			{/* Login Modal */}
			<LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
		</>
	);
}
