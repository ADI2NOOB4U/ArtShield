import { useEffect, useState, type RefObject } from "react";

/**
 * Returns a 0..1 value describing how far a tall element has scrolled through the viewport.
 * 0 while the element's top is at or below the viewport top, 1 once its bottom reaches the viewport bottom.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>): number {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		let frame = 0;

		const update = () => {
			frame = 0;
			const rect = node.getBoundingClientRect();
			const total = rect.height - window.innerHeight;
			const value = total <= 0 ? (rect.top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / total));
			setProgress(value);
		};
		const schedule = () => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};

		update();
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, [ref]);

	return progress;
}
