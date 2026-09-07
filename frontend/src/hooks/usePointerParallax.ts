import { useEffect, type RefObject } from "react";

/**
 * Writes smoothed pointer offsets (-1..1) to the CSS variables --px / --py on the element.
 * Only active for fine pointers; no-op on touch devices or when disabled.
 */
export function usePointerParallax<T extends HTMLElement>(ref: RefObject<T | null>, enabled: boolean): void {
	useEffect(() => {
		const node = ref.current;
		if (!node || !enabled) return;
		if (!window.matchMedia("(pointer: fine)").matches) return;

		let frame = 0;
		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;

		const render = () => {
			currentX += (targetX - currentX) * 0.08;
			currentY += (targetY - currentY) * 0.08;
			node.style.setProperty("--px", currentX.toFixed(4));
			node.style.setProperty("--py", currentY.toFixed(4));
			if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
				frame = window.requestAnimationFrame(render);
			} else {
				frame = 0;
			}
		};
		const schedule = () => {
			if (!frame) frame = window.requestAnimationFrame(render);
		};
		const onMove = (event: PointerEvent) => {
			const rect = node.getBoundingClientRect();
			targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
			targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
			schedule();
		};
		const onLeave = () => {
			targetX = 0;
			targetY = 0;
			schedule();
		};

		node.addEventListener("pointermove", onMove);
		node.addEventListener("pointerleave", onLeave);
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			node.removeEventListener("pointermove", onMove);
			node.removeEventListener("pointerleave", onLeave);
			node.style.removeProperty("--px");
			node.style.removeProperty("--py");
		};
	}, [ref, enabled]);
}
