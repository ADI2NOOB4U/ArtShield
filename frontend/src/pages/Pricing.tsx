import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { PRICING_TIERS, ROUTES } from "../utils/constants";
import { CinematicBackground } from "../components/protect/CinematicBackground";

const FAQ_ITEMS = [
	{
		q: "How does ArtShield differ from standard watermarking?",
		a: "The current protection workflow generates a SHA-256 fingerprint, embeds an LSB watermark, applies deterministic AI Shield frequency perturbation, and returns a SHA-256 digest for the protected file. These features are designed to support protection and integrity checks; they do not guarantee prevention of copying or AI training.",
	},
	{
		q: "Do I need cryptocurrency or a Web3 wallet to use ArtShield?",
		a: "No wallet is required for the current beta protection flow. Public blockchain anchoring is in development, and availability of the ML service depends on deployment status.",
	},
	{
		q: "Is image quality altered during the protection process?",
		a: "The pipeline returns a protected image with watermark and deterministic perturbation processing. Output appearance may vary by source artwork and should be reviewed before use.",
	},
	{
		q: "Can I verify an artwork that was protected on another device?",
		a: "Verification currently uses a reference saved in the same browser. Cross-device verification requires the corresponding reference to be available and is not provided by the current local workflow.",
	},
];

export default function Pricing() {
	const [activeFaq, setActiveFaq] = useState<number | null>(null);

	const toggleFaq = (index: number) => {
		setActiveFaq((prev) => (prev === index ? null : index));
	};

	return (
		<div className="pricing-exhibition min-h-screen bg-ink-950 text-silver-100 relative">
			{/* Background */}
			<CinematicBackground />

			{/* Navbar */}
			<Navbar />

			<main className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 pt-32 pb-24 sm:pt-40 sm:pb-32">
				{/* Header */}
				<div className="mx-auto max-w-3xl text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-ice-400/20 bg-ice-400/10 px-3.5 py-1 text-xs">
						<span className="h-1.5 w-1.5 rounded-full bg-ice-400 shadow-[0_0_8px_#38bdf8]" />
						<span className="font-mono text-[11px] uppercase tracking-widest text-ice-300">
							BETA ACCESS MODEL - CONCEPTUAL TIERS
						</span>
					</div>

					<h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-silver-50 sm:text-5xl lg:text-6xl">
						Early Access
					</h1>

					<p className="mt-6 text-base leading-relaxed text-silver-400 sm:text-lg">
						These access models are conceptual and do not represent finalized pricing or production service commitments.
					</p>
				</div>

				{/* Pricing Cards Grid */}
				<div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 items-stretch">
					{PRICING_TIERS.map((tier) => (
						<div
							key={tier.id}
							className={`relative flex flex-col justify-between rounded-2xl p-8 backdrop-blur-xl transition-all duration-300 ${
								tier.highlighted
									? "border-2 border-ice-400/60 bg-white/[0.05] shadow-[0_0_50px_-10px_rgba(56,189,248,0.2)] lg:-translate-y-2"
									: "border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
							}`}
						>
							{tier.highlighted && (
								<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-ice-400 to-blue-600 px-4 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
									CONCEPTUAL MODEL
								</div>
							)}

							<div>
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs font-semibold uppercase tracking-widest text-ice-400">
										{tier.tag}
									</span>
									<span className="font-display text-xl font-bold text-silver-50">{tier.name}</span>
								</div>

								<div className="mt-6 flex items-baseline gap-2">
									<span className="font-display text-4xl font-bold tracking-tight text-white">{tier.price}</span>
									<span className="font-mono text-xs text-silver-400">{tier.period}</span>
								</div>

								<p className="mt-4 text-xs leading-relaxed text-silver-400">{tier.description}</p>

								<div className="my-6 h-px w-full bg-white/10" />

								<div className="flex flex-col gap-3">
									<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-silver-300">
										INCLUDED CAPABILITIES
									</span>
									<ul className="flex flex-col gap-2.5">
										{tier.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2.5 text-xs text-silver-300">
												<svg
													className="mt-0.5 h-4 w-4 shrink-0 text-ice-400"
													viewBox="0 0 16 16"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M3.5 8.5L6.5 11.5L12.5 4.5"
														stroke="currentColor"
														strokeWidth="1.8"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</div>
							</div>

							<div className="mt-8">
								<Link
									to={tier.ctaLink}
									className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
										tier.highlighted
											? "bg-gradient-to-r from-ice-400 to-blue-600 text-white shadow-lg hover:shadow-ice-400/25 active:scale-[0.98]"
											: "border border-white/15 bg-white/[0.04] text-silver-100 hover:border-white/30 hover:bg-white/[0.08] active:scale-[0.98]"
									}`}
								>
									<span>{tier.ctaText}</span>
									<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
										<path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</Link>
							</div>
						</div>
					))}
				</div>

				{/* Detailed Feature Breakdown Table */}
				<div className="mt-28">
					<div className="mx-auto max-w-2xl text-center">
						<span className="font-mono text-[11px] uppercase tracking-widest text-ice-400">
							SYSTEM SPECIFICATIONS
						</span>
						<h2 className="mt-2 font-display text-3xl font-semibold text-silver-50">
							Planned Capability Overview
						</h2>
					</div>

					<div className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
						<table className="w-full text-left text-xs text-silver-300">
							<thead>
								<tr className="border-b border-white/10 bg-white/[0.02] font-mono uppercase tracking-wider text-silver-400">
									<th className="p-4 sm:p-5">Security Dimension</th>
									<th className="p-4 sm:p-5 text-center">Explorer</th>
									<th className="p-4 sm:p-5 text-center text-ice-300">Creator</th>
									<th className="p-4 sm:p-5 text-center">Studio</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/[0.06]">
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">SHA-256 Mathematical Fingerprint</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ Included</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ Included</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ Included</td>
								</tr>
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">LSB Steganographic Watermark</td>
									<td className="p-4 sm:p-5 text-center">LSB watermark</td>
									<td className="p-4 sm:p-5 text-center text-ice-300">LSB watermark</td>
									<td className="p-4 sm:p-5 text-center text-ice-300">LSB watermark</td>
								</tr>
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">AI Shield - Deterministic frequency perturbation</td>
									<td className="p-4 sm:p-5 text-center text-silver-600">—</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ Deterministic perturbation</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ Deterministic perturbation</td>
								</tr>
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">Public Blockchain Anchoring</td>
									<td className="p-4 sm:p-5 text-center text-silver-600">—</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ In development</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ In development</td>
								</tr>
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">Production Rights Enforcement</td>
									<td className="p-4 sm:p-5 text-center text-silver-600">—</td>
									<td className="p-4 sm:p-5 text-center">Declaration only</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ In development</td>
								</tr>
								<tr>
									<td className="p-4 sm:p-5 font-medium text-silver-100">Deterministic Artifact Verification</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ ML verification service</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ ML verification service</td>
									<td className="p-4 sm:p-5 text-center text-ice-400">✓ In development</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* FAQ Section */}
				<div className="mt-28 max-w-3xl mx-auto">
					<div className="text-center">
						<span className="font-mono text-[11px] uppercase tracking-widest text-ice-400">
							FREQUENTLY ASKED QUESTIONS
						</span>
						<h2 className="mt-2 font-display text-3xl font-semibold text-silver-50">
							Understanding ArtShield Architecture
						</h2>
					</div>

					<div className="mt-10 flex flex-col gap-4">
						{FAQ_ITEMS.map((faq, idx) => {
							const isOpen = activeFaq === idx;
							return (
								<div
									key={faq.q}
									className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-colors hover:border-white/20"
								>
									<button
										type="button"
										onClick={() => toggleFaq(idx)}
										className="flex w-full items-center justify-between p-5 text-left font-display text-sm font-medium text-silver-100"
									>
										<span>{faq.q}</span>
										<svg
											className={`h-4 w-4 text-silver-400 transition-transform duration-200 ${
												isOpen ? "rotate-180 text-ice-400" : ""
											}`}
											viewBox="0 0 16 16"
											fill="none"
										>
											<path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									</button>
									{isOpen && (
										<div className="px-5 pb-5 text-xs leading-relaxed text-silver-400 border-t border-white/[0.06] pt-3">
											{faq.a}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Final Call to Action */}
				<div className="mt-24 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-10 text-center backdrop-blur-2xl">
					<h3 className="font-display text-2xl sm:text-3xl font-semibold text-silver-50">
						Explore the ArtShield beta
					</h3>
					<p className="mt-3 text-xs sm:text-sm text-silver-400 max-w-md mx-auto">
						Use the current protection and verification workflow. Commercial access terms are in development.
					</p>
					<div className="mt-8 flex justify-center gap-4">
						<Link
							to={ROUTES.protect}
							className="rounded-full bg-gradient-to-r from-ice-400 to-blue-600 px-8 py-3 font-display text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
						>
							Open Beta Workspace
						</Link>
					</div>
				</div>
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}

