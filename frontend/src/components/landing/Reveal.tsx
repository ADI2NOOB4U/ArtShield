import { useRef, type CSSProperties, type ReactNode } from "react";
import { useInView } from "../../hooks/useInView";

type Props = {
	children: ReactNode;
	delay?: number;
	className?: string;
};

/** Fades and lifts its children into view once, when scrolled into the viewport. */
export default function Reveal({ children, delay = 0, className = "" }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const visible = useInView(ref, { threshold: 0.15 });
	const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
	return (
		<div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={style}>
			{children}
		</div>
	);
}
