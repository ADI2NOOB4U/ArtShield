import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import FinalCta from "../components/landing/FinalCta";
import Hero from "../components/landing/Hero";
import Problem from "../components/landing/Problem";
import ProtectionLayers from "../components/landing/ProtectionLayers";
import Provenance from "../components/landing/Provenance";
import ShieldIntro from "../components/landing/ShieldIntro";
import VerificationStory from "../components/landing/VerificationStory";

export default function Home() {
	return (
		<div className="min-h-screen bg-ink-950 text-silver-100">
			<Navbar />
			<main>
				<Hero />
				<Problem />
				<ShieldIntro />
				<ProtectionLayers />
				<Provenance />
				<VerificationStory />
				<FinalCta />
			</main>
			<Footer />
		</div>
	);
}
