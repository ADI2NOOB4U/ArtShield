import ArtworkCanvas from "../artwork/ArtworkCanvas";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const THREATS = [
	{ index: "01", name: "Copied", text: "A file can be duplicated endlessly, with no record of where the original began." },
	{ index: "02", name: "Altered", text: "Pixels can be edited, cropped or recompressed until the original is impossible to distinguish." },
	{ index: "03", name: "Scraped", text: "Public images can be collected into training datasets without the artist's consent." },
	{ index: "04", name: "Misrepresented", text: "Authorship and ownership are difficult to prove without a verifiable reference." },
	{
		index: "01",
		name: "Copied & Duplicated",
		badge: "PROVENANCE LOSS",
		text: "Digital files are replicated endlessly across networks with zero built-in record of where the original masterwork originated.",
	},
	{
		index: "02",
		name: "Altered & Inpainted",
		badge: "INTEGRITY DEGRADATION",
		text: "Compression, resizing, and AI inpainting modify visual frequencies until the original state is impossible to mathematically distinguish.",
	},
	{
		index: "03",
		name: "Scraped for AI Training",
		badge: "UNAUTHORIZED HARVESTING",
		text: "Public gallery images are scraped into multi-billion parameter model training datasets without creator consent or economic attribution.",
	},
	{
		index: "04",
		name: "Misrepresented Authorship",
		badge: "OWNERSHIP DISPUTES",
		text: "Without an immutable cryptographic reference, proving genuine creation date and title ownership in dispute remains nearly impossible.",
	},
];

export default function Problem() {
	return (
		<section id="problem" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
			<div className="site-container grid gap-24 lg:grid-cols-[0.9fr_1.1fr]">
				<Reveal className="order-last lg:order-first lg:pt-10">
		<section id="problem" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44 overflow-hidden">
			<div className="site-container grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
				{/* Visual Artwork Stack */}
				<Reveal className="order-last lg:order-first">
					<div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] sm:max-w-[340px]" aria-hidden="true">
						<div className="absolute inset-0 -translate-x-12 translate-y-10 rotate-[-9deg] opacity-25 blur-[1px]">
							<ArtworkCanvas id="problem-c" className="h-full w-full rounded-md" />
						{/* Ambient Glow */}
						<div className="absolute -inset-8 rounded-full bg-red-500/5 blur-3xl" />

						{/* Stack Layer C (Blurred duplicate) */}
						<div className="absolute inset-0 -translate-x-10 translate-y-8 rotate-[-8deg] opacity-30 blur-[2px] transition-transform duration-700 hover:-translate-x-12">
							<ArtworkCanvas id="problem-c" className="h-full w-full rounded-xl border border-white/10" />
						</div>
						<div className="absolute inset-0 -translate-x-6 translate-y-5 rotate-[-4deg] opacity-50">
							<ArtworkCanvas id="problem-b" className="h-full w-full rounded-md" />

						{/* Stack Layer B (Modified copy) */}
						<div className="absolute inset-0 -translate-x-5 translate-y-4 rotate-[-4deg] opacity-60 transition-transform duration-700 hover:-translate-x-7">
							<ArtworkCanvas id="problem-b" className="h-full w-full rounded-xl border border-white/15" />
						</div>

						{/* Stack Layer A (Original candidate) */}
						<div className="relative h-full w-full">
							<ArtworkCanvas id="problem-a" className="h-full w-full rounded-md shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9)]" />
							<ArtworkCanvas id="problem-a" className="h-full w-full rounded-xl border border-white/20 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]" />
							<div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent p-4">
								<span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
									VULNERABILITY: UNPROTECTED DIGITAL RAW
								</span>
							</div>
						</div>
						<p className="label-tech absolute -bottom-10 left-0 text-silver-500">Which one is the original?</p>

						<div className="absolute -bottom-10 left-0 right-0 text-center">
							<span className="font-mono text-[11px] uppercase tracking-widest text-silver-500">
								WHICH ITERATION IS THE AUTHENTIC ORIGINAL?
							</span>
						</div>
					</div>
				</Reveal>

				{/* Threat Breakdown */}
				<div>
					<Reveal>
						<SectionHeading
							eyebrow="The problem"
							title="Digital artwork can be copied, altered, scraped or misrepresented."
							body="Once a file leaves your hands there is no built-in way to prove where it came from, whether it has been changed, or who is allowed to use it."
							eyebrow="THREAT LANDSCAPE"
							title="The Crisis of Unprotected Digital Art."
							body="Once a creative file leaves your workstation, existing file formats provide zero mathematical protection against unauthorized copying, model scraping, or false attribution."
						/>
					</Reveal>
					<div className="mt-16 border-t border-white/[0.08]" role="list">

					<div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
						{THREATS.map((threat, index) => (
							<Reveal key={threat.index} delay={index * 80}>
								<div role="listitem" className="grid gap-3 border-b border-white/[0.08] py-6 sm:grid-cols-[3rem_11rem_1fr] sm:gap-6">
									<span className="label-tech">{threat.index}</span>
									<span className="font-display text-lg text-silver-50">{threat.name}</span>
									<p className="text-sm leading-relaxed text-silver-400 sm:text-base">{threat.text}</p>
								<div
									role="listitem"
									className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.04]"
								>
									<div>
										<div className="flex items-center justify-between">
											<span className="font-mono text-[10px] font-bold text-silver-500 group-hover:text-ice-400">
												{threat.index}
											</span>
											<span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-silver-400 group-hover:text-silver-200">
												{threat.badge}
											</span>
										</div>
										<h3 className="mt-3 font-display text-base font-semibold text-silver-50">
											{threat.name}
										</h3>
										<p className="mt-2 text-xs leading-relaxed text-silver-400">
											{threat.text}
										</p>
									</div>
								</div>
							</Reveal>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
