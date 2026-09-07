import HeroSequenceCanvas from "./HeroSequenceCanvas";

export default function HeroArtwork() {
	return (
		<div className="pointer-events-none fixed inset-0 z-0 hero-artwork" aria-hidden="true">
			<div className="hero-artwork__frame"><HeroSequenceCanvas /></div>
			<div className="hero-artwork__reflection" />
			<div className="hero-artwork__film" />
			<div className="cinematic-readability absolute inset-0" />
		</div>
	);
}
