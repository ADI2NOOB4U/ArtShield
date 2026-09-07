type Props = {
	id: string;
	className?: string;
};

const GRAIN_LINES = Array.from({ length: 12 }, (_, index) => 20 + index * 24);

/**
 * Illustrative vertical artwork rendered as inline SVG. Purely decorative; the `id` prefix
 * keeps gradient/clipPath ids unique when several instances are on the page.
 */
export default function ArtworkCanvas({ id, className = "" }: Props) {
	const ref = (name: string) => `${id}-${name}`;
	return (
		<svg viewBox="0 0 300 400" className={className} role="img" aria-label="Illustrative digital artwork" preserveAspectRatio="xMidYMid slice">
			<defs>
				<linearGradient id={ref("bg")} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1c2127" />
					<stop offset="1" stopColor="#07090b" />
				</linearGradient>
				<radialGradient id={ref("moon")} cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor="#f5f6f7" stopOpacity="0.96" />
					<stop offset="0.55" stopColor="#cfd3d8" stopOpacity="0.4" />
					<stop offset="1" stopColor="#cfd3d8" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={ref("haze")} cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stopColor="#4cc8f4" stopOpacity="0.22" />
					<stop offset="1" stopColor="#4cc8f4" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={ref("ribbon")} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#7fdcff" stopOpacity="0.9" />
					<stop offset="0.5" stopColor="#e7e9ec" stopOpacity="0.75" />
					<stop offset="1" stopColor="#4cc8f4" stopOpacity="0.15" />
				</linearGradient>
				<clipPath id={ref("clip")}>
					<rect width="300" height="400" rx="6" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${ref("clip")})`}>
				<rect width="300" height="400" fill={`url(#${ref("bg")})`} />
				<ellipse cx="150" cy="310" rx="230" ry="130" fill={`url(#${ref("haze")})`} />
				<circle cx="150" cy="150" r="92" fill={`url(#${ref("moon")})`} />
				{GRAIN_LINES.map((x) => (
					<line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#ffffff" strokeOpacity="0.028" />
				))}
				<path d="M-20 300C60 240 120 330 170 250S280 170 330 220" fill="none" stroke={`url(#${ref("ribbon")})`} strokeWidth="2.2" strokeLinecap="round" />
				<path d="M-20 322C70 272 130 352 180 282S290 202 330 252" fill="none" stroke="#e7e9ec" strokeOpacity="0.16" />
				<rect x="200" y="70" width="44" height="44" rx="4" fill="none" stroke="#cfd3d8" strokeOpacity="0.35" transform="rotate(18 222 92)" />
				<rect x="52" y="230" width="26" height="26" rx="3" fill="#7fdcff" fillOpacity="0.12" stroke="#7fdcff" strokeOpacity="0.4" transform="rotate(-12 65 243)" />
				<line x1="24" y1="372" x2="96" y2="372" stroke="#e7e9ec" strokeOpacity="0.4" />
			</g>
			<rect x="0.5" y="0.5" width="299" height="399" rx="6" fill="none" stroke="#ffffff" strokeOpacity="0.14" />
		</svg>
	);
}
