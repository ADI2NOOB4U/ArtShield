import type { ReactNode } from "react";

type Props = {
	eyebrow: string;
	title: ReactNode;
	body?: ReactNode;
	align?: "left" | "center";
	className?: string;
};

export default function SectionHeading({ eyebrow, title, body, align = "left", className = "" }: Props) {
	const alignment = align === "center" ? "mx-auto items-center text-center" : "";
	return (
		<div className={`flex max-w-3xl flex-col gap-6 ${alignment} ${className}`}>
			<p className="label-tech">{eyebrow}</p>
			<h2 className="font-display text-4xl font-medium leading-[1.02] tracking-tightest text-silver-50 sm:text-5xl lg:text-6xl">{title}</h2>
			{body && <p className="max-w-xl text-base leading-relaxed text-silver-300 sm:text-lg">{body}</p>}
		</div>
	);
}
