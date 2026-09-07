import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type SoundCue = "upload" | "activate" | "tick" | "success" | "scan" | "verify" | "click";

export interface AudioEngine {
	enabled: boolean;
	toggleSound: () => void;
	play: (cue: SoundCue) => void;
}

export function useAudioEngine(): AudioEngine {
	const [enabled, setEnabled] = useState<boolean>(true);
	const reducedMotion = useReducedMotion();
	const audioCtxRef = useRef<AudioContext | null>(null);

	const getAudioContext = useCallback((): AudioContext | null => {
		if (typeof window === "undefined") return null;
		const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!AudioCtx) return null;

		if (!audioCtxRef.current) {
			audioCtxRef.current = new AudioCtx();
		}
		if (audioCtxRef.current.state === "suspended") {
			void audioCtxRef.current.resume();
		}
		return audioCtxRef.current;
	}, []);

	useEffect(() => {
		return () => {
			if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
				void audioCtxRef.current.close();
			}
		};
	}, []);

	const toggleSound = useCallback(() => {
		setEnabled((prev) => !prev);
	}, []);

	const play = useCallback(
		(cue: SoundCue) => {
			if (!enabled || reducedMotion) return;

			try {
				const ctx = getAudioContext();
				if (!ctx) return;

				const now = ctx.currentTime;
				const masterGain = ctx.createGain();
				masterGain.gain.setValueAtTime(0.08, now); // quiet, restrained ceiling
				masterGain.connect(ctx.destination);

				switch (cue) {
					case "click": {
						// Ultra-subtle physical tap (40ms)
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(800, now);
						osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

						gain.gain.setValueAtTime(0.05, now);
						gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

						osc.connect(gain);
						gain.connect(masterGain);
						osc.start(now);
						osc.stop(now + 0.04);
						break;
					}

					case "tick": {
						// Quiet mechanical click (80ms)
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "triangle";
						osc.frequency.setValueAtTime(1200, now);
						osc.frequency.exponentialRampToValueAtTime(600, now + 0.07);

						gain.gain.setValueAtTime(0.04, now);
						gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

						osc.connect(gain);
						gain.connect(masterGain);
						osc.start(now);
						osc.stop(now + 0.08);
						break;
					}

					case "upload": {
						// Soft warm confirmation (200ms)
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(320, now);
						osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

						gain.gain.setValueAtTime(0.06, now);
						gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

						osc.connect(gain);
						gain.connect(masterGain);
						osc.start(now);
						osc.stop(now + 0.2);
						break;
					}

					case "activate": {
						// Subtle activation sweep (300ms)
						const osc = ctx.createOscillator();
						const filter = ctx.createBiquadFilter();
						const gain = ctx.createGain();

						osc.type = "sawtooth";
						osc.frequency.setValueAtTime(140, now);
						osc.frequency.exponentialRampToValueAtTime(280, now + 0.28);

						filter.type = "lowpass";
						filter.frequency.setValueAtTime(400, now);
						filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

						gain.gain.setValueAtTime(0.03, now);
						gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

						osc.connect(filter);
						filter.connect(gain);
						gain.connect(masterGain);
						osc.start(now);
						osc.stop(now + 0.3);
						break;
					}

					case "scan": {
						// Soft frequency sweep (400ms)
						const osc = ctx.createOscillator();
						const gain = ctx.createGain();
						osc.type = "sine";
						osc.frequency.setValueAtTime(440, now);
						osc.frequency.linearRampToValueAtTime(880, now + 0.2);
						osc.frequency.linearRampToValueAtTime(660, now + 0.4);

						gain.gain.setValueAtTime(0.04, now);
						gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

						osc.connect(gain);
						gain.connect(masterGain);
						osc.start(now);
						osc.stop(now + 0.4);
						break;
					}

					case "verify": {
						// Dual-tone verification harmonic (350ms)
						[523.25, 783.99].forEach((freq) => {
							const osc = ctx.createOscillator();
							const gain = ctx.createGain();
							osc.type = "sine";
							osc.frequency.setValueAtTime(freq, now);

							gain.gain.setValueAtTime(0.035, now);
							gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

							osc.connect(gain);
							gain.connect(masterGain);
							osc.start(now);
							osc.stop(now + 0.35);
						});
						break;
					}

					case "success": {
						// Restrained luxury chime (two rising harmonic chords)
						const chord = [440, 659.25, 880];
						chord.forEach((freq, idx) => {
							const osc = ctx.createOscillator();
							const gain = ctx.createGain();
							osc.type = "sine";
							const startOffset = idx * 0.06;
							osc.frequency.setValueAtTime(freq, now + startOffset);

							gain.gain.setValueAtTime(0.0001, now);
							gain.gain.setValueAtTime(0.04, now + startOffset);
							gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.35);

							osc.connect(gain);
							gain.connect(masterGain);
							osc.start(now + startOffset);
							osc.stop(now + startOffset + 0.35);
						});
						break;
					}
				}
			} catch {
				// Audio failure should never block UI interaction
			}
		},
		[enabled, reducedMotion, getAudioContext],
	);

	return { enabled, toggleSound, play };
}

