import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState<boolean>(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);

	useEffect(() => {
		const media = window.matchMedia(QUERY);
		const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	return reduced;
}
