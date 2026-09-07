import { useRef } from "react";
import { useRef, useState } from "react";
import ArtworkCanvas from "../artwork/ArtworkCanvas";
import FingerprintMark from "./FingerprintMark";
import Reveal from "./Reveal";
import SectionHeading from "../ui/SectionHeading";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { PROTECTION_STAGES } from "../../utils/constants";

const HASH_FRAGMENT = "a8f1 09c4 7e2b … 5c9e";
const PROVENANCE_NODES = ["Certificate", "Ownership", "Rights"];

type StageArtworkProps = {
	active: number;
	id: string;
};

/** The artwork stays central; each protection stage adds a visual layer around it. */
/** Central artwork with layered visual elements corresponding to each protection stage */
function StageArtwork({ active, id }: StageArtworkProps) {
	const on = (index: number) => active >= index;
	const state = (index: number) => (on(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3");
	const state = (index: number) =>
		on(index) ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none";

	return (
		<div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[340px]" aria-hidden="true">
			<div className={`absolute -inset-5 rounded-[22px] border transition-all duration-1000 ease-premium ${on(4) ? "border-ice-400/40 shadow-[0_0_0_1px_rgba(127,220,255,0.12),0_60px_140px_-60px_rgba(127,220,255,0.35)]" : "border-white/[0.06]"}`} />
			<ArtworkCanvas id={id} className="relative h-full w-full rounded-md" />
		<div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]" aria-hidden="true">
			{/* Ambient Outer Glow Frame */}
			<div
				className={`absolute -inset-6 rounded-[28px] border transition-all duration-1000 ease-premium ${
					on(4)
						? "border-ice-400/50 shadow-[0_0_50px_rgba(56,189,248,0.25),inset_0_0_20px_rgba(56,189,248,0.1)]"
						: "border-white/[0.08]"
				}`}
			/>

			{/* 02 watermark lattice */}
			<div className={`absolute inset-0 rounded-md mix-blend-screen transition-all duration-700 ease-premium [background-image:radial-gradient(rgba(127,220,255,0.45)_0.6px,transparent_0.7px)] [background-size:14px_14px] ${state(1)}`} />
			{/* Central Canvas Artwork */}
			<ArtworkCanvas id={id} className="relative h-full w-full rounded-2xl border border-white/10 shadow-2xl" />

			{/* 03 perturbation plane */}
			<div className={`glass-plane -right-8 top-8 h-[72%] w-[70%] rotate-[5deg] transition-all duration-700 ease-premium ${state(2)}`}>
				<p className="label-tech absolute bottom-4 left-5 text-silver-300">Perturbation · deterministic</p>
			{/* 02: Watermark Lattice Layer */}
			<div
				className={`absolute inset-0 rounded-2xl mix-blend-screen transition-all duration-700 ease-premium [background-image:radial-gradient(rgba(56,189,248,0.6)_0.7px,transparent_0.8px)] [background-size:16px_16px] ${state(
					1,
				)}`}
			/>

			{/* 03: Perturbation Shield Plane */}
			<div
				className={`glass-plane -right-6 top-8 h-[70%] w-[68%] rotate-[4deg] transition-all duration-700 ease-premium ${state(
					2,
				)}`}
			>
				<p className="font-mono text-[10px] uppercase tracking-wider absolute bottom-4 left-5 text-ice-300">
					Perturbation · Deterministic
				</p>
			</div>

			{/* 01 identity */}
			<div className={`absolute -left-6 -top-8 flex items-center gap-3 transition-all duration-700 ease-premium sm:-left-8 ${state(0)}`}>
				<FingerprintMark className="h-12 w-12 text-ice-300" />
			{/* 01: SHA-256 Identity Badge */}
			<div
				className={`absolute -left-6 -top-6 flex items-center gap-3 rounded-xl border border-white/15 bg-ink-950/90 p-2.5 shadow-xl backdrop-blur-md transition-all duration-700 ease-premium ${state(
					0,
				)}`}
			>
				<FingerprintMark className="h-9 w-9 text-ice-400" />
				<div>
					<p className="label-tech text-silver-200">SHA-256</p>
					<p className="mt-1 font-mono text-[11px] text-silver-500">{HASH_FRAGMENT}</p>
					<p className="font-mono text-[9px] uppercase tracking-widest text-silver-400">SHA-256 SEAL</p>
					<p className="font-mono text-[10px] text-silver-200">{HASH_FRAGMENT}</p>
				</div>
			</div>

			{/* 04 provenance nodes */}
			<div className={`absolute -right-24 bottom-10 hidden flex-col gap-6 transition-all duration-700 ease-premium sm:flex ${state(3)}`}>
			{/* 04: Provenance Blockchain Nodes */}
			<div
				className={`absolute -right-20 bottom-10 hidden flex-col gap-4 rounded-xl border border-white/10 bg-ink-950/80 p-3 backdrop-blur-md transition-all duration-700 ease-premium sm:flex ${state(
					3,
				)}`}
			>
				<span className="font-mono text-[9px] uppercase tracking-wider text-ice-400">LEDGER STATE</span>
				{PROVENANCE_NODES.map((node, index) => (
					<div key={node} className="flex items-center gap-3">
						<span className="relative flex h-6 w-6 items-center justify-center">
							<span className="absolute inset-0 rounded-full border border-white/15" />
							<span className="h-1 w-1 rounded-full bg-silver-100" />
							{index < PROVENANCE_NODES.length - 1 && <span className="absolute left-1/2 top-full h-6 w-px -translate-x-1/2 bg-white/15" />}
					<div key={node} className="flex items-center gap-2.5">
						<span className="relative flex h-5 w-5 items-center justify-center">
							<span className="absolute inset-0 rounded-full border border-ice-400/40" />
							<span className="h-1.5 w-1.5 rounded-full bg-ice-300" />
							{index < PROVENANCE_NODES.length - 1 && (
								<span className="absolute left-1/2 top-full h-4 w-px -translate-x-1/2 bg-white/20" />
							)}
						</span>
						<span className="label-tech text-silver-300">{node}</span>
						<span className="font-mono text-[10px] text-silver-200">{node}</span>
					</div>
				))}
			</div>

			{/* 05 verified */}
			<div className={`absolute -bottom-12 left-0 flex items-center gap-3 transition-all duration-700 ease-premium ${state(4)}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-ice-300 shadow-[0_0_12px_rgba(127,220,255,0.8)]" />
				<span className="label-tech text-ice-300">Integrity verified</span>
			{/* 05: Verification Audit Stamp */}
			<div
				className={`absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-emerald-400/40 bg-ink-950/90 px-4 py-2 shadow-xl backdrop-blur-md transition-all duration-700 ease-premium ${state(
					4,
				)}`}
			>
				<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
				<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
					INTEGRITY AUDIT PASSED
				</span>
			</div>
		</div>
	);
}

function StageList({ active }: { active: number }) {
function StageList({ active, onSelect }: { active: number; onSelect?: (idx: number) => void }) {
	return (
		<ol>
		<ol className="flex flex-col gap-2">
			{PROTECTION_STAGES.map((stage, index) => {
				const isActive = index === active;
				const isPast = index < active;
				return (
					<li key={stage.id} className={`border-t border-white/[0.08] py-5 transition-opacity duration-500 ${isActive ? "opacity-100" : isPast ? "opacity-60" : "opacity-30"}`}>
						<div className="flex items-baseline gap-6">
							<span className="label-tech w-8 shrink-0">{stage.index}</span>
					<li
						key={stage.id}
						onClick={() => onSelect?.(index)}
						className={`group cursor-pointer rounded-xl border p-5 transition-all duration-300 ${
							isActive
								? "border-ice-400/40 bg-white/[0.04] shadow-[0_0_30px_rgba(56,189,248,0.1)]"
								: isPast
								? "border-white/10 bg-white/[0.015] opacity-75 hover:opacity-100 hover:border-white/20"
								: "border-transparent bg-transparent opacity-40 hover:opacity-75"
						}`}
					>
						<div className="flex items-start gap-4">
							<span
								className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors ${
									isActive
										? "bg-ice-400/20 text-ice-300 border border-ice-400/40"
										: "bg-white/5 text-silver-400"
								}`}
							>
								{stage.index}
							</span>
							<div className="min-w-0 flex-1">
								<div className="flex items-baseline justify-between gap-4">
									<h3 className="font-display text-xl font-medium uppercase tracking-[0.06em] text-silver-50 sm:text-2xl">{stage.name}</h3>
									<span className="label-tech hidden text-right xl:inline">{stage.technical}</span>
								<div className="flex items-center justify-between gap-4">
									<h3 className={`font-display text-lg font-semibold tracking-wide ${isActive ? "text-silver-50" : "text-silver-300"}`}>
										{stage.name}
									</h3>
									<span className="font-mono text-[10px] uppercase text-ice-400 tracking-wider">
										{stage.technical}
									</span>
								</div>
								<div className={`grid transition-all duration-700 ease-premium ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
									<p className="min-h-0 overflow-hidden pt-3 text-sm leading-relaxed text-silver-300 sm:text-base">{stage.description}</p>
								<div
									className={`grid transition-all duration-500 ease-premium ${
										isActive ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
									}`}
								>
									<p className="min-h-0 overflow-hidden text-xs leading-relaxed text-silver-400">
										{stage.description}
									</p>
								</div>
							</div>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

export default function ProtectionLayers() {
	const trackRef = useRef<HTMLDivElement>(null);
	const progress = useScrollProgress(trackRef);
	const count = PROTECTION_STAGES.length;
	const active = Math.min(count - 1, Math.floor(progress * count));
	const [manualStage, setManualStage] = useState<number | null>(null);

	const scrollActive = Math.min(count - 1, Math.floor(progress * count));
	const active = manualStage !== null ? manualStage : scrollActive;

	return (
		<section id="technology" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-40">
			<div className="site-container">
				<Reveal>
					<SectionHeading
						eyebrow="Protection layers"
						eyebrow="MULTI-TIER SECURITY ARCHITECTURE"
						title={
							<>
								Five stages.
								Five Defense Layers.
								<br />
								One protected artifact.
								One Mathematical Artifact.
							</>
						}
						body="The artwork stays at the centre. Each stage adds a layer of evidence around it, from cryptographic identity to on-chain provenance and final verification."
						body="The masterwork remains at the core while each cryptographic layer adds verifiable evidence around it, spanning deterministic perturbations to on-chain provenance."
					/>
				</Reveal>
			</div>

			{/* Desktop: scroll-driven, sticky stage */}
			<div ref={trackRef} className="relative mt-16 hidden lg:block" style={{ minHeight: `${count * 90 + 60}vh` }}>
				<div className="sticky top-0 flex h-screen items-center">
					<div className="site-container grid grid-cols-[0.9fr_1.1fr] items-center gap-24">
			{/* Desktop: Scroll-driven sticky stage */}
			<div ref={trackRef} className="relative mt-16 hidden lg:block" style={{ minHeight: `${count * 75 + 40}vh` }}>
				<div className="sticky top-20 flex min-h-[80vh] items-center">
					<div className="site-container grid grid-cols-[0.9fr_1.1fr] items-center gap-20">
						<StageArtwork active={active} id="layers-desktop" />
						<div>
							<StageList active={active} />
							<div className="mt-8 h-px w-full bg-white/[0.06]">
								<div className="h-px bg-ice-400/70 transition-[width] duration-500 ease-premium" style={{ width: `${((active + 1) / count) * 100}%` }} />
							<StageList active={active} onSelect={(idx) => setManualStage(idx)} />
							<div className="mt-8 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-ice-400 to-blue-600 transition-all duration-500 ease-premium"
									style={{ width: `${((active + 1) / count) * 100}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile and tablet: stacked, simplified */}
			<div className="site-container mt-20 lg:hidden">
			{/* Mobile & Tablet: Interactive Switcher & Stack */}
			<div className="site-container mt-16 lg:hidden">
				<Reveal>
					<StageArtwork active={count - 1} id="layers-mobile" />
					<StageArtwork active={active} id="layers-mobile" />
				</Reveal>
				<div className="mt-24 border-t border-white/[0.08]">
					{PROTECTION_STAGES.map((stage, index) => (
						<Reveal key={stage.id} delay={index * 60}>
							<div className="grid gap-3 border-b border-white/[0.08] py-6">
								<div className="flex items-baseline gap-5">
									<span className="label-tech">{stage.index}</span>
									<h3 className="font-display text-xl font-medium uppercase tracking-[0.06em] text-silver-50">{stage.name}</h3>
								</div>
								<p className="label-tech pl-10">{stage.technical}</p>
								<p className="pl-10 text-sm leading-relaxed text-silver-300">{stage.description}</p>
							</div>
						</Reveal>
					))}
				<div className="mt-16">
					<StageList active={active} onSelect={(idx) => setManualStage(idx)} />
				</div>
			</div>
		</section>
	);
}
