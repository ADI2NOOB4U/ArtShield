import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const RECORDS = [
	{ name: "Certificate", text: "A certificate of authenticity issued for the artwork's fingerprint." },
	{ name: "Ownership", text: "The current owner, registered on chain and transferable to a new address." },
	{ name: "Provenance", text: "A history of ownership and provenance entries tied to the fingerprint." },
	{ name: "Usage rights", text: "Rights granted to a wallet, verifiable and revocable on demand." },
];

const NODES = [
	{ x: 110, y: 96, label: "CERTIFICATE" },
	{ x: 490, y: 96, label: "OWNERSHIP" },
	{ x: 110, y: 324, label: "PROVENANCE" },
	{ x: 490, y: 324, label: "USAGE RIGHTS" },
];

const MONO = "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

function link(x: number, y: number): string {
	const mid = (300 + x) / 2;
	return `M300 210 C ${mid} 210, ${mid} ${y}, ${x} ${y}`;
}

export default function Provenance() {
	return (
		<section id="provenance" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36 lg:py-44">
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline-x" />
			<div className="site-container">
				<Reveal>
					<SectionHeading
						align="center"
						eyebrow="Blockchain provenance"
						title="Identity, anchored."
						body="Once an artwork has a fingerprint, ArtShield can issue a certificate of authenticity, register ownership, record provenance and grant or revoke usage rights, each written to a blockchain through the ArtShield backend."
					/>
				</Reveal>

				<Reveal delay={150} className="mx-auto mt-20 max-w-4xl lg:mt-24">
					<div className="relative rounded-[32px] border border-white/[0.06] bg-white/[0.015] p-4 sm:p-8">
						<div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-hairline-x" />
						<svg viewBox="0 0 600 420" className="h-auto w-full" fill="none" role="img" aria-label="Artwork fingerprint connected to certificate, ownership, provenance and usage-rights records">
							{[60, 100, 140].map((radius) => (
								<circle key={radius} cx="300" cy="210" r={radius} stroke="rgba(255,255,255,0.05)" />
							))}
							{NODES.map((node) => (
								<g key={node.label}>
									<path d={link(node.x, node.y)} stroke="rgba(255,255,255,0.14)" />
									<path d={link(node.x, node.y)} stroke="rgba(127,220,255,0.55)" strokeDasharray="6 14" className="motion-safe:animate-dash" />
									<circle cx={node.x} cy={node.y} r="14" stroke="rgba(255,255,255,0.18)" />
									<circle cx={node.x} cy={node.y} r="3.5" fill="#e7e9ec" />
									<text x={node.x} y={node.y - 26} textAnchor="middle" fill="#aab0b7" fontFamily={MONO} fontSize="10" letterSpacing="2">
										{node.label}
									</text>
								</g>
							))}
							<rect x="216" y="182" width="168" height="56" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
							<text x="300" y="204" textAnchor="middle" fill="#f5f6f7" fontFamily={MONO} fontSize="10" letterSpacing="2">
								ARTWORK FINGERPRINT
							</text>
							<text x="300" y="224" textAnchor="middle" fill="#7fdcff" fontFamily={MONO} fontSize="10">
								a8f1 09c4 7e2b … 5c9e
							</text>
						</svg>
					</div>
				</Reveal>

				<div className="mx-auto mt-20 grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
					{RECORDS.map((record, index) => (
						<Reveal key={record.name} delay={index * 90}>
							<div className="h-full border-l border-white/[0.08] px-6 py-1">
								<p className="label-tech">{record.name}</p>
								<p className="mt-4 text-sm leading-relaxed text-silver-300">{record.text}</p>
							</div>
						</Reveal>
					))}
				</div>

				<Reveal delay={200}>
					<p className="mx-auto mt-16 max-w-2xl text-center text-xs leading-relaxed text-silver-500">
						Transactions are submitted by the ArtShield backend when blockchain configuration and signer authorization are available. The current release records to a local development chain.
					</p>
				</Reveal>
			</div>
		</section>
	);
}
