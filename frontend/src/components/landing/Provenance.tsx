import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";

const RECORDS = [
	{ name: "Certificate", text: "A certificate of authenticity issued for the artwork's fingerprint." },
	{ name: "Ownership", text: "The current owner, registered on chain and transferable to a new address." },
	{ name: "Provenance", text: "A history of ownership and provenance entries tied to the fingerprint." },
	{ name: "Usage rights", text: "Rights granted to a wallet, verifiable and revocable on demand." },
	{
		name: "Authenticity Certificate",
		tag: "ERC-721 SEAL",
		text: "An immutable cryptographic certificate issued and verified on-chain against the masterwork's fingerprint.",
	},
	{
		name: "Ownership Ledger",
		tag: "DECENTRALIZED TITLE",
		text: "Current title ownership recorded on-ledger and transferable to collector wallet addresses with zero dispute ambiguity.",
	},
	{
		name: "Provenance Chain",
		tag: "HISTORICAL CUSTODY",
		text: "A chronological audit trail documenting exhibition history, creation timestamp, and gallery transitions.",
	},
	{
		name: "Usage Rights & Licensing",
		tag: "PROGRAMMABLE RIGHTS",
		text: "Granular commercial or editorial rights masks granted to client wallets, verifiable and revocable in real time.",
	},
];

