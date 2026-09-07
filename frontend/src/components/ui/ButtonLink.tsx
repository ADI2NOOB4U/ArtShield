import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
	to: string;
	variant?: "primary" | "ghost";
	size?: "sm" | "md";
	className?: string;
	children: ReactNode;
};

const base =
	"group inline-flex items-center justify-center gap-3 rounded-full font-mono uppercase tracking-techno transition-all duration-500 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

const sizes = {
	sm: "px-5 py-2.5 text-[11px]",
	md: "px-7 py-4 text-[12px]",
};

const variants = {
	primary: "bg-silver-50 text-ink-950 hover:bg-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_24px_60px_-24px_rgba(127,220,255,0.45)]",
	ghost: "border border-white/15 text-silver-100 hover:border-white/30 hover:bg-white/[0.04]",
};

export default function ButtonLink({ to, variant = "primary", size = "md", className = "", children }: Props) {
	return (
		<Link to={to} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
			<span>{children}</span>
			<span aria-hidden="true" className="inline-block h-px w-4 bg-current opacity-60 transition-all duration-500 ease-premium group-hover:w-7" />
		</Link>
	);
}
