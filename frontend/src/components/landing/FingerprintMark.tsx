type Props = {
	className?: string;
};

const RINGS = [10, 16, 22, 28, 34];

/** Abstract fingerprint glyph made of broken concentric rings. Decorative. */
export default function FingerprintMark({ className = "" }: Props) {
	return (
		<svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
			{RINGS.map((radius, index) => (
				<circle
					key={radius}
					cx="40"
					cy="40"
					r={radius}
					stroke="currentColor"
					strokeOpacity={0.9 - index * 0.14}
					strokeWidth="1"
					strokeDasharray={index % 2 === 0 ? `${radius * 1.6} ${radius * 0.9}` : `${radius * 0.7} ${radius * 1.3}`}
					transform={`rotate(${index * 23} 40 40)`}
				/>
			))}
			<circle cx="40" cy="40" r="2" fill="currentColor" />
		</svg>
	);
}
