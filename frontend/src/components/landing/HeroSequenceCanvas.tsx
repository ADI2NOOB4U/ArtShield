import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const FRAME_COUNT = 240;
const FRAME_SRC = (frame: number) =>
	`/hero-sequence/ezgif-frame-${String(frame + 1).padStart(3, "0")}.jpg`;

/**
 * Single-canvas, scroll-scrubbed renderer for the hero image sequence.
 *
 * Frames are decoded off-DOM (plain `Image` objects that are never
 * mounted) and painted onto one `<canvas>` element — there is exactly one
 * canvas in the DOM regardless of frame count. Document scroll progress
 * drives which frame is shown, so the background can remain fixed while
 * every landing-page section scrolls normally above it.
 */
export default function HeroSequenceCanvas() {
	const rootRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const framesRef = useRef<(HTMLImageElement | undefined)[]>(Array(FRAME_COUNT));
	const targetFrameRef = useRef(0);
	const rafRef = useRef(0);
	const latestScrollYRef = useRef(0);
	const drawFrameRef = useRef<() => void>(() => undefined);
	const [firstFrameReady, setFirstFrameReady] = useState(false);
	const [loadedCount, setLoadedCount] = useState(0);
	const reducedMotion = useReducedMotion();

	// Decode frames + paint to canvas.
	useEffect(() => {
		let cancelled = false;
		const frames = framesRef.current;

		const fitCanvasToBox = (canvas: HTMLCanvasElement) => {
			const { width, height } = canvas.getBoundingClientRect();
			if (width <= 0 || height <= 0) return null;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = Math.max(1, Math.round(width * dpr));
			const h = Math.max(1, Math.round(height * dpr));
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			return { width, height, dpr };
		};

		const nearestFrame = (index: number) => {
			if (frames[index]) return frames[index];
			for (let d = 1; d < FRAME_COUNT; d += 1) {
				if (frames[index - d]) return frames[index - d];
				if (frames[index + d]) return frames[index + d];
			}
			return undefined;
		};

		const draw = () => {
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			if (!canvas || !ctx) return;
			const size = fitCanvasToBox(canvas);
			if (!size) return;
			const image = nearestFrame(targetFrameRef.current);
			if (!image || !image.naturalWidth || !image.naturalHeight) return;

			const { width, height, dpr } = size;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			// "contain" fit — the full 16:9 frame is always visible, never cropped.
			const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
			const drawWidth = image.naturalWidth * scale;
			const drawHeight = image.naturalHeight * scale;
			ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
		};

		const requestDraw = () => {
			if (rafRef.current) return;
			rafRef.current = window.requestAnimationFrame(() => {
				rafRef.current = 0;
				draw();
			});
		};
		drawFrameRef.current = draw;

		const loadFrame = (index: number) =>
			new Promise<void>((resolve) => {
				const image = new Image();
				image.decoding = "async";
				image.onload = () => resolve();
				image.onerror = () => resolve();
				image.src = FRAME_SRC(index);
				frames[index] = image;
			});

		const run = async () => {
			// Frame 001 must be visible the moment it's decoded.
			await loadFrame(0);
			if (cancelled) return;
			setFirstFrameReady(true);
			setLoadedCount(1);
			requestDraw();

			if (reducedMotion) return; // keep only frame 1 when motion is reduced

			// Progressive load, a small batch at a time so the main thread
			// stays free and the page doesn't stall on 240 network requests.
			const BATCH = 4;
			for (let start = 1; start < FRAME_COUNT && !cancelled; start += BATCH) {
				const size = Math.min(BATCH, FRAME_COUNT - start);
				await Promise.all(Array.from({ length: size }, (_, i) => loadFrame(start + i)));
				if (cancelled) return;
				setLoadedCount((n) => n + size);
				requestDraw();
				await new Promise((resolve) => window.setTimeout(resolve, 0));
			}
		};
		void run();

		const onResize = () => requestDraw();
		window.addEventListener("resize", onResize);
		const resizeObserver =
			typeof ResizeObserver !== "undefined" && canvasRef.current
				? new ResizeObserver(() => requestDraw())
				: null;
		if (resizeObserver && canvasRef.current) resizeObserver.observe(canvasRef.current);

		return () => {
			cancelled = true;
			window.removeEventListener("resize", onResize);
			resizeObserver?.disconnect();
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current);
				rafRef.current = 0;
			}
		};
	}, [reducedMotion]);

	// Scroll-scrub: map the full document progress to a frame index.
	useEffect(() => {
		if (reducedMotion) return;
		const updateTargetFrame = () => {
			const travel = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
			const progress = Math.min(1, Math.max(0, latestScrollYRef.current / travel));
			targetFrameRef.current = Math.round(progress * (FRAME_COUNT - 1));
			rootRef.current?.setAttribute("data-frame-index", String(targetFrameRef.current));
			drawFrameRef.current();
		};
		const onScroll = () => {
			latestScrollYRef.current = window.scrollY;
			if (rafRef.current) return;
			rafRef.current = window.requestAnimationFrame(() => {
				rafRef.current = 0;
				updateTargetFrame();
			});
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current);
				rafRef.current = 0;
			}
		};
	}, [reducedMotion]);

	return (
		<div ref={rootRef} data-frame-index="0" className="relative h-full w-full overflow-hidden rounded-md">
			<canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full rounded-md" />
			{!firstFrameReady && (
				<div className="absolute inset-0 z-10 grid place-items-center rounded-md border border-white/10 bg-void-900/70">
					<span className="label-tech animate-pulse text-silver-400">Loading artwork</span>
				</div>
			)}
			<span className="sr-only" aria-live="polite">
				{firstFrameReady
					? `Artwork sequence loaded, ${loadedCount} of ${FRAME_COUNT} frames ready.`
					: "Artwork sequence loading."}
			</span>
		</div>
	);
}