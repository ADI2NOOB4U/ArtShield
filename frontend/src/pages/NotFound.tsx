import ButtonLink from "../components/ui/ButtonLink";
import { ROUTES } from "../utils/constants";

export default function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-silver-100">
			<p className="label-tech">404</p>
			<h1 className="mt-6 font-display text-4xl font-medium tracking-tightest text-silver-50 sm:text-6xl">This page does not exist.</h1>
			<p className="mt-6 max-w-md text-silver-400">The address may be incorrect, or this part of ArtShield has not been built yet.</p>
			<div className="mt-10">
				<ButtonLink to={ROUTES.home} variant="ghost">
					Back to ArtShield
				</ButtonLink>
			</div>
		</main>
	);
}
