import ArtworkCanvas from "../artwork/ArtworkCanvas";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const THREATS = [
	{ index: "01", name: "Copied", text: "A file can be duplicated endlessly, with no record of where the original began." },
	{ index: "02", name: "Altered", text: "Pixels can be edited, cropped or recompressed until the original is impossible to distinguish." },
	{ index: "03", name: "Scraped", text: "Public images can be collected into training datasets without the artist's consent." },
	{ index: "04", name: "Misrepresented", text: "Authorship and ownership are difficult to prove without a verifiable reference." },
];

export default function Problem() {
	return (
		<section id="problem" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
			<div className="site-container grid gap-24 lg:grid-cols-[0.9fr_1.1fr]">
				<Reveal className="order-last lg:order-first lg:pt-10">
					<div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] sm:max-w-[340px]" aria-hidden="true">
						<div className="absolute inset-0 -translate-x-12 translate-y-10 rotate-[-9deg] opacity-25 blur-[1px]">
							<ArtworkCanvas id="problem-c" className="h-full w-full rounded-md" />
						</div>
						<div className="absolute inset-0 -translate-x-6 translate-y-5 rotate-[-4deg] opacity-50">
							<ArtworkCanvas id="problem-b" className="h-full w-full rounded-md" />
						</div>
						<div className="relative h-full w-full">
							<ArtworkCanvas id="problem-a" className="h-full w-full rounded-md shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9)]" />
						</div>
						<p className="label-tech absolute -bottom-10 left-0 text-silver-500">Which one is the original?</p>
					</div>
				</Reveal>

				<div>
					<Reveal>
						<SectionHeading
							eyebrow="The problem"
							title="Digital artwork can be copied, altered, scraped or misrepresented."
							body="Once a file leaves your hands there is no built-in way to prove where it came from, whether it has been changed, or who is allowed to use it."
						/>
					</Reveal>
					<div className="mt-16 border-t border-white/[0.08]" role="list">
						{THREATS.map((threat, index) => (
							<Reveal key={threat.index} delay={index * 80}>
								<div role="listitem" className="grid gap-3 border-b border-white/[0.08] py-6 sm:grid-cols-[3rem_11rem_1fr] sm:gap-6">
									<span className="label-tech">{threat.index}</span>
									<span className="font-display text-lg text-silver-50">{threat.name}</span>
									<p className="text-sm leading-relaxed text-silver-400 sm:text-base">{threat.text}</p>
								</div>
							</Reveal>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
