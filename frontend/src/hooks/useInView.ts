import { useEffect, useState, type RefObject } from "react";

type Options = {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
};

export function useInView<T extends Element>(ref: RefObject<T | null>, { threshold = 0.2, rootMargin = "0px", once = true }: Options = {}): boolean {
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		if (typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setInView(true);
						if (once) observer.unobserve(entry.target);
					} else if (!once) {
						setInView(false);
					}
				}
			},
			{ threshold, rootMargin },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [ref, threshold, rootMargin, once]);

	return inView;
}