const NODES = [
	{ x: 110, y: 96, label: "CERTIFICATE" },
	{ x: 490, y: 96, label: "OWNERSHIP" },
	{ x: 110, y: 324, label: "PROVENANCE" },
	{ x: 490, y: 324, label: "USAGE RIGHTS" },
	{ x: 110, y: 96, label: "CERTIFICATE", code: "TOKEN #01" },
	{ x: 490, y: 96, label: "OWNERSHIP", code: "WALLET 0x71...49" },
	{ x: 110, y: 324, label: "PROVENANCE", code: "GENESIS BLOCK" },
	{ x: 490, y: 324, label: "USAGE RIGHTS", code: "RIGHTS MASK: 0x04" },
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
						eyebrow="ON-CHAIN PROVENANCE INFRASTRUCTURE"
						title="Identity, Anchored in Cryptography."
						body="Once an artwork receives a unique SHA-256 fingerprint, ArtShield anchors its authenticity certificate, legal ownership, chronological provenance, and programmable usage rights to a decentralized blockchain ledger."
					/>
				</Reveal>

				{/* Interactive Ledger Topology Diagram */}
				<Reveal delay={150} className="mx-auto mt-20 max-w-4xl lg:mt-24">
					<div className="relative rounded-[32px] border border-white/[0.06] bg-white/[0.015] p-4 sm:p-8">
					<div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-10 backdrop-blur-2xl shadow-2xl">
						<div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-hairline-x" />
						<svg viewBox="0 0 600 420" className="h-auto w-full" fill="none" role="img" aria-label="Artwork fingerprint connected to certificate, ownership, provenance and usage-rights records">
							{[60, 100, 140].map((radius) => (
								<circle key={radius} cx="300" cy="210" r={radius} stroke="rgba(255,255,255,0.05)" />
						<svg
							viewBox="0 0 600 420"
							className="h-auto w-full drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]"
							fill="none"
							role="img"
							aria-label="Artwork fingerprint connected to certificate, ownership, provenance and usage-rights records"
						>
							{/* Radar Concentric Rings */}
							{[60, 110, 160].map((radius) => (
								<circle key={radius} cx="300" cy="210" r={radius} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
							))}

							{/* Connection Nodes */}
							{NODES.map((node) => (
								<g key={node.label}>
									<path d={link(node.x, node.y)} stroke="rgba(255,255,255,0.14)" />
									<path d={link(node.x, node.y)} stroke="rgba(127,220,255,0.55)" strokeDasharray="6 14" className="motion-safe:animate-dash" />
									<circle cx={node.x} cy={node.y} r="14" stroke="rgba(255,255,255,0.18)" />
									<circle cx={node.x} cy={node.y} r="3.5" fill="#e7e9ec" />
									<text x={node.x} y={node.y - 26} textAnchor="middle" fill="#aab0b7" fontFamily={MONO} fontSize="10" letterSpacing="2">
									<path d={link(node.x, node.y)} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
									<path
										d={link(node.x, node.y)}
										stroke="#38bdf8"
										strokeWidth="1.5"
										strokeDasharray="6 14"
										className="motion-safe:animate-dash"
									/>
									<circle cx={node.x} cy={node.y} r="16" fill="#090d14" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" />
									<circle cx={node.x} cy={node.y} r="4" fill="#38bdf8" />
									<text
										x={node.x}
										y={node.y - 28}
										textAnchor="middle"
										fill="#f5f7fa"
										fontFamily={MONO}
										fontSize="10"
										fontWeight="600"
										letterSpacing="2"
									>
										{node.label}
									</text>
									<text
										x={node.x}
										y={node.y + 32}
										textAnchor="middle"
										fill="#64748b"
										fontFamily={MONO}
										fontSize="8"
										letterSpacing="1"
									>
										{node.code}
									</text>
								</g>
							))}
							<rect x="216" y="182" width="168" height="56" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
							<text x="300" y="204" textAnchor="middle" fill="#f5f6f7" fontFamily={MONO} fontSize="10" letterSpacing="2">

							{/* Center Fingerprint Hub */}
							<rect
								x="200"
								y="180"
								width="200"
								height="60"
								rx="14"
								fill="#0d131c"
								stroke="#38bdf8"
								strokeWidth="1.5"
								className="shadow-lg"
							/>
							<text
								x="300"
								y="204"
								textAnchor="middle"
								fill="#f5f7fa"
								fontFamily={MONO}
								fontSize="10"
								fontWeight="700"
								letterSpacing="2"
							>
								ARTWORK FINGERPRINT
							</text>
							<text x="300" y="224" textAnchor="middle" fill="#7fdcff" fontFamily={MONO} fontSize="10">
							<text
								x="300"
								y="224"
								textAnchor="middle"
								fill="#38bdf8"
								fontFamily={MONO}
								fontSize="9"
								letterSpacing="1"
							>
								a8f1 09c4 7e2b … 5c9e
							</text>
						</svg>
					</div>
				</Reveal>

				<div className="mx-auto mt-20 grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
				{/* 4 Feature Records Cards */}
				<div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:mt-20">
					{RECORDS.map((record, index) => (
						<Reveal key={record.name} delay={index * 90}>
							<div className="h-full border-l border-white/[0.08] px-6 py-1">
								<p className="label-tech">{record.name}</p>
								<p className="mt-4 text-sm leading-relaxed text-silver-300">{record.text}</p>
						<Reveal key={record.name} delay={index * 80}>
							<div className="flex h-full flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-all duration-300 hover:border-ice-400/30 hover:bg-white/[0.04]">
								<div>
									<span className="font-mono text-[9px] uppercase tracking-wider text-ice-400">
										{record.tag}
									</span>
									<h3 className="mt-2 font-display text-sm font-semibold text-silver-50">
										{record.name}
									</h3>
									<p className="mt-2 text-xs leading-relaxed text-silver-400">
										{record.text}
									</p>
								</div>
							</div>
						</Reveal>
					))}
				</div>

				<Reveal delay={200}>
					<p className="mx-auto mt-16 max-w-2xl text-center text-xs leading-relaxed text-silver-500">
						Transactions are submitted by the ArtShield backend when blockchain configuration and signer authorization are available. The current release records to a local development chain.
					<p className="mx-auto mt-14 max-w-2xl text-center font-mono text-[10px] leading-relaxed text-silver-500">
						Smart contract transactions are signed and submitted via the ArtShield backend to Ethereum/Polygon or private exhibition nodes.
					</p>
				</Reveal>
			</div>
		</section>
	);
}
