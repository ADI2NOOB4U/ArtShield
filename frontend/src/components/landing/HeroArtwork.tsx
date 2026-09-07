import HeroSequenceCanvas from "./HeroSequenceCanvas";

export default function HeroArtwork() {
	return (
		<div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
			<HeroSequenceCanvas />
			<div className="cinematic-readability absolute inset-0" />
		</div>
	);
}
