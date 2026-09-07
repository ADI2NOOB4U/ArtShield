import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import ArtworkCanvas from "../artwork/ArtworkCanvas";
import FingerprintMark from "./FingerprintMark";
import { usePointerParallax } from "../../hooks/usePointerParallax";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Particle = {
	left: string;
	top: string;
	size: number;
	delay: string;
	duration: string;
	opacity: number;
};

function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

function buildParticles(count: number): Particle[] {
	const random = seededRandom(20260907);
	return Array.from({ length: count }, () => ({
		left: `${(random() * 100).toFixed(2)}%`,
		top: `${(random() * 100).toFixed(2)}%`,
		size: random() > 0.7 ? 2 : 1,
		delay: `${(-random() * 26).toFixed(2)}s`,
		duration: `${(18 + random() * 16).toFixed(2)}s`,
		opacity: 0.2 + random() * 0.5,
	}));
}

/** Parallax transform for a layer: pointer depth in px, plus a scroll factor applied to --sy. */
function layer(depth: number, scrollFactor: number): CSSProperties {
	return {
		transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px + var(--sy, 0) * ${scrollFactor}px), 0)`,
	};
}

const LABELS = [
	{ position: "-left-28 -top-10", title: "SHA-256 fingerprint", value: "9f3a 71c0 … e2b4" },
	{ position: "-right-28 -top-12 text-right", title: "Watermark · LSB", value: "Embedded" },
	{ position: "-right-28 -bottom-10 text-right", title: "Provenance", value: "Certificate · Ownership" },
	{ position: "-left-28 -bottom-12", title: "Integrity", value: "Reference recorded" },
];

const NODES: Array<[number, number]> = [
	[60, 30],
	[450, 24],
	[470, 496],
	[40, 500],
];

export default function HeroArtwork() {
	const rootRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();
	usePointerParallax(rootRef, !reducedMotion);
	const particles = useMemo(() => buildParticles(22), []);

	useEffect(() => {
		const node = rootRef.current;
		if (!node || reducedMotion) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			node.style.setProperty("--sy", String(Math.min(window.scrollY, 900)));
		};
		const onScroll = () => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			node.style.removeProperty("--sy");
		};
	}, [reducedMotion]);

	return (
		<div ref={rootRef} className="relative mx-auto w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[440px]" aria-hidden="true">
			<div className="relative aspect-[3/4]">
				{/* Ambient light */}
				<div className="absolute -inset-x-32 -inset-y-24 -z-10" style={layer(-6, 0.02)}>
					<div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(127,220,255,0.10),rgba(127,220,255,0.02)_45%,transparent_70%)] blur-3xl" />
					<div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)] motion-safe:animate-light-sweep" />
				</div>

				{/* Particles */}
				<div className="absolute -inset-16 hidden md:block" style={layer(-3, 0.04)}>
					{particles.map((particle, index) => (
						<span
							key={index}
							className="absolute rounded-full bg-ice-300 motion-safe:animate-drift"
							style={{
								left: particle.left,
								top: particle.top,
								width: particle.size,
								height: particle.size,
								opacity: particle.opacity,
								animationDelay: particle.delay,
								animationDuration: particle.duration,
							}}
						/>
					))}
				</div>

				{/* Back glass plane */}
				<div className="absolute inset-0" style={layer(-10, -0.03)}>
					<div className="glass-plane -left-8 -top-10 h-[92%] w-[96%] rotate-[-7deg] opacity-80 motion-safe:animate-float-slower" />
				</div>

				{/* Data lines */}
				<div className="absolute inset-0" style={layer(8, 0.08)}>
					<svg className="absolute left-1/2 top-1/2 hidden h-[130%] w-[170%] -translate-x-1/2 -translate-y-1/2 sm:block" viewBox="0 0 510 520" preserveAspectRatio="none" fill="none">
						<path d="M105 90H60V30" stroke="rgba(255,255,255,0.18)" />
						<path d="M405 80H450V24" stroke="rgba(255,255,255,0.18)" />
						<path d="M405 430H470V496" stroke="rgba(255,255,255,0.18)" />
						<path d="M105 440H40V500" stroke="rgba(255,255,255,0.18)" />
						<path d="M40 260H105" stroke="rgba(127,220,255,0.5)" strokeDasharray="4 8" className="motion-safe:animate-dash" />
						<path d="M405 260H470" stroke="rgba(127,220,255,0.5)" strokeDasharray="4 8" className="motion-safe:animate-dash" />
						{NODES.map(([x, y]) => (
							<circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="rgba(231,233,236,0.75)" />
						))}
					</svg>
				</div>

				{/* Artwork */}
				<div className="absolute inset-0" style={layer(4, 0.06)}>
					<figure className="relative h-full w-full motion-safe:animate-float-slow">
						<ArtworkCanvas id="hero" className="h-full w-full rounded-md shadow-[0_80px_140px_-60px_rgba(0,0,0,0.95)]" />
						<div className="pointer-events-none absolute inset-0 rounded-md bg-[linear-gradient(160deg,rgba(255,255,255,0.10)_0%,transparent_35%)]" />
						<FingerprintMark className="absolute -bottom-5 -left-5 h-12 w-12 text-ice-300/80 sm:h-16 sm:w-16" />
					</figure>
				</div>

				{/* Front glass planes */}
				<div className="absolute inset-0" style={layer(14, 0.1)}>
					<div className="glass-plane -bottom-8 -right-10 h-[70%] w-[78%] rotate-[6deg] motion-safe:animate-float-slow [animation-delay:-6s]" />
				</div>
				<div className="absolute inset-0 hidden sm:block" style={layer(22, 0.14)}>
					<div className="glass-plane -left-12 bottom-[18%] h-[38%] w-[52%] rotate-[-4deg] opacity-90 motion-safe:animate-float-slower [animation-delay:-11s]" />
				</div>

				{/* Technical labels */}
				<div className="absolute inset-0" style={layer(10, 0.09)}>
					{LABELS.map((label) => (
						<div key={label.title} className={`absolute hidden whitespace-nowrap sm:block ${label.position}`}>
							<p className="label-tech text-silver-300">{label.title}</p>
							<p className="mt-1 font-mono text-[11px] text-silver-500">{label.value}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
