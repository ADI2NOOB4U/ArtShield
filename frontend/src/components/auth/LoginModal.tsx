import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { DEMO_PROFILES } from "../../types/auth";

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
	const { login } = useAuth();
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"creator" | "studio">("creator");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleCustomSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			await login(username.trim(), password);
			onSuccess?.();
			onClose();
		} catch (loginError) {
			setError(loginError instanceof Error ? loginError.message : "Authentication failed");
		}
	};

	const handleProfileSelect = (preset: "creator" | "studio") => {
		const profile = DEMO_PROFILES[preset];
		setName(profile.name);
		setUsername(profile.email);
		setRole(preset);
		setError("");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-ink-950/80 backdrop-blur-md transition-opacity duration-300"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Modal Body */}
			<div className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300">
				{/* Close Button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-silver-400 hover:text-white hover:border-white/20 transition-colors"
					aria-label="Close modal"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
				</button>

				{/* Header */}
				<div className="flex flex-col gap-1.5">
					<div className="inline-flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-ice-400 shadow-[0_0_8px_#38bdf8]" />
						<span className="font-mono text-[11px] uppercase tracking-widest text-ice-400">
							AUTHENTICATION SUITE
						</span>
					</div>
					<h2 id="login-modal-title" className="font-display text-2xl font-semibold tracking-tight text-silver-50">
						Identity Verification
					</h2>
					<p className="text-xs leading-relaxed text-silver-400">
						Select a beta workspace profile to prefill its username, or provide your server-issued credentials.
					</p>
				</div>

				{/* Beta Workspace Profiles */}
				<div className="mt-6 flex flex-col gap-2.5">
					<span className="font-mono text-[10px] uppercase tracking-wider text-silver-400">
						BETA WORKSPACE PROFILES
					</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<button
							type="button"
							onClick={() => handleProfileSelect("creator")}
							className="group flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition-all hover:border-ice-400/40 hover:bg-white/[0.06]"
						>
							<div className="flex w-full items-center justify-between">
								<span className="font-display text-sm font-medium text-silver-50 group-hover:text-ice-300">
									{DEMO_PROFILES.creator.name}
								</span>
								<span className="rounded bg-ice-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ice-300">
									Creator
								</span>
							</div>
							<span className="font-mono text-[10px] text-silver-400">{DEMO_PROFILES.creator.email}</span>
						</button>

						<button
							type="button"
							onClick={() => handleProfileSelect("studio")}
							className="group flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition-all hover:border-indigo-400/40 hover:bg-white/[0.06]"
						>
							<div className="flex w-full items-center justify-between">
								<span className="font-display text-sm font-medium text-silver-50 group-hover:text-indigo-300">
									{DEMO_PROFILES.studio.name}
								</span>
								<span className="rounded bg-indigo-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-indigo-300">
									Studio
								</span>
							</div>
							<span className="font-mono text-[10px] text-silver-400">{DEMO_PROFILES.studio.email}</span>
						</button>
					</div>
				</div>

				{/* Divider */}
				<div className="relative my-6 flex items-center justify-center">
					<div className="h-px w-full bg-white/10" />
					<span className="absolute bg-ink-900 px-3 font-mono text-[10px] uppercase tracking-wider text-silver-400">
						OR ENTER CREDENTIALS
					</span>
				</div>

				{/* Custom Login Form */}
				<form onSubmit={handleCustomSubmit} className="flex flex-col gap-3.5">
					<div className="flex flex-col gap-1">
						<label className="font-mono text-[10px] uppercase tracking-wider text-silver-400" htmlFor="login-name">
							FULL NAME / PSEUDONYM
						</label>
						<input
							id="login-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Satoshi Nakamoto"
							className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 font-sans text-xs text-silver-100 placeholder:text-silver-600 focus:border-ice-400 focus:outline-none focus:ring-1 focus:ring-ice-400"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="font-mono text-[10px] uppercase tracking-wider text-silver-400" htmlFor="login-email">
							SERVER USERNAME
						</label>
						<input
							id="login-email"
							type="text"
							autoComplete="username"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Configured ArtShield username"
							className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 font-sans text-xs text-silver-100 placeholder:text-silver-600 focus:border-ice-400 focus:outline-none focus:ring-1 focus:ring-ice-400"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="font-mono text-[10px] uppercase tracking-wider text-silver-400" htmlFor="login-password">
							SESSION PASSWORD
						</label>
						<input
							id="login-password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Server-issued password"
							className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 font-sans text-xs text-silver-100 placeholder:text-silver-600 focus:border-ice-400 focus:outline-none focus:ring-1 focus:ring-ice-400"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="font-mono text-[10px] uppercase tracking-wider text-silver-400">
							ACCOUNT SCOPE
						</label>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => setRole("creator")}
								className={`rounded-lg border py-2 text-center font-mono text-[11px] transition-all ${
									role === "creator"
										? "border-ice-400 bg-ice-400/15 text-ice-300"
										: "border-white/10 bg-white/[0.02] text-silver-400 hover:text-white"
								}`}
							>
								Individual Creator
							</button>
							<button
								type="button"
								onClick={() => setRole("studio")}
								className={`rounded-lg border py-2 text-center font-mono text-[11px] transition-all ${
									role === "studio"
										? "border-ice-400 bg-ice-400/15 text-ice-300"
										: "border-white/10 bg-white/[0.02] text-silver-400 hover:text-white"
								}`}
							>
								Studio / Institution
							</button>
						</div>
					</div>

					<button
						type="submit"
						className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-ice-400 to-blue-600 py-2.5 font-display text-xs font-semibold tracking-wide text-white shadow-lg transition-transform active:scale-[0.98] hover:shadow-ice-400/20"
					>
						<span>SIGN IN TO BETA WORKSPACE</span>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
							<path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>

					<p className="text-center font-mono text-[10px] text-silver-500">
						{error || "Server-validated session"}
					</p>
				</form>
			</div>
		</div>
	);
}

